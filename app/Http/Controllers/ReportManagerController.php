<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\KeyResult;
use App\Models\User;
use App\Models\Department;
use App\Models\CheckIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportManagerController extends Controller
{
    /**
     * Lấy danh sách OKR của tất cả thành viên trong phòng ban do quản lý phụ trách
     */
    public function getTeamOkrs(Request $request)
    {
        $user = Auth::user();
        
        // Kiểm tra quyền: chỉ manager mới được xem
        if (!$user->isManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập trang này.'
            ], 403);
        }

        // Lấy department_id của manager
        $managerDepartmentId = $user->department_id;
        if (!$managerDepartmentId) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chưa được gán vào phòng ban nào.'
            ], 400);
        }

        // Lấy danh sách thành viên trong phòng ban (không bao gồm manager)
        // Lấy tất cả user trong phòng ban trừ manager hiện tại
        $teamMembers = User::where('department_id', $managerDepartmentId)
            ->where('user_id', '!=', $user->user_id)
            ->with(['role', 'department'])
            ->get()
            ->filter(function($member) {
                // Lọc chỉ lấy member (không phải manager hoặc admin)
                if (!$member->role) return false;
                $roleName = strtolower(trim($member->role->role_name ?? ''));
                return $roleName === 'member';
            });

        // Lấy tất cả OKR của thành viên trong phòng ban
        $memberIds = $teamMembers->pluck('user_id')->toArray();
        
        // Debug: Log số lượng thành viên
        \Log::info('ReportManager: Team members found', [
            'manager_id' => $user->user_id,
            'department_id' => $managerDepartmentId,
            'team_members_count' => $teamMembers->count(),
            'member_ids' => $memberIds,
        ]);
        
        // Filters
        $cycleId = $request->integer('cycle_id');
        $memberId = $request->integer('member_id');
        $status = $request->string('status'); // completed, in_progress, at_risk, not_started
        $objectiveId = $request->integer('objective_id');

        // Lấy OKR cá nhân của thành viên (level = 'person')
        $personalObjectivesQuery = Objective::query()
            ->whereIn('user_id', $memberIds)
            ->where('level', 'person')
            ->whereNull('archived_at')
            ->with(['cycle', 'department', 'user'])
            ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
            ->when($memberId, fn($q) => $q->where('user_id', $memberId))
            ->when($objectiveId, fn($q) => $q->where('objective_id', $objectiveId));

        $personalObjectives = $personalObjectivesQuery->get();

        // Lấy OKR cấp nhóm (Team OKR - level = 'unit' và department_id = phòng ban)
        $teamObjectivesQuery = Objective::query()
            ->where('department_id', $managerDepartmentId)
            ->where('level', 'unit')
            ->whereNull('archived_at')
            ->with(['cycle', 'department', 'user'])
            ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
            ->when($objectiveId, fn($q) => $q->where('objective_id', $objectiveId));

        $teamObjectives = $teamObjectivesQuery->get();

        // Gộp tất cả objectives (cá nhân + nhóm)
        $objectives = $personalObjectives->merge($teamObjectives);

        // Load key results và tính toán tiến độ
        // Load check-ins mới nhất cho mỗi Key Result
        $objectiveIds = $objectives->pluck('objective_id');
        $keyResults = KeyResult::whereIn('objective_id', $objectiveIds)
            ->with(['assignedUser', 'assignee'])
            ->get()
            ->groupBy('objective_id');
        
        // Load check-ins mới nhất cho tất cả Key Results
        $krIds = $keyResults->flatten()->pluck('kr_id')->unique();
        $checkInRecords = collect();
        
        if ($krIds->isNotEmpty()) {
            $latestCheckIns = CheckIn::whereIn('kr_id', $krIds)
                ->selectRaw('kr_id, MAX(check_in_id) as max_check_in_id')
                ->groupBy('kr_id')
                ->pluck('max_check_in_id', 'kr_id');
            
            // Load full check-in records
            if ($latestCheckIns->isNotEmpty()) {
                $checkInRecords = CheckIn::whereIn('check_in_id', $latestCheckIns->values())
                    ->get()
                    ->keyBy('kr_id');
            }
        }

        // Tính toán tiến độ và trạng thái cho mỗi objective
        $okrsData = $objectives->map(function($obj) use ($keyResults, $status, $checkInRecords) {
            $krs = $keyResults->get($obj->objective_id, collect());
            
            // Tính tiến độ trung bình từ KRs
            $totalProgress = 0;
            $krCount = $krs->count();
            $completedKrs = 0;
            $inProgressKrs = 0;
            $notStartedKrs = 0;
            $atRiskKrs = 0;

            foreach ($krs as $kr) {
                // Ưu tiên lấy progress từ check-in mới nhất
                $progress = 0;
                $latestCheckIn = $checkInRecords->get($kr->kr_id);
                
                // 1. Kiểm tra check-in mới nhất trước (dữ liệu chính xác nhất)
                if ($latestCheckIn) {
                    $progress = (float) $latestCheckIn->progress_percent;
                }
                // 2. Nếu không có check-in, dùng progress_percent từ KeyResult
                elseif (!is_null($kr->progress_percent)) {
                    $progress = (float) $kr->progress_percent;
                }
                // 3. Nếu không có, tính từ current_value / target_value
                elseif ($kr->target_value && $kr->target_value > 0) {
                    $calculatedProgress = ($kr->current_value / $kr->target_value) * 100;
                    $progress = min(100, max(0, $calculatedProgress));
                }
                
                $progress = round($progress, 2);
                $totalProgress += $progress;

                if ($progress >= 100) {
                    $completedKrs++;
                } elseif ($progress > 0) {
                    $inProgressKrs++;
                    if ($progress < 50) {
                        $atRiskKrs++;
                    }
                } else {
                    $notStartedKrs++;
                }
            }

            $avgProgress = $krCount > 0 ? round($totalProgress / $krCount, 2) : 0;

            // Xác định trạng thái tổng thể
            $overallStatus = 'not_started';
            if ($avgProgress >= 100) {
                $overallStatus = 'completed';
            } elseif ($avgProgress >= 70) {
                $overallStatus = 'in_progress';
            } elseif ($avgProgress >= 40) {
                $overallStatus = 'at_risk';
            } else {
                $overallStatus = 'at_risk';
            }

            // Filter theo status nếu có
            if ($status && $overallStatus !== $status) {
                return null;
            }

            return [
                'objective_id' => $obj->objective_id,
                'objective_title' => $obj->obj_title,
                'objective_description' => $obj->description,
                'level' => $obj->level ?? 'person',
                'member_id' => $obj->user_id, // null nếu là OKR cấp nhóm
                'member_name' => $obj->user ? ($obj->user->full_name ?? 'N/A') : 'OKR Phòng ban',
                'member_email' => $obj->user ? ($obj->user->email ?? 'N/A') : null,
                'cycle_id' => $obj->cycle_id,
                'cycle_name' => $obj->cycle->cycle_name ?? 'N/A',
                'department_id' => $obj->department_id,
                'department_name' => $obj->department->d_name ?? 'N/A',
                'overall_progress' => $avgProgress,
                'overall_status' => $overallStatus,
                'key_results' => $krs->map(function($kr) use ($checkInRecords) {
                    // Ưu tiên lấy progress từ check-in mới nhất (giống như trên)
                    $krProgress = 0;
                    $latestCheckIn = $checkInRecords->get($kr->kr_id);
                    $currentValue = $kr->current_value ?? 0;
                    
                    // 1. Kiểm tra check-in mới nhất trước (dữ liệu chính xác nhất)
                    if ($latestCheckIn) {
                        $krProgress = (float) $latestCheckIn->progress_percent;
                        // Cập nhật current_value từ check-in mới nhất nếu có
                        if ($latestCheckIn->check_in_type === 'quantity') {
                            $currentValue = $latestCheckIn->progress_value;
                        }
                    }
                    // 2. Nếu không có check-in, dùng progress_percent từ KeyResult
                    elseif (!is_null($kr->progress_percent)) {
                        $krProgress = (float) $kr->progress_percent;
                    }
                    // 3. Nếu không có, tính từ current_value / target_value
                    elseif ($kr->target_value && $kr->target_value > 0) {
                        $calculatedProgress = ($kr->current_value / $kr->target_value) * 100;
                        $krProgress = min(100, max(0, $calculatedProgress));
                    }
                    
                    // Lấy assignee từ relationship
                    $assigneeUser = $kr->assignedUser ?? $kr->assignee ?? null;
                    
                    return [
                        'kr_id' => $kr->kr_id,
                        'kr_title' => $kr->kr_title,
                        'current_value' => $currentValue,
                        'target_value' => $kr->target_value,
                        'progress_percent' => round($krProgress, 2),
                        'unit' => $kr->unit,
                        'status' => $kr->status,
                        'assignee' => $assigneeUser ? [
                            'user_id' => $assigneeUser->user_id,
                            'full_name' => $assigneeUser->full_name,
                            'email' => $assigneeUser->email,
                        ] : null,
                        'last_check_in_at' => $latestCheckIn ? $latestCheckIn->created_at->toISOString() : null,
                    ];
                })->values(),
                'kr_stats' => [
                    'total' => $krCount,
                    'completed' => $completedKrs,
                    'in_progress' => $inProgressKrs,
                    'not_started' => $notStartedKrs,
                    'at_risk' => $atRiskKrs,
                ],
            ];
        })->filter()->values();

        // Tách OKR cá nhân và OKR cấp nhóm
        $personalOkrs = $okrsData->filter(function($okr) {
            return isset($okr['member_id']) && $okr['member_id'] !== null;
        })->values();
        
        $teamOkrs = $okrsData->filter(function($okr) {
            return !isset($okr['member_id']) || $okr['member_id'] === null;
        })->values();

        // Tính toán báo cáo tổng quan (tất cả OKR: cá nhân + nhóm)
        // $okrsData đã bao gồm cả OKR cá nhân ($personalOkrs) và OKR cấp nhóm ($teamOkrs)
        $totalOkrs = $okrsData->count();
        $completedOkrs = $okrsData->where('overall_status', 'completed')->count();
        $inProgressOkrs = $okrsData->where('overall_status', 'in_progress')->count();
        $atRiskOkrs = $okrsData->where('overall_status', 'at_risk')->count();
        $notStartedOkrs = $okrsData->where('overall_status', 'not_started')->count();
        // Tỷ lệ hoàn thành trung bình của TẤT CẢ OKR (cá nhân + nhóm)
        // Dữ liệu progress được tính từ check-in mới nhất của từng Key Result
        $averageProgress = $totalOkrs > 0 ? round($okrsData->avg('overall_progress'), 2) : 0;

        // Tính tỷ lệ hoàn thành trung bình cho từng thành viên (chỉ OKR cá nhân)
        $memberProgress = [];
        foreach ($teamMembers as $member) {
            $memberPersonalOkrs = $personalOkrs->where('member_id', $member->user_id);
            $memberAvgProgress = $memberPersonalOkrs->count() > 0 
                ? round($memberPersonalOkrs->avg('overall_progress'), 2) 
                : 0;
            $memberProgress[] = [
                'user_id' => $member->user_id,
                'full_name' => $member->full_name,
                'email' => $member->email,
                'job_title' => $member->job_title,
                'average_progress' => $memberAvgProgress,
                'total_okrs' => $memberPersonalOkrs->count(),
                'completed_okrs' => $memberPersonalOkrs->where('overall_status', 'completed')->count(),
            ];
        }

        // Nếu không có thành viên nào, trả về dữ liệu rỗng
        if (empty($memberIds) && $teamOkrs->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'okrs' => [],
                    'personal_okrs' => [],
                    'team_okrs' => [],
                    'team_members' => [],
                    'member_progress' => [],
                    'summary' => [
                        'total_okrs' => 0,
                        'completed_okrs' => 0,
                        'in_progress_okrs' => 0,
                        'at_risk_okrs' => 0,
                        'not_started_okrs' => 0,
                        'average_progress' => 0,
                        'completion_rate' => 0,
                    ],
                    'department' => [
                        'department_id' => $managerDepartmentId,
                        'department_name' => $user->department->d_name ?? 'N/A',
                    ],
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'okrs' => $okrsData, // Tất cả OKR (cá nhân + nhóm) để tương thích với code cũ
                'personal_okrs' => $personalOkrs, // OKR cá nhân
                'team_okrs' => $teamOkrs, // OKR cấp nhóm
                'team_members' => $teamMembers->values()->map(function($member) {
                    return [
                        'user_id' => $member->user_id,
                        'full_name' => $member->full_name,
                        'email' => $member->email,
                        'job_title' => $member->job_title,
                    ];
                }),
                'member_progress' => $memberProgress, // Tỷ lệ hoàn thành trung bình của từng thành viên
                'summary' => [
                    'total_okrs' => $totalOkrs,
                    'completed_okrs' => $completedOkrs,
                    'in_progress_okrs' => $inProgressOkrs,
                    'at_risk_okrs' => $atRiskOkrs,
                    'not_started_okrs' => $notStartedOkrs,
                    'average_progress' => $averageProgress, // Tỷ lệ hoàn thành trung bình của tất cả OKR (cá nhân + nhóm)
                    'completion_rate' => $totalOkrs > 0 ? round(($completedOkrs / $totalOkrs) * 100, 2) : 0,
                ],
                'department' => [
                    'department_id' => $managerDepartmentId,
                    'department_name' => $user->department->d_name ?? 'N/A',
                ],
            ],
        ]);
    }

    /**
     * Lấy lịch sử check-in của một Key Result
     */
    public function getCheckInHistory(Request $request, $objectiveId, $krId)
    {
        $user = Auth::user();
        
        if (!$user->isManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập.'
            ], 403);
        }

        // Kiểm tra OKR thuộc về thành viên trong phòng ban của manager
        $objective = Objective::with('user')->find($objectiveId);
        if (!$objective) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy Objective.'
            ], 404);
        }

        if ($objective->user->department_id !== $user->department_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xem OKR này.'
            ], 403);
        }

        $checkIns = CheckIn::where('kr_id', $krId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $checkIns->map(function($checkIn) {
                return [
                    'check_in_id' => $checkIn->check_in_id,
                    'progress_percent' => $checkIn->progress_percent,
                    'current_value' => $checkIn->current_value,
                    'notes' => $checkIn->notes,
                    'created_at' => $checkIn->created_at->toISOString(),
                    'created_by' => $checkIn->user ? [
                        'user_id' => $checkIn->user->user_id,
                        'full_name' => $checkIn->user->full_name,
                    ] : null,
                ];
            }),
        ]);
    }
}


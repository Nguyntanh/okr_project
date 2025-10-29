<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Objective;
use App\Models\KeyResult;
use App\Models\Department;
use App\Models\Cycle;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * Hiển thị trang báo cáo
     */
    public function index()
    {
        return view('app');
    }

    /**
     * API: Lấy dữ liệu báo cáo nhóm của tôi
     */
    public function getMyTeamReport(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Người dùng chưa đăng nhập'
                ], 401);
            }

            // Lấy cycle_id từ request (nếu có)
            $cycleId = $request->query('cycle_id');

            // Lấy department của manager
            $managerDepartment = Department::where('department_id', $user->department_id)->first();
            
            if (!$managerDepartment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không thuộc nhóm nào'
                ], 404);
            }

            // Build query để lấy tất cả OKR trong nhóm (load check-ins để có progress mới nhất)
            $objectivesQuery = Objective::with([
                'keyResults.checkIns' => function($query) {
                    $query->latest()->limit(1); // Chỉ lấy check-in gần nhất
                },
                'user', 
                'department', 
                'cycle'
            ])
                ->where(function($query) use ($managerDepartment, $cycleId) {
                    // OKR cấp nhóm/phòng ban (của team này)
                    $query->where(function($q1) use ($managerDepartment) {
                        $q1->where('department_id', $managerDepartment->department_id)
                          ->whereIn('level', ['team', 'unit']);
                    });
                    
                    // OKR do các thành viên trong team tạo
                    $query->orWhere(function($q2) use ($managerDepartment) {
                        $q2->whereIn('user_id', function($subQuery) use ($managerDepartment) {
                            $subQuery->select('user_id')
                                ->from('users')
                                ->where('department_id', $managerDepartment->department_id);
                        });
                    });
                });

            // Filter theo cycle nếu có
            if ($cycleId) {
                $objectivesQuery->where('cycle_id', $cycleId);
            }

            $objectives = $objectivesQuery->get();

            // Lấy danh sách thành viên trong team
            $teamMembers = User::where('department_id', $managerDepartment->department_id)->get();

            // Tính toán dữ liệu báo cáo
            $reportData = $this->calculateReportData($objectives, $teamMembers, $managerDepartment, $cycleId);

            return response()->json([
                'success' => true,
                'data' => $reportData,
                'department_name' => $managerDepartment->d_name
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy dữ liệu báo cáo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tính toán dữ liệu báo cáo
     */
    private function calculateReportData($objectives, $teamMembers, $managerDepartment, $cycleId)
    {
        // 1. Tính tỷ lệ hoàn thành trung bình của team (bao gồm OKR cá nhân và OKR nhóm)
        // Tính progress của tất cả Key Results của thành viên trong nhóm
        $teamMemberIds = $teamMembers->pluck('user_id');
        $allMemberKeyResults = KeyResult::whereIn('user_id', $teamMemberIds)
            ->with('objective')
            ->get()
            ->filter(function($kr) use ($cycleId) {
                if ($cycleId) {
                    return $kr->objective && $kr->objective->cycle_id == $cycleId;
                }
                return true;
            });

        // Tính progress trung bình của tất cả Key Results
        $teamAverageCompletion = $allMemberKeyResults->count() > 0
            ? round($allMemberKeyResults->avg('progress_percent'), 2)
            : 0;

        // 2. Danh sách OKR cấp nhóm/đơn vị với tiến độ
        $teamOKRs = [];
        foreach ($objectives as $objective) {
            // Lấy tất cả OKR không phải personal (team, unit)
            if (in_array($objective->level, ['team', 'unit'])) {
                // Đếm tất cả Key Results của thành viên trong nhóm
                $teamMemberIds = $teamMembers->pluck('user_id');
                $allMemberKeyResults = KeyResult::whereIn('user_id', $teamMemberIds)
                    ->with('objective')
                    ->get()
                    ->filter(function($kr) use ($cycleId) {
                        if ($cycleId) {
                            return $kr->objective && $kr->objective->cycle_id == $cycleId;
                        }
                        return true;
                    });

                $totalKR = $allMemberKeyResults->count();
                $completedKR = $allMemberKeyResults->filter(function($kr) {
                    return ($kr->progress_percent ?? 0) >= 100;
                })->count();

                // Tính tiến độ dựa trên tất cả Key Results của thành viên
                $teamProgress = $totalKR > 0
                    ? round($allMemberKeyResults->avg('progress_percent'), 2)
                    : 0;

                $teamOKRs[] = [
                    'objective_id' => $objective->objective_id,
                    'obj_title' => $objective->obj_title,
                    'description' => $objective->description,
                    'status' => $objective->status,
                    'level' => $objective->level,
                    'progress' => $teamProgress,
                    'creator_name' => $objective->user ? $objective->user->full_name : null,
                    'creator_email' => $objective->user ? $objective->user->email : null,
                    'key_results_count' => $totalKR,
                    'completed_kr_count' => $completedKR,
                ];
            }
        }

        // 3. Danh sách thành viên với tỷ lệ hoàn thành OKR cá nhân
        $membersData = [];
        foreach ($teamMembers as $member) {
            // Lấy tất cả OKR do thành viên này tạo
            $personalOKRs = $objectives->where('user_id', $member->user_id);

            // Lấy tất cả Key Results do thành viên này tạo (từ database, filter theo cycle)
            $allKeyResults = KeyResult::where('user_id', $member->user_id)
                ->with('objective')
                ->get()
                ->filter(function($kr) use ($cycleId) {
                    if ($cycleId) {
                        return $kr->objective && $kr->objective->cycle_id == $cycleId;
                    }
                    return true;
                });

            $totalKeyResults = $allKeyResults->count();
            $completedKeyResults = $allKeyResults->filter(function($kr) {
                return ($kr->progress_percent ?? 0) >= 100;
            })->count();

            // Tỷ lệ hoàn thành = trung bình progress của tất cả Key Results
            $averageCompletion = $totalKeyResults > 0 
                ? round($allKeyResults->avg('progress_percent'), 2) 
                : 0;

            $membersData[] = [
                'user_id' => $member->user_id,
                'full_name' => $member->full_name,
                'email' => $member->email,
                'average_completion' => $averageCompletion,
                'personal_okr_count' => $personalOKRs->count(),
                'completed_okr_count' => $completedKeyResults,
                'total_kr_count' => $totalKeyResults,
            ];
        }

        return [
            'team_average_completion' => $teamAverageCompletion,
            'total_okr_count' => $objectives->count(),
            'team_okrs' => $teamOKRs,
            'members' => $membersData,
        ];
    }

    /**
     * API: Lấy danh sách cycles
     */
    public function getCycles()
    {
        try {
            $cycles = Cycle::where('status', 'active')
                ->orderBy('start_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $cycles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách cycles: ' . $e->getMessage()
            ], 500);
        }
    }
}

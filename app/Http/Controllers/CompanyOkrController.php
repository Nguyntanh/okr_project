<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\Cycle;
use App\Models\Department;
use App\Models\OkrLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class CompanyOkrController extends Controller
{
    /**
     * Hiển thị OKR toàn công ty
     */
    public function index(Request $request): JsonResponse|View
    {
        $currentCycleId = null;
        $currentCycleName = null;

        // === 1. XÁC ĐỊNH CHU KỲ HIỆN TẠI - GIỐNG HỆT MyObjectiveController ===
        if (!$request->filled('cycle_id')) {
            $now = Carbon::now('Asia/Ho_Chi_Minh');
            $year = $now->year;
            $quarter = ceil($now->month / 3);
            $cycleNameDisplay = "Quý {$quarter} năm {$year}";

            $currentCycle = Cycle::where('start_date', '<=', $now)
                ->where('end_date', '>=', $now)
                ->first();

            if (!$currentCycle) {
                $possibleNames = [$cycleNameDisplay, "Q{$quarter} {$year}", "Q{$quarter} - {$year}"];
                $currentCycle = Cycle::whereIn('cycle_name', $possibleNames)->first();
            }

            if ($currentCycle) {
                $currentCycleId = $currentCycle->cycle_id;
                $currentCycleName = $currentCycle->cycle_name;
                $request->merge(['cycle_id' => $currentCycleId]);
            } else {
                $currentCycleName = $cycleNameDisplay;
            }
        } else {
            $currentCycle = Cycle::find($request->cycle_id);
            if ($currentCycle) {
                $currentCycleId = $currentCycle->cycle_id;
                $currentCycleName = $currentCycle->cycle_name;
            }
        }

        // === 2. QUERY OKR CÔNG KHAI (chỉ company + unit) ===
        $query = Objective::with([
                'keyResults' => fn($q) => $q->with('assignedUser')->whereNull('archived_at'),
                'department',
                'cycle',
                'user' => fn($q) => $q->select('user_id', 'full_name', 'avatar_url'),
            ])
            ->whereNull('archived_at')
            ->whereIn('level', ['company', 'unit'])
            ->when($request->filled('cycle_id'), fn($q) => $q->where('cycle_id', $request->cycle_id))
            ->orderByRaw("CASE WHEN level = 'company' THEN 1 ELSE 2 END")
            ->orderBy('department_id')
            ->orderBy('created_at', 'desc');

        $objectives = $query->get();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => $objectives,                    // ← mảng Objective
                'current_cycle_id' => $currentCycleId,
                'current_cycle_name' => $currentCycleName,
            ]);
        }

        // Nếu truy cập trực tiếp bằng trình duyệt (không cần login)
        $cycles = Cycle::orderByDesc('start_date')->get();
        return view('app', compact('objectives', 'cycles', 'currentCycleId', 'currentCycleName'));
    }

    /**
     * Chi tiết 1 Objective (nếu cần cho modal)
     */
    public function show(string $id): JsonResponse
    {
        try {
            $objective = Objective::with([
                    'keyResults' => fn($q) => $q->active()->with('assignedUser'),
                    'department',
                    'cycle',
                    'user',
                    'assignments.user'
                ])
                ->findOrFail($id);

            $user = Auth::user();
            if (!$user->isAdmin() && $objective->level !== 'company' 
                && ($objective->level === 'unit' && $objective->department_id !== $user->department_id)) {
                return response()->json(['success' => false, 'message' => 'Không có quyền xem'], 403);
            }

            return response()->json(['success' => true, 'data' => $objective]);

        } catch (\Exception $e) {
            Log::error('CompanyOkrController::show error', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Lỗi tải chi tiết'], 500);
        }
    }

    // Helper methods (giữ nguyên)
    private function getCurrentCycle($request)
    {
        if ($request->filled('cycle_id')) {
            return Cycle::find($request->cycle_id);
        }

        $now = Carbon::now('Asia/Ho_Chi_Minh');
        return Cycle::where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->first();
    }

    private function calculateOverallProgress($objectives)
    {
        $totalWeight = 0;
        $weightedProgress = 0;

        foreach ($objectives as $obj) {
            $objProgress = $obj->keyResults->avg('progress_percent') ?? 0;
            $weight = $obj->level === 'company' ? 1.5 : 1;
            $totalWeight += $weight;
            $weightedProgress += $objProgress * $weight;
        }

        return $totalWeight > 0 ? round($weightedProgress / $totalWeight, 1) : 0;
    }

    /**
     * Tree View: Lấy OKR theo cấu trúc phân cấp Company > Department > Person
     */
    public function treeView(Request $request): JsonResponse|View
    {
        $currentCycleId = null;
        $currentCycleName = null;

        // Xác định cycle hiện tại
        if (!$request->filled('cycle_id')) {
            $now = Carbon::now('Asia/Ho_Chi_Minh');
            $year = $now->year;
            $quarter = ceil($now->month / 3);
            $cycleNameDisplay = "Quý {$quarter} năm {$year}";

            $currentCycle = Cycle::where('start_date', '<=', $now)
                ->where('end_date', '>=', $now)
                ->first();

            if (!$currentCycle) {
                $possibleNames = [$cycleNameDisplay, "Q{$quarter} {$year}", "Q{$quarter} - {$year}"];
                $currentCycle = Cycle::whereIn('cycle_name', $possibleNames)->first();
            }

            if ($currentCycle) {
                $currentCycleId = $currentCycle->cycle_id;
                $currentCycleName = $currentCycle->cycle_name;
                $request->merge(['cycle_id' => $currentCycleId]);
            } else {
                $currentCycleName = $cycleNameDisplay;
            }
        } else {
            $currentCycle = Cycle::find($request->cycle_id);
            if ($currentCycle) {
                $currentCycleId = $currentCycle->cycle_id;
                $currentCycleName = $currentCycle->cycle_name;
            }
        }

        // Lấy user hiện tại
        $user = Auth::user();

        // Lấy tất cả OKR theo 3 level: company, unit, person
        // Với OKR cá nhân: CHỈ Member xem được của chính mình, Admin/Manager KHÔNG xem được OKR cá nhân
        $objectives = Objective::with([
                'keyResults' => fn($q) => $q->with('assignedUser')->whereNull('archived_at'),
                'department',
                'user' => fn($q) => $q->select('user_id', 'full_name', 'avatar_url', 'department_id'),
                'targetLinks.targetObjective' => fn($q) => $q->with(['department', 'user'])->whereNull('archived_at'),
                'targetLinks.targetKr' => fn($q) => $q->with(['assignedUser', 'objective'])->whereNull('archived_at'),
            ])
            ->whereNull('archived_at')
            ->where(function ($q) use ($user) {
                // OKR cấp company và unit: ai cũng xem được
                $q->whereIn('level', ['company', 'unit']);
                
                // OKR cấp person: CHỈ Member xem được của chính mình
                // Admin/Manager không xem được OKR cá nhân
                $q->orWhere(function ($subQ) use ($user) {
                    $subQ->where('level', 'person')
                         ->where('user_id', $user->user_id);
                });
            })
            ->when($request->filled('cycle_id'), fn($q) => $q->where('cycle_id', $request->cycle_id))
            ->get();

        // Nhóm dữ liệu theo cấu trúc: Company -> Departments -> Users
        $treeData = [
            'company' => [],
            'departments' => [],
        ];

        // 1. Lấy tất cả OKR cấp company
        $companyObjectives = $objectives->where('level', 'company')->values();
        $treeData['company'] = $companyObjectives->map(function ($companyObj) use ($objectives) {
            // Lấy các OKR được liên kết (O->O) - chuyển thành virtual KR
            // Tìm các link có target_objective_id = O công ty và source_objective_id không null
            $linkedObjectivesAsKR = OkrLink::where('target_objective_id', $companyObj->objective_id)
                ->whereNotNull('source_objective_id')
                ->whereNull('target_kr_id') // Chỉ lấy O->O, không lấy O->KR
                ->where('is_active', true)
                ->where('status', OkrLink::STATUS_APPROVED)
                ->with(['sourceObjective' => fn($q) => $q->with(['department', 'user', 'keyResults' => fn($krQ) => $krQ->with('assignedUser')->whereNull('archived_at')])->whereNull('archived_at')])
                ->get()
                ->filter(function ($link) {
                    return $link->sourceObjective 
                        && $link->sourceObjective->archived_at === null;
                })
                ->map(function ($link) use ($objectives) {
                    $linkedObj = $link->sourceObjective; // Lấy source (O nguồn) thay vì target
                    $foundObj = $objectives->firstWhere('objective_id', $linkedObj->objective_id);
                    if (!$foundObj) {
                        return null;
                    }
                    // Load keyResults của O nguồn
                    $keyResults = $foundObj->keyResults->map(function ($kr) {
                        return [
                            'kr_id' => $kr->kr_id,
                            'kr_title' => $kr->kr_title,
                            'target_value' => $kr->target_value,
                            'current_value' => $kr->current_value,
                            'unit' => $kr->unit,
                            'status' => $kr->status,
                            'progress_percent' => $kr->progress_percent,
                            'assigned_user' => $kr->assignedUser ? [
                                'user_id' => $kr->assignedUser->user_id,
                                'full_name' => $kr->assignedUser->full_name,
                                'avatar_url' => $kr->assignedUser->avatar_url,
                            ] : null,
                            'is_linked' => false,
                        ];
                    })->toArray();
                    
                    // Tạo virtual KR từ O nguồn
                    return [
                        'kr_id' => 'linked_obj_' . $foundObj->objective_id, // ID giả để phân biệt
                        'kr_title' => $foundObj->obj_title,
                        'target_value' => 0,
                        'current_value' => 0,
                        'unit' => 'number',
                        'status' => $foundObj->status,
                        'progress_percent' => $foundObj->progress_percent,
                        'assigned_user' => $foundObj->user ? [
                            'user_id' => $foundObj->user->user_id,
                            'full_name' => $foundObj->user->full_name,
                            'avatar_url' => $foundObj->user->avatar_url,
                        ] : null,
                        'is_linked' => true,
                        'is_linked_objective' => true, // Flag để phân biệt O->O với O->KR
                        'linked_objective_data' => [
                            'objective_id' => $foundObj->objective_id,
                            'obj_title' => $foundObj->obj_title,
                            'description' => $foundObj->description,
                            'status' => $foundObj->status,
                            'progress_percent' => $foundObj->progress_percent,
                            'level' => $foundObj->level,
                            'department_id' => $foundObj->department_id,
                            'd_name' => $foundObj->department ? $foundObj->department->d_name : null,
                            'user_id' => $foundObj->user_id,
                            'full_name' => $foundObj->user ? $foundObj->user->full_name : null,
                            'key_results' => $keyResults, // KR của O nguồn
                        ],
                    ];
                })
                ->filter()
                ->values()
                ->toArray();

            // Lấy các KR được liên kết (O->KR)
            // Logic: Tìm link có target_kr_id và target_kr.objective_id = O cấp cao
            $linkedKeyResults = $companyObj->targetLinks
                ->filter(function ($link) use ($companyObj) {
                    // Kiểm tra: link có target_kr và KR đó thuộc về O cấp cao này
                    return $link->targetKr 
                        && $link->targetKr->archived_at === null
                        && $link->targetKr->objective_id === $companyObj->objective_id;
                })
                ->map(function ($link) {
                    $linkedKr = $link->targetKr;
                    return [
                        'kr_id' => $linkedKr->kr_id,
                        'kr_title' => $linkedKr->kr_title,
                        'target_value' => $linkedKr->target_value,
                        'current_value' => $linkedKr->current_value,
                        'unit' => $linkedKr->unit,
                        'status' => $linkedKr->status,
                        'progress_percent' => $linkedKr->progress_percent,
                        'assigned_user' => $linkedKr->assignedUser ? [
                            'user_id' => $linkedKr->assignedUser->user_id,
                            'full_name' => $linkedKr->assignedUser->full_name,
                            'avatar_url' => $linkedKr->assignedUser->avatar_url,
                        ] : null,
                        'is_linked' => true, // Đánh dấu đây là KR được liên kết
                    ];
                })
                ->toArray();

            // Merge KR thông thường và KR được liên kết
            // Với mỗi KR, tìm các O cấp dưới liên kết lên KR đó (O->KR)
            $allKeyResults = $companyObj->keyResults->map(function ($kr) use ($objectives) {
                // Tìm các O cấp dưới liên kết lên KR này (O->KR)
                // Logic: Tìm link có target_kr_id = kr_id và source_objective_id không null
                $krLinkedObjectives = OkrLink::where('target_kr_id', $kr->kr_id)
                    ->whereNotNull('source_objective_id')
                    ->where('is_active', true)
                    ->where('status', OkrLink::STATUS_APPROVED)
                    ->with(['sourceObjective' => fn($q) => $q->with(['department', 'user', 'keyResults' => fn($krQ) => $krQ->with('assignedUser')->whereNull('archived_at')])->whereNull('archived_at')])
                    ->get()
                    ->filter(function ($link) {
                        return $link->sourceObjective && $link->sourceObjective->archived_at === null;
                    })
                    ->map(function ($link) use ($objectives) {
                        $sourceObj = $link->sourceObjective;
                        $foundObj = $objectives->firstWhere('objective_id', $sourceObj->objective_id);
                        if (!$foundObj) {
                            return null;
                        }
                        // Load keyResults của O được liên kết
                        $keyResults = $foundObj->keyResults->map(function ($kr) {
                            return [
                                'kr_id' => $kr->kr_id,
                                'kr_title' => $kr->kr_title,
                                'target_value' => $kr->target_value,
                                'current_value' => $kr->current_value,
                                'unit' => $kr->unit,
                                'status' => $kr->status,
                                'progress_percent' => $kr->progress_percent,
                                'assigned_user' => $kr->assignedUser ? [
                                    'user_id' => $kr->assignedUser->user_id,
                                    'full_name' => $kr->assignedUser->full_name,
                                    'avatar_url' => $kr->assignedUser->avatar_url,
                                ] : null,
                                'is_linked' => false,
                            ];
                        })->toArray();
                        
                        return [
                            'objective_id' => $foundObj->objective_id,
                            'obj_title' => $foundObj->obj_title,
                            'description' => $foundObj->description,
                            'status' => $foundObj->status,
                            'progress_percent' => $foundObj->progress_percent,
                            'level' => $foundObj->level,
                            'department_id' => $foundObj->department_id,
                            'd_name' => $foundObj->department ? $foundObj->department->d_name : null,
                            'user_id' => $foundObj->user_id,
                            'full_name' => $foundObj->user ? $foundObj->user->full_name : null,
                            'key_results' => $keyResults, // Thêm keyResults của O được liên kết
                            'is_linked' => true,
                        ];
                    })
                    ->filter()
                    ->values()
                    ->toArray();

                return [
                    'kr_id' => $kr->kr_id,
                    'kr_title' => $kr->kr_title,
                    'target_value' => $kr->target_value,
                    'current_value' => $kr->current_value,
                    'unit' => $kr->unit,
                    'status' => $kr->status,
                    'progress_percent' => $kr->progress_percent,
                    'assigned_user' => $kr->assignedUser ? [
                        'user_id' => $kr->assignedUser->user_id,
                        'full_name' => $kr->assignedUser->full_name,
                        'avatar_url' => $kr->assignedUser->avatar_url,
                    ] : null,
                    'is_linked' => false,
                    'linked_objectives' => $krLinkedObjectives, // Thêm linked objectives cho KR
                ];
            })->toArray();

            // Merge và loại bỏ trùng lặp (nếu KR vừa là KR thông thường vừa là linked)
            // Bao gồm cả virtual KR từ O->O links
            $mergedKeyResults = [];
            $seenKrIds = [];
            foreach (array_merge($allKeyResults, $linkedKeyResults, $linkedObjectivesAsKR) as $kr) {
                if (!in_array($kr['kr_id'], $seenKrIds)) {
                    $mergedKeyResults[] = $kr;
                    $seenKrIds[] = $kr['kr_id'];
                }
            }

            // Loại bỏ các O đã liên kết với KR khỏi linked_objectives của O
            // (để tránh hiển thị trùng lặp)
            $objectiveIdsLinkedToKrs = [];
            foreach ($mergedKeyResults as $kr) {
                if (isset($kr['linked_objectives']) && is_array($kr['linked_objectives'])) {
                    foreach ($kr['linked_objectives'] as $linkedObj) {
                        if (isset($linkedObj['objective_id'])) {
                            $objectiveIdsLinkedToKrs[] = $linkedObj['objective_id'];
                        }
                    }
                }
            }
            // Loại bỏ các O đã được chuyển thành virtual KR (O->O)
            foreach ($linkedObjectivesAsKR as $virtualKr) {
                if (isset($virtualKr['linked_objective_data']['objective_id'])) {
                    $objectiveIdsLinkedToKrs[] = $virtualKr['linked_objective_data']['objective_id'];
                }
            }

            return [
                'objective_id' => $companyObj->objective_id,
                'obj_title' => $companyObj->obj_title,
                'description' => $companyObj->description,
                'status' => $companyObj->status,
                'progress_percent' => $companyObj->progress_percent,
                'level' => $companyObj->level,
                'key_results' => $mergedKeyResults,
                'linked_objectives' => [], // Không còn linked_objectives vì O->O đã chuyển thành virtual KR
            ];
        })->toArray();

        // 2. Thu thập tất cả các O đã được liên kết với KR (O->KR) để loại bỏ khỏi cấu trúc departments
        $allObjectivesLinkedToKrs = [];
        foreach ($objectives as $obj) {
            foreach ($obj->keyResults as $kr) {
                $krLinkedObjectives = OkrLink::where('target_kr_id', $kr->kr_id)
                    ->whereNotNull('source_objective_id')
                    ->where('is_active', true)
                    ->where('status', OkrLink::STATUS_APPROVED)
                    ->pluck('source_objective_id')
                    ->toArray();
                $allObjectivesLinkedToKrs = array_merge($allObjectivesLinkedToKrs, $krLinkedObjectives);
            }
        }
        $allObjectivesLinkedToKrs = array_unique($allObjectivesLinkedToKrs);

        // 3. Thu thập tất cả các O đã được liên kết với O khác (O->O) để loại bỏ khỏi cấu trúc departments
        $allObjectivesLinkedToObjectives = OkrLink::whereNotNull('source_objective_id')
            ->whereNotNull('target_objective_id')
            ->whereNull('target_kr_id') // Chỉ lấy O->O, không lấy O->KR
            ->where('is_active', true)
            ->where('status', OkrLink::STATUS_APPROVED)
            ->pluck('source_objective_id')
            ->unique()
            ->toArray();

        // Gộp cả hai danh sách: O đã liên kết với KR và O đã liên kết với O
        $allLinkedObjectives = array_unique(array_merge($allObjectivesLinkedToKrs, $allObjectivesLinkedToObjectives));

        // 2. Lấy tất cả departments có OKR cấp unit (từ danh sách objectives đã có)
        // Loại bỏ các O đã được liên kết với KR hoặc O
        $unitObjectives = $objectives->where('level', 'unit')
            ->filter(function ($obj) use ($allLinkedObjectives) {
                return !in_array($obj->objective_id, $allLinkedObjectives);
            })
            ->values();
        $departmentIds = $unitObjectives->pluck('department_id')->filter()->unique()->toArray();
        $departments = Department::whereIn('department_id', $departmentIds)->get();

        foreach ($departments as $dept) {
            // Lấy OKR cấp unit của department này
            // Loại bỏ các O đã được liên kết với KR hoặc O
            $unitObjectives = $objectives->where('level', 'unit')
                ->where('department_id', $dept->department_id)
                ->filter(function ($obj) use ($allLinkedObjectives) {
                    return !in_array($obj->objective_id, $allLinkedObjectives);
                })
                ->values();

            if ($unitObjectives->isEmpty()) {
                continue;
            }

            $deptNode = [
                'department_id' => $dept->department_id,
                'd_name' => $dept->d_name,
                'objectives' => [],
            ];

            foreach ($unitObjectives as $unitObj) {
                // Lấy các OKR được liên kết (O->O) - chuyển thành virtual KR
                // Tìm các link có target_objective_id = O phòng ban và source_objective_id không null
                $linkedObjectivesAsKR = OkrLink::where('target_objective_id', $unitObj->objective_id)
                    ->whereNotNull('source_objective_id')
                    ->whereNull('target_kr_id') // Chỉ lấy O->O, không lấy O->KR
                    ->where('is_active', true)
                    ->where('status', OkrLink::STATUS_APPROVED)
                    ->with(['sourceObjective' => fn($q) => $q->with(['department', 'user', 'keyResults' => fn($krQ) => $krQ->with('assignedUser')->whereNull('archived_at')])->whereNull('archived_at')])
                    ->get()
                    ->filter(function ($link) {
                        return $link->sourceObjective 
                            && $link->sourceObjective->archived_at === null;
                    })
                    ->map(function ($link) use ($objectives) {
                        $linkedObj = $link->sourceObjective; // Lấy source (O nguồn) thay vì target
                        $foundObj = $objectives->firstWhere('objective_id', $linkedObj->objective_id);
                        if (!$foundObj) {
                            return null;
                        }
                        // Load keyResults của O nguồn
                        $keyResults = $foundObj->keyResults->map(function ($kr) {
                            return [
                                'kr_id' => $kr->kr_id,
                                'kr_title' => $kr->kr_title,
                                'target_value' => $kr->target_value,
                                'current_value' => $kr->current_value,
                                'unit' => $kr->unit,
                                'status' => $kr->status,
                                'progress_percent' => $kr->progress_percent,
                                'assigned_user' => $kr->assignedUser ? [
                                    'user_id' => $kr->assignedUser->user_id,
                                    'full_name' => $kr->assignedUser->full_name,
                                    'avatar_url' => $kr->assignedUser->avatar_url,
                                ] : null,
                                'is_linked' => false,
                            ];
                        })->toArray();
                        
                        // Tạo virtual KR từ O nguồn
                        return [
                            'kr_id' => 'linked_obj_' . $foundObj->objective_id, // ID giả để phân biệt
                            'kr_title' => $foundObj->obj_title,
                            'target_value' => 0,
                            'current_value' => 0,
                            'unit' => 'number',
                            'status' => $foundObj->status,
                            'progress_percent' => $foundObj->progress_percent,
                            'assigned_user' => $foundObj->user ? [
                                'user_id' => $foundObj->user->user_id,
                                'full_name' => $foundObj->user->full_name,
                                'avatar_url' => $foundObj->user->avatar_url,
                            ] : null,
                            'is_linked' => true,
                            'is_linked_objective' => true, // Flag để phân biệt O->O với O->KR
                            'linked_objective_data' => [
                                'objective_id' => $foundObj->objective_id,
                                'obj_title' => $foundObj->obj_title,
                                'description' => $foundObj->description,
                                'status' => $foundObj->status,
                                'progress_percent' => $foundObj->progress_percent,
                                'level' => $foundObj->level,
                                'department_id' => $foundObj->department_id,
                                'd_name' => $foundObj->department ? $foundObj->department->d_name : null,
                                'user_id' => $foundObj->user_id,
                                'full_name' => $foundObj->user ? $foundObj->user->full_name : null,
                                'key_results' => $keyResults, // KR của O nguồn
                            ],
                        ];
                    })
                    ->filter()
                    ->values()
                    ->toArray();

                // Lấy các KR được liên kết (O->KR)
                // Logic: Tìm link có target_kr_id và target_kr.objective_id = O cấp cao
                $linkedKeyResults = $unitObj->targetLinks
                    ->filter(function ($link) use ($unitObj) {
                        // Kiểm tra: link có target_kr và KR đó thuộc về O cấp cao này
                        return $link->targetKr 
                            && $link->targetKr->archived_at === null
                            && $link->targetKr->objective_id === $unitObj->objective_id;
                    })
                    ->map(function ($link) {
                        $linkedKr = $link->targetKr;
                        return [
                            'kr_id' => $linkedKr->kr_id,
                            'kr_title' => $linkedKr->kr_title,
                            'target_value' => $linkedKr->target_value,
                            'current_value' => $linkedKr->current_value,
                            'unit' => $linkedKr->unit,
                            'status' => $linkedKr->status,
                            'progress_percent' => $linkedKr->progress_percent,
                            'assigned_user' => $linkedKr->assignedUser ? [
                                'user_id' => $linkedKr->assignedUser->user_id,
                                'full_name' => $linkedKr->assignedUser->full_name,
                                'avatar_url' => $linkedKr->assignedUser->avatar_url,
                            ] : null,
                            'is_linked' => true,
                        ];
                    })
                    ->toArray();

                // Merge KR thông thường và KR được liên kết
                // Với mỗi KR, tìm các O cấp dưới liên kết lên KR đó (O->KR)
                $allKeyResults = $unitObj->keyResults->map(function ($kr) use ($objectives) {
                    // Tìm các O cấp dưới liên kết lên KR này (O->KR)
                    $krLinkedObjectives = OkrLink::where('target_kr_id', $kr->kr_id)
                        ->whereNotNull('source_objective_id')
                        ->where('is_active', true)
                        ->where('status', OkrLink::STATUS_APPROVED)
                        ->with(['sourceObjective' => fn($q) => $q->with(['department', 'user', 'keyResults' => fn($krQ) => $krQ->with('assignedUser')->whereNull('archived_at')])->whereNull('archived_at')])
                        ->get()
                        ->filter(function ($link) {
                            return $link->sourceObjective && $link->sourceObjective->archived_at === null;
                        })
                        ->map(function ($link) use ($objectives) {
                            $sourceObj = $link->sourceObjective;
                            $foundObj = $objectives->firstWhere('objective_id', $sourceObj->objective_id);
                            if (!$foundObj) {
                                return null;
                            }
                            // Load keyResults của O được liên kết
                            $keyResults = $foundObj->keyResults->map(function ($kr) {
                                return [
                                    'kr_id' => $kr->kr_id,
                                    'kr_title' => $kr->kr_title,
                                    'target_value' => $kr->target_value,
                                    'current_value' => $kr->current_value,
                                    'unit' => $kr->unit,
                                    'status' => $kr->status,
                                    'progress_percent' => $kr->progress_percent,
                                    'assigned_user' => $kr->assignedUser ? [
                                        'user_id' => $kr->assignedUser->user_id,
                                        'full_name' => $kr->assignedUser->full_name,
                                        'avatar_url' => $kr->assignedUser->avatar_url,
                                    ] : null,
                                    'is_linked' => false,
                                ];
                            })->toArray();
                            
                            return [
                                'objective_id' => $foundObj->objective_id,
                                'obj_title' => $foundObj->obj_title,
                                'description' => $foundObj->description,
                                'status' => $foundObj->status,
                                'progress_percent' => $foundObj->progress_percent,
                                'level' => $foundObj->level,
                                'department_id' => $foundObj->department_id,
                                'd_name' => $foundObj->department ? $foundObj->department->d_name : null,
                                'user_id' => $foundObj->user_id,
                                'full_name' => $foundObj->user ? $foundObj->user->full_name : null,
                                'key_results' => $keyResults, // Thêm keyResults của O được liên kết
                                'is_linked' => true,
                            ];
                        })
                        ->filter()
                        ->values()
                        ->toArray();

                    return [
                        'kr_id' => $kr->kr_id,
                        'kr_title' => $kr->kr_title,
                        'target_value' => $kr->target_value,
                        'current_value' => $kr->current_value,
                        'unit' => $kr->unit,
                        'status' => $kr->status,
                        'progress_percent' => $kr->progress_percent,
                        'assigned_user' => $kr->assignedUser ? [
                            'user_id' => $kr->assignedUser->user_id,
                            'full_name' => $kr->assignedUser->full_name,
                            'avatar_url' => $kr->assignedUser->avatar_url,
                        ] : null,
                        'is_linked' => false,
                        'linked_objectives' => $krLinkedObjectives, // Thêm linked objectives cho KR
                    ];
                })->toArray();

                // Merge và loại bỏ trùng lặp
                // Bao gồm cả virtual KR từ O->O links
                $mergedKeyResults = [];
                $seenKrIds = [];
                foreach (array_merge($allKeyResults, $linkedKeyResults, $linkedObjectivesAsKR) as $kr) {
                    if (!in_array($kr['kr_id'], $seenKrIds)) {
                        $mergedKeyResults[] = $kr;
                        $seenKrIds[] = $kr['kr_id'];
                    }
                }

                // Loại bỏ các O đã liên kết với KR khỏi linked_objectives của O
                // (để tránh hiển thị trùng lặp)
                $objectiveIdsLinkedToKrs = [];
                foreach ($mergedKeyResults as $kr) {
                    if (isset($kr['linked_objectives']) && is_array($kr['linked_objectives'])) {
                        foreach ($kr['linked_objectives'] as $linkedObj) {
                            if (isset($linkedObj['objective_id'])) {
                                $objectiveIdsLinkedToKrs[] = $linkedObj['objective_id'];
                            }
                        }
                    }
                }
                // Loại bỏ các O đã được chuyển thành virtual KR (O->O)
                foreach ($linkedObjectivesAsKR as $virtualKr) {
                    if (isset($virtualKr['linked_objective_data']['objective_id'])) {
                        $objectiveIdsLinkedToKrs[] = $virtualKr['linked_objective_data']['objective_id'];
                    }
                }

                $unitNode = [
                    'objective_id' => $unitObj->objective_id,
                    'obj_title' => $unitObj->obj_title,
                    'description' => $unitObj->description,
                    'status' => $unitObj->status,
                    'progress_percent' => $unitObj->progress_percent,
                    'level' => $unitObj->level,
                    'key_results' => $mergedKeyResults,
                    'linked_objectives' => [], // Không còn linked_objectives vì O->O đã chuyển thành virtual KR
                    'users' => [],
                ];

                // 3. Lấy OKR cấp person của users trong department này
                // Chỉ hiển thị user có OKR cá nhân (đã được filter ở trên)
                $deptUsers = \App\Models\User::where('department_id', $dept->department_id)->get();
                
                foreach ($deptUsers as $deptUser) {
                    // Lọc OKR cá nhân của user này (đã được filter theo quyền ở query trên)
                    // Loại bỏ các O đã được liên kết với KR hoặc O
                    $userObjectives = $objectives->where('level', 'person')
                        ->where('user_id', $deptUser->user_id)
                        ->filter(function ($obj) use ($allLinkedObjectives) {
                            return !in_array($obj->objective_id, $allLinkedObjectives);
                        })
                        ->values();

                    if ($userObjectives->isEmpty()) {
                        continue;
                    }

                    $userNode = [
                        'user_id' => $deptUser->user_id,
                        'full_name' => $deptUser->full_name,
                        'avatar_url' => $deptUser->avatar_url,
                        'objectives' => $userObjectives->map(function ($personObj) {
                            return [
                                'objective_id' => $personObj->objective_id,
                                'obj_title' => $personObj->obj_title,
                                'description' => $personObj->description,
                                'status' => $personObj->status,
                                'progress_percent' => $personObj->progress_percent,
                                'level' => $personObj->level,
                                'key_results' => $personObj->keyResults->map(function ($kr) {
                                    return [
                                        'kr_id' => $kr->kr_id,
                                        'kr_title' => $kr->kr_title,
                                        'target_value' => $kr->target_value,
                                        'current_value' => $kr->current_value,
                                        'unit' => $kr->unit,
                                        'status' => $kr->status,
                                        'progress_percent' => $kr->progress_percent,
                                        'assigned_user' => $kr->assignedUser ? [
                                            'user_id' => $kr->assignedUser->user_id,
                                            'full_name' => $kr->assignedUser->full_name,
                                            'avatar_url' => $kr->assignedUser->avatar_url,
                                        ] : null,
                                    ];
                                })->toArray(),
                            ];
                        })->toArray(),
                    ];

                    $unitNode['users'][] = $userNode;
                }

                $deptNode['objectives'][] = $unitNode;
            }

            $treeData['departments'][] = $deptNode;
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => $treeData,
                'current_cycle_id' => $currentCycleId,
                'current_cycle_name' => $currentCycleName,
            ]);
        }

        // Nếu truy cập trực tiếp bằng trình duyệt
        $cycles = Cycle::orderByDesc('start_date')->get();
        return view('app', compact('treeData', 'cycles', 'currentCycleId', 'currentCycleName'));
    }
}
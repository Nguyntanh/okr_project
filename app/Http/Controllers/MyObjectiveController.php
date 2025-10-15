<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\KeyResult;
use App\Models\Cycle;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class MyObjectiveController extends Controller
{
    /**
     * Hiển thị danh sách Objective của người dùng.
     */
    public function index(Request $request): JsonResponse|View
    {
        $user = Auth::user();
        $objectives = Objective::with(['keyResults', 'department', 'cycle'])
            ->where('user_id', $user->user_id)
            ->orderByDesc('objective_id')
            ->paginate(10);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $objectives]);
        }

        return view('app');
    }

    /**
     * Hiển thị form tạo Objective.
     */
    public function create(): View
    {
        $cycles = Cycle::all();
        $departments = Department::all();

        return view('my-objectives.create', compact('cycles', 'departments'));
    }

    /**
     * Lưu Objective mới (hỗ trợ tạo kèm Key Results).
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $user = Auth::user();

        // Filter out empty key_results before validation
        $data = $request->all();
        if (isset($data['key_results']) && is_array($data['key_results'])) {
            $data['key_results'] = array_filter($data['key_results'], function($kr) {
                return !empty($kr['kr_title']) && !empty($kr['unit']);
            });
            // Re-index array
            $data['key_results'] = array_values($data['key_results']);
        }
        
        // Create validator manually
        $validator = \Illuminate\Support\Facades\Validator::make($data, [
            'obj_title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:company,unit,team,person',
            'status' => 'required|in:draft,active,completed',
            'cycle_id' => 'required|exists:cycles,cycle_id',
            'department_id' => 'nullable|exists:departments,department_id',
            'key_results' => 'required|array|min:1',
            'key_results.*.kr_title' => 'required|string|max:255',
            'key_results.*.target_value' => 'nullable|numeric|min:0',
            'key_results.*.current_value' => 'nullable|numeric|min:0',
            'key_results.*.unit' => 'required|in:number,percent,completion,bai',
            'key_results.*.status' => 'required|in:draft,active,completed',
        ], [
            'key_results.required' => 'Phải có ít nhất một Key Result.',
            'key_results.min' => 'Phải có ít nhất một Key Result.',
            'key_results.*.kr_title.required' => 'Tiêu đề Key Result không được để trống.',
            'key_results.*.unit.required' => 'Đơn vị Key Result không được để trống.',
            'key_results.*.status.required' => 'Trạng thái Key Result không được để trống.',
        ]);
        
        if ($validator->fails()) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $validator->errors()->first()], 422)
                : redirect()->back()->withErrors($validator)->withInput();
        }
        
        $validated = $validator->validated();

        // Kiểm tra quyền tạo dựa trên cấp độ
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($validated['level'], $allowedLevels)) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo Objective ở cấp độ này.'], 403)
                : redirect()->back()->withErrors(['error' => 'Bạn không có quyền tạo Objective ở cấp độ này.']);
        }

        // Kiểm tra department_id cho cấp độ không phải company
        if ($validated['level'] !== 'company' && empty($validated['department_id'])) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Phải chọn phòng ban cho cấp độ không phải company.'], 422)
                : redirect()->back()->withErrors(['error' => 'Phải chọn phòng ban cho cấp độ không phải company.']);
        }

        // Hạn chế: Member/Manager chỉ được tạo cho phòng ban của mình
        if (in_array($validated['level'], ['unit','team'])) {
            if ($user->isMember() || $user->isManager()) {
                if (!$user->department_id || (int)$validated['department_id'] !== (int)$user->department_id) {
                    return $request->expectsJson()
                        ? response()->json(['success' => false, 'message' => 'Bạn chỉ được tạo Objective cho phòng ban của mình.'], 403)
                        : redirect()->back()->withErrors(['error' => 'Bạn chỉ được tạo Objective cho phòng ban của mình.']);
                }
            }
        }

        try {
            $objective = DB::transaction(function () use ($validated, $user) {
                $objective = Objective::create([
                    'obj_title' => $validated['obj_title'],
                    'description' => $validated['description'] ?? null,
                    'level' => $validated['level'],
                    'status' => $validated['status'],
                    'cycle_id' => $validated['cycle_id'],
                    'department_id' => $validated['department_id'] ?? null,
                    'user_id' => $user->user_id, // Lưu user_id để xác định chủ sở hữu
                ]);

                if (isset($validated['key_results']) && is_array($validated['key_results'])) {
                    foreach ($validated['key_results'] as $krData) {
                        // Skip KR nếu thiếu thông tin quan trọng
                        if (empty($krData['kr_title']) || !isset($krData['unit']) || !isset($krData['status'])) {
                            continue;
                        }

                        $target = (float) ($krData['target_value'] ?? 0);
                        $current = (float) ($krData['current_value'] ?? 0);
                        $progress = $target > 0 ? max(0, min(100, ($current / $target) * 100)) : 0;

                        KeyResult::create([
                            'kr_title' => $krData['kr_title'],
                            'target_value' => $target,
                            'current_value' => $current,
                            'unit' => $krData['unit'],
                            'status' => $krData['status'],
                            'progress_percent' => $progress,
                            'objective_id' => $objective->objective_id,
                            'cycle_id' => $objective->cycle_id,
                        ]);
                    }
                }

                return $objective->load(['keyResults', 'department', 'cycle']);
            });

            return $request->expectsJson()
                ? response()->json(['success' => true, 'message' => 'Objective được tạo thành công!', 'data' => $objective])
                : redirect()->route('my-objectives.index')->with('success', 'Objective được tạo thành công!');
        } catch (\Exception $e) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Tạo Objective thất bại: ' . $e->getMessage()], 500)
                : redirect()->back()->withErrors(['error' => 'Tạo Objective thất bại: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Cập nhật Objective hiện có.
     */
    public function update(Request $request, string $id): JsonResponse|RedirectResponse
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($id);

        // Kiểm tra quyền: Chỉ chủ sở hữu (user_id) được cập nhật
        if ($objective->user_id !== $user->user_id) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Bạn không có quyền cập nhật Objective này.'], 403)
                : redirect()->back()->withErrors(['error' => 'Bạn không có quyền cập nhật Objective này.']);
        }

        $validated = $request->validate([
            'obj_title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:company,unit,team,person',
            'status' => 'required|in:draft,active,completed',
            'cycle_id' => 'required|exists:cycles,cycle_id',
            'department_id' => 'nullable|exists:departments,department_id',
        ]);

        // Hạn chế: Member/Manager chỉ được cập nhật phòng ban của mình nếu level không phải company/person
        if (in_array($validated['level'], ['unit','team'])) {
            if (($user->isMember() || $user->isManager())) {
                if (!$user->department_id || (int)($validated['department_id'] ?? $objective->department_id) !== (int)$user->department_id) {
                    return $request->expectsJson()
                        ? response()->json(['success' => false, 'message' => 'Bạn chỉ được cập nhật Objective cho phòng ban của mình.'], 403)
                        : redirect()->back()->withErrors(['error' => 'Bạn chỉ được cập nhật Objective cho phòng ban của mình.']);
                }
            }
        }

        // Kiểm tra quyền cập nhật cấp độ
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($validated['level'], $allowedLevels)) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Bạn không có quyền cập nhật Objective sang cấp độ này.'], 403)
                : redirect()->back()->withErrors(['error' => 'Bạn không có quyền cập nhật Objective sang cấp độ này.']);
        }

        try {
            $objective = DB::transaction(function () use ($validated, $objective) {
                $objective->update($validated);
                return $objective->load(['keyResults', 'department', 'cycle']);
            });

            return $request->expectsJson()
                ? response()->json(['success' => true, 'message' => 'Objective được cập nhật thành công!', 'data' => $objective])
                : redirect()->route('my-objectives.index')->with('success', 'Objective được cập nhật thành công!');
        } catch (\Exception $e) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Cập nhật Objective thất bại: ' . $e->getMessage()], 500)
                : redirect()->back()->withErrors(['error' => 'Cập nhật Objective thất bại: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Xóa Objective.
     */
    public function destroy(string $id): JsonResponse|RedirectResponse
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($id);

        // Kiểm tra quyền: Chỉ chủ sở hữu (user_id) được xóa
        if ($objective->user_id !== $user->user_id) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xóa Objective này.'], 403);
        }

        try {
            DB::transaction(function () use ($objective) {
                $objective->keyResults()->delete();
                $objective->delete();
            });

            return response()->json(['success' => true, 'message' => 'Objective đã được xóa thành công!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Xóa Objective thất bại: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Lấy chi tiết Objective (API JSON).
     */
    public function getObjectiveDetails(string $id): JsonResponse
    {
        $user = Auth::user();
        $objective = Objective::with(['keyResults', 'department', 'cycle'])->findOrFail($id);

        // Kiểm tra quyền: Chỉ chủ sở hữu (user_id) được xem
        if ($objective->user_id !== $user->user_id) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem Objective này.'], 403);
        }

        return response()->json(['success' => true, 'data' => $objective]);
    }

    /**
     * Lấy chi tiết Key Result (API JSON).
     */
    public function getKeyResultDetails(string $id): JsonResponse
    {
        $user = Auth::user();
        $keyResult = KeyResult::with(['objective', 'cycle'])->findOrFail($id);

        // Kiểm tra quyền: Chỉ chủ sở hữu của Objective được xem
        if ($keyResult->objective->user_id !== $user->user_id) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem Key Result này.'], 403);
        }

        return response()->json(['success' => true, 'data' => $keyResult]);
    }

    /**
     * Lấy danh sách cấp độ được phép dựa trên vai trò (API JSON).
     */
    public function getAllowedLevelsApi(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
        
        $roleName = $user->role ? $user->role->role_name : 'member';
        $allowedLevels = $this->getAllowedLevels($roleName);
        return response()->json(['success' => true, 'data' => $allowedLevels]);
    }

    /**
     * Lấy danh sách cấp độ Objective được phép dựa trên vai trò.
     */
    private function getAllowedLevels(string $roleName): array
    {
        return match (strtolower($roleName)) {
            'admin' => ['company', 'unit', 'team', 'person'],
            'manager' => ['unit', 'team', 'person'],
            'member' => ['person'],
            default => ['person'],
        };
    }

    /**
     * Lấy thông tin user và các level được phép
     */
    public function getUserLevels(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $allowedLevels = $this->getAllowedLevels($user->role ? $user->role->role_name : 'member');
        
        return response()->json([
            'success' => true,
            'user_role' => $user->role ? $user->role->role_name : 'member',
            'allowed_levels' => $allowedLevels,
            'user_department_id' => $user->department_id
        ]);
    }

    /**
     * Dev: Seed sample objectives for current user
     */
    public function seedForCurrentUser(): \Illuminate\Http\JsonResponse
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!app()->environment('local')) {
            return response()->json(['success' => false, 'message' => 'Not allowed in this environment'], 403);
        }

        $cycle = \App\Models\Cycle::orderByDesc('cycle_id')->first();
        if (!$cycle) {
            $cycle = \App\Models\Cycle::create([
                'cycle_name' => 'Q' . now()->quarter . ' ' . now()->year,
                'start_date' => now()->startOfQuarter(),
                'end_date' => now()->endOfQuarter(),
                'status' => 'active',
                'description' => 'Auto-created for seeding'
            ]);
        }

        $created = [];

        foreach ([
            ['title' => 'Improve product quality', 'level' => 'person'],
            ['title' => 'Increase team velocity', 'level' => 'team'],
            ['title' => 'Grow revenue', 'level' => 'unit'],
        ] as $spec) {
            $objective = \App\Models\Objective::create([
                'obj_title' => $spec['title'],
                'description' => 'Seeded objective for testing',
                'level' => $spec['level'],
                'status' => 'active',
                'cycle_id' => $cycle->cycle_id,
                'department_id' => $spec['level'] === 'company' ? null : ($user->department_id ?? null),
                'user_id' => $user->user_id,
            ]);

            $krs = [
                ['kr_title' => 'Reduce bugs reported', 'target_value' => 100, 'current_value' => 10, 'unit' => 'number', 'status' => 'active'],
                ['kr_title' => 'Automated test coverage', 'target_value' => 80, 'current_value' => 30, 'unit' => 'percent', 'status' => 'active'],
            ];
            foreach ($krs as $kr) {
                \App\Models\KeyResult::create([
                    'kr_title' => $kr['kr_title'],
                    'target_value' => $kr['target_value'],
                    'current_value' => $kr['current_value'],
                    'unit' => $kr['unit'],
                    'status' => $kr['status'],
                    'weight' => 1,
                    'department_id' => $objective->department_id,
                    'objective_id' => $objective->objective_id,
                    'cycle_id' => $cycle->cycle_id,
                    'progress_percent' => 0,
                ]);
            }

            $created[] = $objective->load('keyResults');
        }

        return response()->json(['success' => true, 'data' => $created]);
    }
}
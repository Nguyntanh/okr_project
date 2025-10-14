<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\KeyResult;
use App\Models\Cycle;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class MyObjectiveController extends Controller
{
    /**
     * Hiển thị danh sách Objectives của người dùng
     */
    public function index(Request $request): JsonResponse|View
    {
        $user = Auth::user();
        $objectives = Objective::with(['keyResults', 'department', 'cycle'])
            ->where('user_id', $user->id)
            ->paginate(10);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $objectives]);
        }

        // return view('my-objectives.index', compact('objectives'));
        return view('app');
    }

    /**
     * Hiển thị form tạo Objective
     */
    public function create(): View
    {
        $user = Auth::user();
        $cycles = Cycle::all();
        $departments = Department::all();

        return view('my-objectives.create', compact('cycles', 'departments'));
    }

    /**
     * Lưu Objective (hỗ trợ tạo kèm Key Results)
     * @return JsonResponse|RedirectResponse
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'obj_title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:company,unit,team,person',
            'status' => 'required|in:draft,active,completed',
            'cycle_id' => 'required|exists:cycles,cycle_id',
            'department_id' => 'nullable|exists:departments,department_id',
            'key_results' => 'nullable|array',
            'key_results.*.kr_title' => 'required|string|max:255',
            'key_results.*.target_value' => 'required|numeric|min:0',
            'key_results.*.current_value' => 'nullable|numeric|min:0',
            'key_results.*.unit' => 'required|string|max:50',
            'key_results.*.status' => 'required|in:draft,active,completed',
        ]);

        // Kiểm tra quyền tạo dựa trên level
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($validated['level'], $allowedLevels)) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo Objective ở level này.'], 403);
            }
            return redirect()->back()->withErrors(['error' => 'Bạn không có quyền tạo Objective ở level này.']);
        }

        // Nếu level != company và không có department_id, lỗi
        if ($validated['level'] !== 'company' && empty($validated['department_id'])) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Phải chọn phòng ban cho level không phải company.'], 422);
            }
            return redirect()->back()->withErrors(['error' => 'Phải chọn phòng ban cho level không phải company.']);
        }

        try {
            /** @var Objective|null $objective */
            $objective = null;
            DB::transaction(function () use ($validated, $user, &$objective) {
                $objectiveData = [
                    'obj_title' => $validated['obj_title'],
                    'description' => $validated['description'] ?? null,
                    'level' => $validated['level'],
                    'status' => $validated['status'],
                    'cycle_id' => $validated['cycle_id'],
                    'department_id' => $validated['department_id'] ?? null,
                    'user_id' => $user->id,
                ];

                $objective = Objective::create($objectiveData);

                if (isset($validated['key_results'])) {
                    foreach ($validated['key_results'] as $krData) {
                        $target = (float) $krData['target_value'];
                        $current = (float) ($krData['current_value'] ?? 0);
                        $progress = $target > 0 ? max(0, min(100, ($current / $target) * 100)) : 0;

                        KeyResult::create([
                            'kr_title' => $krData['kr_title'],
                            'target_value' => $target,
                            'current_value' => $current,
                            'unit' => $krData['unit'],
                            'status' => $krData['status'],
                            'weight' => 0,
                            'progress_percent' => $progress,
                            'objective_id' => $objective->objective_id,
                            'cycle_id' => $objective->cycle_id,
                            'department_id' => $objective->department_id,
                            'user_id' => $user->id,
                        ]);
                    }
                }
            });

            // Kiểm tra nếu $objective vẫn là null
            if (!$objective) {
                throw new \Exception('Không thể tạo Objective.');
            }

            $objective->load(['keyResults', 'department', 'cycle']);

            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'message' => 'Objective được tạo thành công!', 'data' => $objective]);
            }
            return redirect()->route('my-objectives.index')->with('success', 'Objective được tạo thành công!');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Lưu Objective thất bại: ' . $e->getMessage()], 500);
            }
            return redirect()->back()->withErrors(['error' => 'Lưu Objective thất bại: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Hiển thị form chỉnh sửa Objective
     */
    public function edit(string $id): View
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($id);
        $cycles = Cycle::all();
        $departments = Department::all();

        // Kiểm tra quyền chỉnh sửa
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'person')) {
            abort(403, 'Bạn không có quyền chỉnh sửa Objective này.');
        }

        return view('my-objectives.edit', compact('objective', 'cycles', 'departments'));
    }

    /**
     * Cập nhật Objective
     */
    public function update(Request $request, string $id): JsonResponse|RedirectResponse
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($id);

        // Kiểm tra quyền cập nhật
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'person')) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền cập nhật Objective này.'], 403);
            }
            return redirect()->back()->withErrors(['error' => 'Bạn không có quyền cập nhật Objective này.']);
        }

        $validated = $request->validate([
            'obj_title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:company,unit,team,person',
            'status' => 'required|in:draft,active,completed',
            'cycle_id' => 'required|exists:cycles,cycle_id',
            'department_id' => 'nullable|exists:departments,department_id',
        ]);

        try {
            DB::transaction(function () use ($validated, $objective) {
                $objective->update($validated);
            });

            $objective->load(['keyResults', 'department', 'cycle']);

            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'message' => 'Objective được cập nhật thành công!', 'data' => $objective]);
            }
            return redirect()->route('my-objectives.index')->with('success', 'Objective được cập nhật thành công!');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Cập nhật Objective thất bại: ' . $e->getMessage()], 500);
            }
            return redirect()->back()->withErrors(['error' => 'Cập nhật Objective thất bại: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Xóa Objective
     */
    public function destroy(string $id): JsonResponse|RedirectResponse
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($id);

        // Kiểm tra quyền xóa
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'person')) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xóa Objective này.'], 403);
        }

        try {
            DB::transaction(function () use ($objective) {
                // Xóa Key Results liên quan trước
                $objective->keyResults()->delete();
                $objective->delete();
            });

            return response()->json(['success' => true, 'message' => 'Objective đã được xóa thành công!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Xóa Objective thất bại: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Lấy chi tiết Objective (JSON API)
     */
    public function getObjectiveDetails(string $id): JsonResponse
    {
        $user = Auth::user();
        $objective = Objective::with(['keyResults', 'department', 'cycle'])->findOrFail($id);

        // Kiểm tra quyền xem
        if ($objective->user_id !== $user->id && !in_array($user->role->role_name, ['admin', 'manager'])) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem Objective này.'], 403);
        }

        return response()->json(['success' => true, 'data' => $objective]);
    }

    /**
     * Lấy chi tiết Key Result (JSON API)
     */
    public function getKeyResultDetails(string $id): JsonResponse
    {
        $user = Auth::user();
        $keyResult = KeyResult::with(['objective', 'department', 'cycle'])->findOrFail($id);

        // Kiểm tra quyền xem
        if ($keyResult->objective->user_id !== $user->id && !in_array($user->role->role_name, ['admin', 'manager'])) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem Key Result này.'], 403);
        }

        return response()->json(['success' => true, 'data' => $keyResult]);
    }

    /**
     * Lấy danh sách cấp Objective được phép dựa trên vai trò
     */
    private function getAllowedLevels(string $roleName): array
    {
        return match ($roleName) {
            'admin' => ['company', 'unit', 'team', 'person'],
            'manager' => ['unit', 'team', 'person'],
            'member' => ['person'],
            default => ['person'],
        };
    }
}
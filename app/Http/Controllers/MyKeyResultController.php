<?php

namespace App\Http\Controllers;

use App\Models\KeyResult;
use App\Models\Objective;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class MyKeyResultController extends Controller
{
    /**
     * Hiển thị danh sách Key Results của người dùng
     */
    public function index(): View
    {
        $user = Auth::user();
        $keyResults = KeyResult::with(['objective.user', 'objective.department'])
            ->whereHas('objective', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->paginate(10);

        return view('app');
    }

    /**
     * Hiển thị form tạo Key Result
     */
    public function create(string $objectiveId): View
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($objectiveId);

        // Kiểm tra quyền tạo KR
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'Cá nhân')) {
            return view('app');
        }

        return view('app');
    }

    /**
     * Lưu Key Result
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $objectiveId = $request->input('objective_id');

        // Kiểm tra objective_id không null
        if (!$objectiveId) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy ID của Objective.'], 422);
            }
            return redirect()->back()
                ->withErrors(['error' => 'Không tìm thấy ID của Objective.'])
                ->withInput();
        }

        $objective = Objective::findOrFail($objectiveId);

        // Kiểm tra quyền tạo KR
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'Cá nhân')) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo Key Result cho Objective này.'], 403);
            }
            return redirect()->back()->withErrors(['error' => 'Bạn không có quyền tạo Key Result cho Objective này.']);
        }

        // Validate dữ liệu
        $validated = $request->validate([
            'kr_title' => 'required|string|max:255',
            'target_value' => 'required|numeric',
            'current_value' => 'required|numeric',
            'unit' => 'required|string|max:50',
            'status' => 'required|in:draft,active,completed',
            'department_id' => 'nullable|integer|exists:departments,department_id',
            'progress_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            $created = DB::transaction(function () use ($validated, $objective, $user) {
                $target = (float)$validated['target_value'];
                $current = (float)$validated['current_value'];
                $progress = $target > 0 ? max(0, min(100, ($current / $target) * 100)) : 0;
                $keyResultData = [
                    'kr_title' => $validated['kr_title'],
                    'target_value' => $validated['target_value'],
                    'current_value' => $validated['current_value'],
                    'unit' => $validated['unit'],
                    'status' => $validated['status'],
                    'weight' => 0,
                    'progress_percent' => $validated['progress_percent'] ?? $progress,
                    'objective_id' => $objective->objective_id, // Sử dụng objective_id
                    'cycle_id' => $objective->cycle_id,
                    'department_id' => $validated['department_id'] ?? $objective->department_id,
                    'user_id' => $user->id,
                ];
                return KeyResult::create($keyResultData);
            });

            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'message' => 'Key Result được tạo thành công!', 'data' => $created]);
            }
            return redirect()->route('my-key-results.index')
                ->with('success', 'Key Result được tạo thành công!');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Lưu Key Result thất bại: ' . $e->getMessage()], 500);
            }
            return redirect()->back()
                ->withErrors(['error' => 'Lưu Key Result thất bại: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Hiển thị form chỉnh sửa Key Result
     */
    public function edit(string $objectiveId, string $keyResultId): View
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($objectiveId);
        $keyResult = KeyResult::findOrFail($keyResultId);

        // Kiểm tra quyền chỉnh sửa
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'Cá nhân')) {
            return view('app');
        }

        return view('app');
    }

    /**
     * Cập nhật Key Result
     */
    public function update(Request $request, string $objectiveId, string $keyResultId): RedirectResponse
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($objectiveId);
        $keyResult = KeyResult::findOrFail($keyResultId);

        // Kiểm tra quyền chỉnh sửa
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'Cá nhân')) {
            return redirect()->back()->withErrors(['error' => 'Bạn không có quyền cập nhật Key Result này.']);
        }

        // Validate dữ liệu
        $validated = $request->validate([
            'kr_title' => 'required|string|max:255',
            'target_value' => 'required|numeric',
            'current_value' => 'required|numeric',
            'unit' => 'required|string|max:50',
            'status' => 'required|in:draft,active,completed',
            'weight' => 'required|numeric|min:0|max:100',
            'progress_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            DB::transaction(function () use ($validated, $keyResult) {
                $keyResult->update([
                    'kr_title' => $validated['kr_title'],
                    'target_value' => $validated['target_value'],
                    'current_value' => $validated['current_value'],
                    'unit' => $validated['unit'],
                    'status' => $validated['status'],
                    'weight' => $validated['weight'],
                    'progress_percent' => $validated['progress_percent'] ?? 0,
                ]);
            });

            return redirect()->route('my-key-results.index')
                ->with('success', 'Key Result được cập nhật thành công!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Cập nhật Key Result thất bại: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Xóa Key Result
     */
    public function destroy(string $objectiveId, string $keyResultId): RedirectResponse
    {
        $user = Auth::user();
        $objective = Objective::findOrFail($objectiveId);
        $keyResult = KeyResult::findOrFail($keyResultId);

        // Kiểm tra quyền xóa
        $allowedLevels = $this->getAllowedLevels($user->role->role_name);
        if (!in_array($objective->level, $allowedLevels) || ($objective->user_id !== $user->id && $objective->level === 'Cá nhân')) {
            return redirect()->back()->withErrors(['error' => 'Bạn không có quyền xóa Key Result này.']);
        }

        try {
            DB::transaction(function () use ($keyResult) {
                $keyResult->delete();
            });

            return redirect()->route('my-key-results.index')
                ->with('success', 'Key Result đã được xóa thành công!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Xóa Key Result thất bại: ' . $e->getMessage()]);
        }
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
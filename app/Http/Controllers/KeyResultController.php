<?php

namespace App\Http\Controllers;

use App\Models\KeyResult;
use App\Models\Objective;
use App\Models\OkrAssignment;
use Illuminate\Http\Request;
use App\Models\Cycle;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class KeyResultController extends Controller
{
    public function index($objectiveId)
    {
        $objective = Objective::with('keyResults')->findOrFail($objectiveId);
        $keyResults = $objective->keyResults;
        if (request()->expectsJson()) {
            return response()->json(['success' => true, 'data' => $keyResults]);
        }
        return view('app');
    }

    public function show($objectiveId, $keyResultId)
    {
        return view('app');
    }

    public function create($objectiveId)
    {
        return view('app');
    }

    public function store(Request $request, $objectiveId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $objective = Objective::findOrFail($objectiveId);

        // Kiểm tra quyền
        if (!$this->canManageKeyResult($user, $objective)) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền tạo Key Result cho Objective này.'], 403);
        }

        $validated = $request->validate([
            'kr_title' => 'required|string|max:255',
            'target_value' => 'required|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'unit' => 'required|in:number,percent,completion',
            'status' => 'nullable|string|max:255',
            'weight' => 'nullable|integer|min:0|max:100',
            'cycle_id' => 'required|exists:cycles,cycle_id',
            'department_id' => 'nullable|exists:departments,department_id',
        ]);

        // Tính % tiến độ (nếu có current_value)
        $current = $validated['current_value'] ?? 0;
        $target = $validated['target_value'];
        $progress = $target > 0 ? ($current / $target) * 100 : 0;

        $kr = KeyResult::create([
            'kr_title' => $validated['kr_title'],
            'target_value' => $target,
            'current_value' => $current,
            'unit' => $validated['unit'],
            'status' => $validated['status'] ?? null,
            'weight' => $validated['weight'] ?? 0,
            'progress_percent' => $progress,
            'objective_id' => $objectiveId,
            'cycle_id' => $validated['cycle_id'],
            'department_id' => $validated['department_id'] ?? null,
        ]);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $kr]);
        }
        return redirect()->route('objectives.show', $objectiveId)
            ->with('success', 'Key Result đã được thêm thành công!');
    }

    public function destroy($objectiveId, $krId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $objective = Objective::findOrFail($objectiveId);
        $kr = KeyResult::findOrFail($krId);

        // Kiểm tra quyền
        if (!$this->canManageKeyResult($user, $objective)) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xóa Key Result này.'], 403);
        }

        $kr->delete();

        return response()->json(['success' => true, 'message' => 'Key Result đã được xóa']);
    }

    /**
     * Update an existing key result (JSON API)
     */
    public function update(Request $request, $objectiveId, $krId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $objective = Objective::findOrFail($objectiveId);
        $kr = KeyResult::where('kr_id', $krId)->where('objective_id', $objectiveId)->firstOrFail();

        // Kiểm tra quyền
        if (!$this->canManageKeyResult($user, $objective)) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền cập nhật Key Result này.'], 403);
        }

        $validated = $request->validate([
            'kr_title' => 'nullable|string|max:255',
            'target_value' => 'nullable|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'department_id' => 'nullable',
            'cycle_id' => 'nullable|exists:cycles,cycle_id',
            'progress_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        // Only keep columns that actually exist in DB
        $data = [];
        foreach ($validated as $key => $val) {
            if (Schema::hasColumn('key_results', $key)) {
                $data[$key] = $val;
            }
        }

        // Auto compute progress if not provided
        if (!isset($data['progress_percent'])) {
            $target = isset($data['target_value']) ? (float)$data['target_value'] : (float)$kr->target_value;
            $current = isset($data['current_value']) ? (float)$data['current_value'] : (float)$kr->current_value;
            $data['progress_percent'] = $target > 0 ? round(($current / $target) * 100, 2) : 0;
        }

        $kr->fill($data);
        $kr->save();

        // return latest with relations
        $kr->load('objective');
        return response()->json(['success' => true, 'data' => $kr]);
    }

    /**
     * Kiểm tra quyền quản lý Key Result
     */
    private function canManageKeyResult($user, $objective): bool
    {
        // Load role nếu chưa có
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        // Admin có quyền quản lý tất cả
        if ($user->role && $user->role->role_name === 'admin') {
            return true;
        }

        // Chủ sở hữu có quyền quản lý (nếu là owner)
        if ($objective->user_id === $user->user_id) {
            return true;
        }

        // Manager được quản lý objectives trong phòng ban của họ
        if ($user->role && $user->role->role_name === 'manager') {
            if ($objective->department_id && 
                $objective->department_id === $user->department_id) {
                return true;
            }
            return false;
        }

        // Member CHỈ được quản lý objectives mà họ sở hữu
        // KHÔNG được quản lý objectives của người khác, kể cả được assign hay cùng phòng ban
        if ($user->role && $user->role->role_name === 'member') {
            // Member đã được kiểm tra ở trên (line 172-174)
            // Nếu không phải owner thì không có quyền
            return false;
        }

        return false;
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\KeyResult;
use App\Models\Cycle;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class ObjectiveController extends Controller
{
    /**
     * Display a listing of objectives
     */
    public function index(Request $request)
    {
        $objectives = Objective::with(['user', 'cycle', 'keyResults'])->get();
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $objectives]);
        }
        return view('app');
    }

    /**
     * Show the form for creating a new objective with Tailwind
     */
    public function create(Request $request): View
    {
        $user = Auth::user();
        $cycle_id = $request->query('cycle_id', null);

        // Xác định các level được phép tạo theo role_id
        $allowedLevels = match($user->role_id) {
            1 => ['Công ty', 'Phòng ban', 'Nhóm', 'Cá nhân'], // Admin
            2 => ['Phòng ban', 'Nhóm', 'Cá nhân'],            // Manager
            default => ['Nhóm', 'Cá nhân'],                   // Member
        };

        return view('objectives.create', compact('cycle_id', 'allowedLevels'));
    }

    /**
     * Store a newly created objective
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $level = $request->input('level', 'Cá nhân');

        // Xác định các level được phép tạo theo role_id (cho điều hướng web thông thường)
        $allowedLevels = ['Nhóm', 'Cá nhân'];
        if ($user && $user->role_id == 2) { // Manager
            $allowedLevels = ['Phòng ban', 'Nhóm', 'Cá nhân'];
        } elseif ($user && $user->role_id == 1) { // Admin
            $allowedLevels = ['Công ty', 'Phòng ban', 'Nhóm', 'Cá nhân'];
        }

        // Nếu là JSON từ SPA: nới lỏng rule và trả JSON
        if ($request->expectsJson()) {
            $validated = $request->validate([
                'obj_title' => 'required|string|max:255',
                'level' => 'nullable|string|max:255',
                'description' => 'nullable|string|max:1000',
                'status' => 'nullable|string|max:255',
                'progress_percent' => 'nullable|numeric|min:0|max:100',
                'cycle_id' => 'nullable|integer|exists:cycles,cycle_id',
            ]);

            $objectiveData = [
                'obj_title' => $validated['obj_title'],
                'level' => $validated['level'] ?? $level,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'progress_percent' => $validated['progress_percent'] ?? 0,
                'user_id' => Auth::id() ?? null,
                'cycle_id' => $validated['cycle_id'] ?? null,
            ];
            $objective = Objective::create($objectiveData);
            $objective->load(['user','cycle','keyResults']);
            return response()->json(['success' => true, 'message' => 'Tạo Objective thành công!', 'data' => $objective]);
        }

        // Trường hợp điều hướng web thường (Blade cũ): giữ nguyên rule và kiểm tra quyền
        if (!in_array($level, $allowedLevels)) {
            return redirect()->back()
                ->withErrors(['level' => 'Bạn không có quyền tạo OKR cấp ' . $level . '.'])
                ->withInput();
        }

        // Validate dữ liệu (web)
        $validated = $request->validate([
            // Objective
            'obj_title' => 'required|string|max:255',
            'level' => 'required|string|in:' . implode(',', $allowedLevels),
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:draft,active,completed',
            'progress_percent' => 'nullable|numeric|min:0|max:100',
            'cycle_id' => 'nullable|integer|exists:cycles,cycle_id',

            // Key Results
            'key_results' => 'nullable|array',
            'key_results.*.kr_title' => 'required|string|max:255',
            'key_results.*.target_value' => 'required|numeric|min:0',
            'key_results.*.current_value' => 'nullable|numeric|min:0',
            'key_results.*.unit' => 'required|string|max:255',
            'key_results.*.status' => 'nullable|string|max:255',
            'key_results.*.weight' => 'nullable|integer|min:0|max:100',
            'key_results.*.progress_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        // Tạo Objective và Key Results trong transaction
        DB::transaction(function() use ($validated, $request) {
            $objectiveData = [
                'obj_title' => $validated['obj_title'],
                'level' => $validated['level'],
                'description' => $validated['description'],
                'status' => $validated['status'],
                'progress_percent' => $validated['progress_percent'] ?? 0,
                'user_id' => Auth::id() ?? 2,
                'cycle_id' => $validated['cycle_id'],
            ];
            $objective = Objective::create($objectiveData);

            $keyResults = $request->input('key_results', []);
            foreach ($keyResults as $kr) {
                if (empty($kr['kr_title'])) continue;

                $keyResultData = [
                    'kr_title' => $kr['kr_title'],
                    'target_value' => $kr['target_value'],
                    'current_value' => $kr['current_value'] ?? 0,
                    'unit' => $kr['unit'],
                    'status' => $kr['status'] ?? 'active',
                    'weight' => $kr['weight'] ?? 0,
                    'progress_percent' => $kr['progress_percent'] ?? 0,
                    'objective_id' => $objective->objective_id,
                    'cycle_id' => $objective->cycle_id,
                ];
                KeyResult::create($keyResultData);
            }
        });

        return redirect()->route('cycles.show', $validated['cycle_id'])
            ->with('success', 'Objective created successfully!');
    }

    /**
     * Display the specified objective
     */
    public function show(Request $request, string $id)
    {
        $objective = Objective::with('keyResults')->findOrFail($id);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $objective]);
        }
        return view('app');
    }

    /**
     * Show the form for editing the specified objective
     */
    public function edit(string $id): View
    {
        $objective = Objective::findOrFail($id);
        return view('objectives.edit', compact('objective'));
    }

    /**
     * Update the specified objective
     */
    public function update(Request $request, string $id)
    {
        // JSON update từ SPA
        if ($request->expectsJson()) {
            $objective = Objective::where('objective_id', $id)->firstOrFail();
            $validated = $request->validate([
                'obj_title' => 'nullable|string|max:255',
                'description' => 'nullable|string|max:1000',
                'level' => 'nullable|string|max:255',
                'status' => 'nullable|string|max:255',
                'progress_percent' => 'nullable|numeric|min:0|max:100',
                'cycle_id' => 'nullable|integer|exists:cycles,cycle_id',
            ]);

            if (array_key_exists('obj_title', $validated)) $objective->obj_title = $validated['obj_title'];
            if (array_key_exists('description', $validated)) $objective->description = $validated['description'];
            if (array_key_exists('level', $validated)) $objective->level = $validated['level'];
            if (array_key_exists('status', $validated)) $objective->status = $validated['status'];
            if (array_key_exists('progress_percent', $validated)) $objective->progress_percent = $validated['progress_percent'];
            if (array_key_exists('cycle_id', $validated)) $objective->cycle_id = $validated['cycle_id'];

            $objective->save();
            $objective->load(['user','cycle','keyResults']);
            return response()->json(['success' => true, 'message' => 'Cập nhật Objective thành công!', 'data' => $objective]);
        }

        // Luồng legacy (Blade cũ)
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'status'      => 'required|in:draft,active,completed',
            'progress'    => 'nullable|numeric|min:0|max:100'
        ]);

        $objective = Objective::findOrFail($id);
        $objective->update($validated);

        return redirect()->route('objectives.index')
            ->with('success', 'Objective updated successfully!');
    }

    /**
     * Remove the specified objective
     */
    public function destroy(Request $request, string $id)
    {
        // Dùng cột khóa chính thực tế 'objective_id' thay vì mặc định 'id'
        $objective = Objective::where('objective_id', $id)->first();
        if (!$objective) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Objective không tồn tại.'], 404);
            }
            return redirect()->route('objectives.index')->withErrors('Objective không tồn tại.');
        }
        $objective->delete();
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Đã xóa Objective thành công.']);
        }
        return redirect()->route('objectives.index')
            ->with('success', 'Objective deleted successfully!');
    }
}

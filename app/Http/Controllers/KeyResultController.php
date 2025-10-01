<?php

namespace App\Http\Controllers;

use App\Models\KeyResult;
use App\Models\Objective;
use Illuminate\Http\Request;
use App\Models\Cycle; 

class KeyResultController extends Controller
{
    /**
     * Hiển thị danh sách Key Results theo Objective
     */
    public function index($objectiveId)
    {
        $objective   = Objective::with('keyResults')->findOrFail($objectiveId);
        $keyResults  = $objective->keyResults;
        $cycles = Cycle::all(); 

        return view('key_results', compact('objective', 'keyResults', 'cycles'));
    }

    /**
     * Thêm mới Key Result
     */
    public function store(Request $request, $objectiveId)
    {
        $validated = $request->validate([
            'kr_title'      => 'required|string|max:255',
            'target_value'  => 'required|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'unit'          => 'required|in:number,percent,completion',
            'status'        => 'nullable|string|max:255',
            'weight'        => 'nullable|integer|min:0|max:100',
            'progress_percent' => 'nullable|numeric|min:0|max:100',
            'cycle_id'      => 'required|exists:cycles,cycle_id',
        ]);

        // Tính % tiến độ (nếu có current_value)
        $current   = $validated['current_value'] ?? 0;
        $target    = $validated['target_value'];
        $progress  = $target > 0 ? ($current / $target) * 100 : 0;

        KeyResult::create([
            'kr_title'        => $validated['kr_title'],
            'target_value'    => $target,
            'current_value'   => $current,
            'unit'            => $validated['unit'],
            'status'          => $validated['status'] ?? null,
            'weight'          => $validated['weight'] ?? 0,
            'progress_percent'=> $progress,
            'objective_id'    => $objectiveId,
            'cycle_id'        => $validated['cycle_id'], 
        ]);

        return redirect()
            ->route('key_results.index', $objectiveId)
            ->with('success', 'Key Result đã được thêm thành công!');
    }

    /**
     * Cập nhật giá trị hiện tại & tiến độ
     */
    public function update(Request $request, $objectiveId, $krId)
    {
        $validated = $request->validate([
            'current_value' => 'required|numeric|min:0',
        ]);

        $kr = KeyResult::findOrFail($krId);

        $kr->current_value    = $validated['current_value'];
        $kr->progress_percent = $kr->target_value > 0
            ? ($kr->current_value / $kr->target_value) * 100
            : 0;

        $kr->save();

        return redirect()
            ->route('key_results.index', $objectiveId)
            ->with('success', 'Giá trị hiện tại đã được cập nhật!');
    }
        
    /**
     * Xóa Key Result
     */
    public function destroy($objectiveId, $krId)
    {
        $kr = KeyResult::findOrFail($krId);
        $kr->delete();

        return response()->json(['message' => 'Key Result đã được xóa']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\KeyResult;
use App\Models\Objective;
use Illuminate\Http\Request;
use App\Models\Cycle;
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
        $cycles = Cycle::all();
        return view('key_results.index', compact('objective', 'keyResults', 'cycles'));
    }

    public function show($objectiveId, $keyResultId)
    {
        $objective = Objective::findOrFail($objectiveId);

        $keyResult = KeyResult::with(['objective', 'cycle'])
            ->where('objective_id', $objectiveId)
            ->where('kr_id', $keyResultId)
            ->firstOrFail();

        return view('key_results.show', compact('objective', 'keyResult'));
    }

    public function create($objectiveId)
    {
        $objective = Objective::findOrFail($objectiveId);
        $cycles = Cycle::all();
        return view('key_results.create', compact('objective', 'cycles'));
    }

    public function store(Request $request, $objectiveId)
    {
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
        $kr = KeyResult::findOrFail($krId);
        $kr->delete();

        return response()->json(['success' => true, 'message' => 'Key Result đã được xóa']);
    }

    /**
     * Update an existing key result (JSON API)
     */
    public function update(Request $request, $objectiveId, $krId)
    {
        $kr = KeyResult::where('kr_id', $krId)->where('objective_id', $objectiveId)->firstOrFail();

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
}
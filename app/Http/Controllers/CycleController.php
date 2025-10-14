<?php

namespace App\Http\Controllers;
use App\Models\Cycle;
use App\Models\Objective;

use Illuminate\Http\Request;

class CycleController extends Controller
{
    //
    public function index(Request $request) {
        $cycles = Cycle::orderByDesc('start_date')->get();
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $cycles]);
        }
        return view('app');
        // return response()->json(['data' => Cycle::all()]);
    }

    public function create() {
        return view('app');
    }

    public function store(Request $request) {
        $request->validate([
            'cycle_name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:active,inactive',
            'description' => 'nullable|string',
        ]);

        $cycle = Cycle::create($request->all());
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $cycle, 'message' => 'Tạo chu kỳ thành công!']);
        }
        return redirect()->route('cycles.index')->with('success', 'Tạo chu kỳ thành công!');
    }

    public function show(Request $request, Cycle $cycle) {
        // Eager load objectives, user và keyResults để FE không phải gọi thêm
        $cycle->load(['objectives.user', 'objectives.keyResults']);
        $objectives = $cycle->objectives;
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => compact('cycle','objectives')]);
        }
        return view('app');
    }

    public function edit(Cycle $cycle) {
        return view('app');
    }

    public function update(Request $request, Cycle $cycle) {
        $request->validate([
            'cycle_name' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
            'description' => 'nullable|string',
        ]);

        // Chỉ update các field được gửi lên
        $data = $request->only(['cycle_name', 'start_date', 'end_date', 'status', 'description']);
        
        // Loại bỏ các field null hoặc rỗng
        $data = array_filter($data, function($value) {
            return $value !== null && $value !== '';
        });

        // Validate logic business nếu có cả start_date và end_date
        if (isset($data['start_date']) && isset($data['end_date'])) {
            if ($data['start_date'] > $data['end_date']) {
                return response()->json(['success' => false, 'message' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'], 422);
            }
        }

        $cycle->update($data);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $cycle, 'message' => 'Cập nhật chu kỳ thành công!']);
        }
        return redirect()->route('cycles.index')->with('success', 'Cập nhật chu kỳ thành công!');
    }

    public function destroy(Cycle $cycle) {
        $cycle->delete();
        if (request()->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Xóa chu kỳ thành công!']);
        }
        return redirect()->route('cycles.index')->with('success', 'Xóa chu kỳ thành công!');
    }
}

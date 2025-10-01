@extends('layouts.app')

@section('content')
<div class="container mx-auto flex flex-col items-center min-h-screen px-4">
    <div class="cycle-title flex justify-between items-center w-full max-w-4xl mb-12">
        <h1 class="text-4xl font-bold">Danh sách chu kỳ</h1>
        <a href="{{ route('cycles.create') }}" 
           class="btn btn-primary px-6 py-3 rounded-full text-lg font-semibold text-center">Tạo mới</a>
    </div>
    @if(session('success'))
        <div class="bg-green-100 text-green-700 p-4 rounded-lg mb-6 w-full max-w-4xl">
            {{ session('success') }}
        </div>
    @endif
    <div class="w-full max-w-4xl overflow-x-auto">
        <table class="w-full table-auto border-collapse border-2 border-gray-600 table-custom">
            <thead>
                <tr class="bg-gray-300">
                    <th class="border-2 border-gray-600 px-4 py-3 text-left font-bold text-gray-900">Tên chu kỳ</th>
                    <th class="border-2 border-gray-600 px-4 py-3 text-left font-bold text-gray-900 max-w-[300px]">Mô tả</th>
                    <th class="border-2 border-gray-600 px-4 py-3 text-left font-bold text-gray-900">Trạng thái</th>
                    <th class="border-2 border-gray-600 px-4 py-3 text-left font-bold text-gray-900">Hành động</th>
                </tr>
            </thead>
            <tbody>
                @foreach($cycles as $cycle)
                <tr>
                    <td class="border-2 border-gray-600 px-4 py-3">{{ $cycle->cycle_name }}</td>
                    <td class="border-2 border-gray-600 px-4 py-3 max-w-[300px] truncate">{{ $cycle->description }}</td>
                    <td class="border-2 border-gray-600 px-4 py-3">{{ $cycle->status }}</td>
                    <td class="border-2 border-gray-600 px-4 py-3 flex flex-row">
                        <a href="{{ route('cycles.show', $cycle) }}" 
                           class="btn btn-action btn-action-view px-4 py-2 rounded-lg text-sm font-semibold">Xem</a>
                        <a href="{{ route('cycles.edit', $cycle) }}" 
                           class="btn btn-action btn-action-edit px-4 py-2 rounded-lg text-sm font-semibold">Sửa</a>
                        <form action="{{ route('cycles.destroy', $cycle) }}" method="POST" class="inline">
                            @csrf
                            @method('DELETE')
                            <button type="submit" 
                                    class="btn btn-action btn-action-delete px-4 py-2 rounded-lg text-sm font-semibold"
                                    onclick="return confirm('Xác nhận xóa?')">Xóa</button>
                        </form>
                        <a href="{{ route('objectives.create', ['cycle_id' => $cycle->cycle_id]) }}" 
                           class="btn btn-action btn-action-edit px-4 py-2 rounded-lg text-sm font-semibold">Thêm Obj</a>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>
@endsection
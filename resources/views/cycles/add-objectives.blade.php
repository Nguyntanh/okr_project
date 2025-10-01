@extends('layouts.app')

@section('content')
<div class="container mx-auto flex flex-col items-center min-h-screen px-4">
    <div class="cycle-title flex justify-between items-center w-full max-w-4xl mb-12">
        <h1 class="text-4xl font-bold">Thêm mục tiêu cho chu kỳ: {{ $cycle->cycle_name }}</h1>
        <a href="{{ route('cycles.index') }}" 
           class="btn btn-primary px-6 py-3 rounded-full text-lg font-semibold text-center">Quay lại</a>
    </div>
    @if(session('success'))
        <div class="bg-green-100 text-green-700 p-4 rounded-lg mb-6 w-full max-w-4xl">
            {{ session('success') }}
        </div>
    @endif
    <div class="w-full max-w-4xl">
        <form action="{{ route('cycles.store-objective', $cycle) }}" method="POST" class="bg-white shadow-md rounded-lg p-6">
            @csrf
            <div class="mb-4">
                <label for="objective_name" class="block text-gray-700 font-bold mb-2">Tên mục tiêu</label>
                <input type="text" name="objective_name" id="objective_name" 
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                       required>
            </div>
            <div class="mb-4">
                <label for="description" class="block text-gray-700 font-bold mb-2">Mô tả</label>
                <textarea name="description" id="description" 
                          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          rows="5"></textarea>
            </div>
            <div class="flex justify-end">
                <button type="submit" 
                        class="btn btn-primary px-6 py-3 rounded-full text-lg font-semibold text-center">Thêm mục tiêu</button>
            </div>
        </form>
    </div>
</div>
@endsection
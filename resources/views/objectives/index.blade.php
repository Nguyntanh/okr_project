@extends('layouts.tailwind')

@section('title', 'OKR Dashboard')

@section('content')
<div class="space-y-8">
    <!-- Header -->
    <div class="flex justify-between items-center">
        <a href="{{ asset('dashboard') }}">Quay lại</a>
        <h1 class="text-3xl font-bold text-gray-900">OKR Dashboard</h1>
        <a href="{{ route('objectives.create') }}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + New Objective
        </a>
    </div>

    @if($objectives->count() > 0)
        @foreach($objectives as $objective)
        <!-- Objective Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <!-- Objective Header -->
            <div class="flex justify-between items-start mb-6">
                <div class="flex-1">
                    <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ $objective->objTitle }}</h2>
                    <p class="text-gray-600 mb-1">
                        <span class="font-medium">Owner:</span> 
                        @if($objective->user)
                            {{ $objective->user->full_name }}
                        @else
                            <span class="text-gray-400">No owner</span>
                        @endif
                    </p>
                    <p class="text-gray-600">
                        <span class="font-medium">Cycle:</span> 
                        @if($objective->cycle)
                            {{ $objective->cycle->name }}
                        @else
                            <span class="text-gray-400">No cycle</span>
                        @endif
                    </p>
                </div>
                
                <!-- Overall Progress -->
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600 mb-1">{{ number_format($objective->progress_percent, 0) }}%</div>
                    <div class="text-sm text-gray-500 mb-2">Overall Progress</div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: {{ $objective->progress_percent }}%"></div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            @if($objective->status == 'active') bg-green-100 text-green-800
                            @elseif($objective->status == 'completed') bg-blue-100 text-blue-800
                            @else bg-gray-100 text-gray-800 @endif">
                            {{ ucfirst($objective->status) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Key Results Section -->
            <div class="border-t pt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Results</h3>
                
                @if($objective->keyResults && $objective->keyResults->count() > 0)
                    <div class="space-y-4">
                        @foreach($objective->keyResults as $kr)
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex-1">
                                    <h4 class="font-medium text-gray-900 mb-1">{{ $kr->kr_title }}</h4>
                                    <p class="text-sm text-gray-600">{{ $kr->description ?? 'No description' }}</p>
                                </div>
                                <div class="text-right ml-4">
                                    <div class="text-lg font-semibold text-blue-600">{{ number_format($kr->progress_percent, 0) }}%</div>
                                    <div class="text-xs text-gray-500">Progress</div>
                                </div>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                     style="width: {{ $kr->progress_percent }}%"></div>
                            </div>
                            
                            <!-- KR Details -->
                            <div class="flex justify-between items-center text-sm text-gray-600">
                                <div>
                                    <span class="font-medium">Target:</span> {{ number_format($kr->target_value, 0) }} {{ $kr->unit ?? '' }}
                                </div>
                                <div>
                                    <span class="font-medium">Current:</span> {{ number_format($kr->current_value, 0) }} {{ $kr->unit ?? '' }}
                                </div>
                                <div>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                        @if($kr->status == 'active') bg-green-100 text-green-800
                                        @elseif($kr->status == 'completed') bg-blue-100 text-blue-800
                                        @else bg-gray-100 text-gray-800 @endif">
                                        {{ ucfirst($kr->status ?? 'draft') }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                @else
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <p class="text-lg font-medium">No Key Results</p>
                        <p class="text-sm">Add key results to track progress towards this objective.</p>
                    </div>
                @endif
            </div>

            <!-- Actions -->
            <div class="border-t pt-4 mt-6 flex justify-between items-center">
                <div class="text-sm text-gray-500">
                    Created {{ $objective->created_at ? $objective->created_at->format('M d, Y') : 'N/A' }}
                </div>
                <div class="flex space-x-2">
                    <a href="{{ route('objectives.show', $objective->objective_id) }}" 
                       class="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</a>
                    <a href="{{ route('objectives.edit', $objective->objective_id) }}" 
                       class="text-gray-600 hover:text-gray-800 text-sm font-medium">Edit</a>
                    <form action="{{ route('objectives.destroy', $objective->objective_id) }}" method="POST" class="inline"
                          onsubmit="return confirm('Delete this objective?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </form>
                </div>
            </div>
        </div>
        @endforeach

        <!-- Pagination -->
        @if($objectives->hasPages())
            <div class="flex justify-center mt-8">
                {{ $objectives->links() }}
            </div>
        @endif
    @else
        <!-- Empty State -->
        <div class="text-center py-16">
            <svg class="w-16 h-16 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Objectives Found</h3>
            <p class="text-gray-600 mb-6">Start by creating your first objective to track your goals.</p>
            <a href="{{ route('objectives.create') }}" 
               class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Create First Objective
            </a>
        </div>
    @endif
</div>
@endsection

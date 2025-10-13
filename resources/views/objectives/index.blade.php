@extends('layouts.app')

@section('content')
<style>
    /* Container styling */
    .obj-container {
        max-width: 1200px;
        margin: 40px auto;
        padding: 0 15px;
    }

    /* Header styling */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    .header h1 {
        font-size: 28px;
        font-weight: 700;
        color: #1b1b18;
    }
    .header a {
        background-color: #1b1b18;
        color: #ffffff;
        padding: 10px 16px;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s ease-in-out;
    }
    .header a:hover {
        background-color: #000000;
    }
    @media (prefers-color-scheme: dark) {
        .header h1 {
            color: #EDEDEC;
        }
        .header a {
            background-color: #3E3E3A;
            color: #EDEDEC;
        }
        .header a:hover {
            background-color: #ffffff;
            color: #1b1b18;
        }
    }

    /* Objective card styling */
    .objective-card {
        background-color: #ffffff;
        border: 1px solid #e3e3e0;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.03), 0px 1px 2px 0px rgba(0,0,0,0.06);
        transition: all 0.2s ease-in-out;
    }
    @media (prefers-color-scheme: dark) {
        .objective-card {
            background-color: #161615;
            border-color: #3E3E3A;
        }
    }

    /* Objective header */
    .objective-header {
        display: flex;
        flex-direction: column;
        margin-bottom: 24px;
    }
    .objective-header h2 {
        font-size: 20px;
        font-weight: 600;
        color: #1b1b18;
        margin-bottom: 8px;
    }
    .objective-header p {
        font-size: 14px;
        color: #706f6c;
        margin-bottom: 4px;
    }
    .objective-header p span {
        font-weight: 500;
    }
    @media (prefers-color-scheme: dark) {
        .objective-header h2 {
            color: #EDEDEC;
        }
        .objective-header p {
            color: #A1A09A;
        }
    }
    @media (min-width: 992px) {
        .objective-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }
    }

    /* Progress section */
    .progress-section {
        text-align: right;
        margin-top: 16px;
    }
    .progress-section .progress-percent {
        font-size: 24px;
        font-weight: 700;
        color: #1b1b18;
        margin-bottom: 4px;
    }
    .progress-section .progress-label {
        font-size: 14px;
        color: #706f6c;
        margin-bottom: 8px;
    }
    .progress-bar {
        width: 128px;
        height: 8px;
        background-color: #dbdbd7;
        border-radius: 9999px;
        overflow: hidden;
    }
    .progress-bar div {
        height: 100%;
        background-color: #1b1b18;
        border-radius: 9999px;
        transition: width 0.3s ease-in-out;
    }
    .status {
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 9999px;
        margin-top: 4px;
    }
    .status-active {
        background-color: rgba(27,27,24,0.1);
        color: #1b1b18;
    }
    .status-completed {
        background-color: rgba(27,27,24,0.05);
        color: #1b1b18;
    }
    .status-default {
        background-color: #dbdbd7;
        color: #706f6c;
    }
    @media (prefers-color-scheme: dark) {
        .progress-section .progress-percent {
            color: #EDEDEC;
        }
        .progress-section .progress-label {
            color: #A1A09A;
        }
        .progress-bar {
            background-color: #3E3E3A;
        }
        .progress-bar div {
            background-color: #EDEDEC;
        }
        .status-active {
            background-color: rgba(237,237,236,0.1);
            color: #EDEDEC;
        }
        .status-completed {
            background-color: rgba(237,237,236,0.05);
            color: #EDEDEC;
        }
        .status-default {
            background-color: #3E3E3A;
            color: #A1A09A;
        }
    }
    @media (min-width: 992px) {
        .progress-section {
            margin-top: 0;
        }
    }

    /* Key results section */
    .key-results {
        border-top: 1px solid #e3e3e0;
        padding-top: 24px;
        margin-top: 24px;
    }
    .key-results h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1b1b18;
        margin-bottom: 16px;
    }
    .key-results a {
        background-color: #1b1b18;
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s ease-in-out;
    }
    .key-results a:hover {
        background-color: #000000;
    }
    @media (prefers-color-scheme: dark) {
        .key-results {
            border-top-color: #3E3E3A;
        }
        .key-results h3 {
            color: #EDEDEC;
        }
        .key-results a {
            background-color: #3E3E3A;
            color: #EDEDEC;
        }
        .key-results a:hover {
            background-color: #ffffff;
            color: #1b1b18;
        }
    }

    /* Actions section */
    .actions {
        border-top: 1px solid #e3e3e0;
        padding-top: 16px;
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .actions .created-date {
        font-size: 14px;
        color: #706f6c;
    }
    .actions .action-links {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
    }
    .actions a, .actions button {
        font-size: 14px;
        font-weight: 500;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
    }
    .actions a.view-details {
        color: #1b1b18;
    }
    .actions a.view-details:hover {
        color: #000000;
    }
    .actions a.edit {
        color: #706f6c;
    }
    .actions a.edit:hover {
        color: #1b1b18;
    }
    .actions button.delete {
        color: #f53003;
    }
    .actions button.delete:hover {
        color: #F61500;
    }
    @media (prefers-color-scheme: dark) {
        .actions {
            border-top-color: #3E3E3A;
        }
        .actions .created-date {
            color: #A1A09A;
        }
        .actions a.view-details {
            color: #EDEDEC;
        }
        .actions a.view-details:hover {
            color: #ffffff;
        }
        .actions a.edit {
            color: #A1A09A;
        }
        .actions a.edit:hover {
            color: #EDEDEC;
        }
        .actions button.delete {
            color: #FF4433;
        }
        .actions button.delete:hover {
            color: #F61500;
        }
    }
    @media (min-width: 992px) {
        .actions {
            flex-direction: row;
            align-items: center;
        }
        .actions .action-links {
            flex-direction: row;
            gap: 16px;
            margin-top: 0;
        }
    }

    /* Empty state */
    .empty-state {
        text-align: center;
        padding: 64px 0;
    }
    .empty-state svg {
        width: 64px;
        height: 64px;
        margin: 0 auto 24px;
        color: #dbdbd7;
    }
    .empty-state h3 {
        font-size: 20px;
        font-weight: 600;
        color: #1b1b18;
        margin-bottom: 8px;
    }
    .empty-state p {
        font-size: 14px;
        color: #706f6c;
        margin-bottom: 24px;
    }
    .empty-state a {
        background-color: #1b1b18;
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s ease-in-out;
    }
    .empty-state a:hover {
        background-color: #000000;
    }
    @media (prefers-color-scheme: dark) {
        .empty-state svg {
            color: #3E3E3A;
        }
        .empty-state h3 {
            color: #EDEDEC;
        }
        .empty-state p {
            color: #A1A09A;
        }
        .empty-state a {
            background-color: #3E3E3A;
            color: #EDEDEC;
        }
        .empty-state a:hover {
            background-color: #ffffff;
            color: #1b1b18;
        }
    }

    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        margin-top: 32px;
    }
    .pagination a, .pagination span {
        padding: 8px 16px;
        margin: 0 4px;
        border-radius: 6px;
        font-size: 14px;
        color: #1b1b18;
        text-decoration: none;
        transition: background-color 0.2s ease-in-out;
    }
    .pagination a:hover {
        background-color: #f5f5f5;
    }
    @media (prefers-color-scheme: dark) {
        .pagination a, .pagination span {
            color: #EDEDEC;
        }
        .pagination a:hover {
            background-color: #2a2a2a;
        }
    }
</style>

<div class="obj-container">
    <!-- Header -->
    <div class="header">
        <h1>My OKR</h1>
        <a href="{{ route('objectives.create') }}">+ New Objective</a>
    </div>

    @if($objectives->count() > 0)
        @foreach($objectives as $objective)
        <!-- Objective Card -->
        <div class="objective-card">
            <!-- Objective Header -->
<<<<<<< HEAD
            <div class="objective-header">
                <div>
                    <h2>{{ $objective->objTitle }}</h2>
                    <p>
                        <span>Owner:</span> 
=======
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div class="flex-1">
                    <h2 class="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-2">{{ $objective->obj_title }}</h2>
                    <p class="text-sm text-[#706f6c] dark:text-[#A1A09A] mb-1">
                        <span class="font-medium">Owner:</span> 
>>>>>>> 53aac8f01bead5df701031cb4d85e4d438e9f0e8
                        @if($objective->user)
                            {{ $objective->user->full_name }}
                        @else
                            No owner
                        @endif
                    </p>
<<<<<<< HEAD
                    <p>
                        <span>Cycle:</span> 
=======
                    <p class="text-sm text-[#706f6c] dark:text-[#A1A09A] mb-1">
                        <span class="font-medium">Level:</span> 
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            @if($objective->level === 'Công ty') bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300
                            @elseif($objective->level === 'Phòng ban') bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300
                            @elseif($objective->level === 'Nhóm') bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300
                            @else bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 @endif">
                            {{ $objective->level }}
                        </span>
                    </p>
                    <p class="text-sm text-[#706f6c] dark:text-[#A1A09A] mb-1">
                        <span class="font-medium">Cycle:</span> 
>>>>>>> 53aac8f01bead5df701031cb4d85e4d438e9f0e8
                        @if($objective->cycle)
                            {{ $objective->cycle->cycle_name }}
                        @else
                            No cycle
                        @endif
                    </p>
                    @if($objective->department)
                    <p class="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        <span class="font-medium">Department:</span> 
                        {{ $objective->department->d_name }}
                    </p>
                    @endif
                </div>
                
                <!-- Overall Progress -->
                <div class="progress-section">
                    <div class="progress-percent">{{ number_format($objective->progress_percent, 0) }}%</div>
                    <div class="progress-label">Overall Progress</div>
                    <div class="progress-bar">
                        <div style="width: {{ $objective->progress_percent }}%"></div>
                    </div>
                    <div class="status 
                        @if($objective->status == 'active') status-active
                        @elseif($objective->status == 'completed') status-completed
                        @else status-default @endif">
                        {{ ucfirst($objective->status) }}
                    </div>
                </div>
            </div>

            <!-- Key Results Section -->
<<<<<<< HEAD
            <div class="key-results">
                <h3>Key Results</h3>
                <div style="text-align: center;">
                    <a href="{{ route('key_results.create', $objective->objective_id) }}">+ Add Key Result</a>
=======
            @if($objective->keyResults && $objective->keyResults->count() > 0)
                <div class="border-t border-[#e3e3e0] dark:border-[#3E3E3A] pt-6">
                    <h3 class="text-lg font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-4">Key Results</h3>
                    <div class="space-y-4">
                        @foreach($objective->keyResults as $index => $keyResult)
                            <div class="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-4 border border-[#e2e8f0] dark:border-[#334155]">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">
                                        KR {{ $index + 1 }}: {{ $keyResult->kr_title }}
                                    </h4>
                                    <span class="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                        {{ $keyResult->current_value }}/{{ $keyResult->target_value }} {{ $keyResult->unit }}
                                    </span>
                                </div>
                                <div class="w-full bg-[#e2e8f0] dark:bg-[#334155] rounded-full h-2 mb-2">
                                    <div class="bg-[#1b1b18] dark:bg-[#EDEDEC] h-2 rounded-full transition-all" 
                                         style="width: {{ $keyResult->progress_percent }}%"></div>
                                </div>
                                <div class="flex justify-between items-center text-xs text-[#706f6c] dark:text-[#A1A09A]">
                                    <span>{{ number_format($keyResult->progress_percent, 0) }}% Complete</span>
                                    @if($keyResult->weight > 0)
                                        <span>Weight: {{ $keyResult->weight }}%</span>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
>>>>>>> 53aac8f01bead5df701031cb4d85e4d438e9f0e8
                </div>
            @else
                <div class="border-t border-[#e3e3e0] dark:border-[#3E3E3A] pt-6">
                    <h3 class="text-lg font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-4">Key Results</h3>
                    <div class="text-center">
                        <a href="{{ route('key_results.create', $objective->objective_id) }}" 
                           class="bg-[#1b1b18] hover:bg-black dark:bg-[#3E3E3A] dark:hover:bg-white text-white dark:text-[#EDEDEC] dark:hover:text-[#1b1b18] px-4 py-2 rounded-lg font-medium transition-all">
                            + Add Key Result
                        </a>
                    </div>
                </div>
            @endif

            <!-- Actions -->
            <div class="actions">
                <div class="created-date">
                    Created {{ $objective->created_at ? $objective->created_at->format('M d, Y') : 'N/A' }}
                </div>
<<<<<<< HEAD
                <div class="action-links">
                    <a href="{{ route('objectives.show', $objective->objective_id) }}" class="view-details">View Details</a>
                    <a href="{{ route('objectives.edit', $objective->objective_id) }}" class="edit">Edit</a>
                    <form action="{{ route('objectives.destroy', $objective->objective_id) }}" method="POST" style="display: inline;"
                          onsubmit="return confirm('Delete this objective?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="delete">Delete</button>
                    </form>
=======
                
                @php
                    $canEdit = true;
                    $canDelete = true;
                    
                    // Kiểm tra quyền chỉnh sửa/xóa dựa trên level và role
                    if ($objective->level === 'Phòng ban') {
                        if (Auth::user()->isMember()) {
                            $canEdit = false;
                            $canDelete = false;
                        } elseif (Auth::user()->isManager()) {
                            // Manager chỉ có thể chỉnh sửa OKR phòng ban của phòng ban mình
                            $canEdit = $objective->department_id === Auth::user()->department_id;
                            $canDelete = $objective->department_id === Auth::user()->department_id;
                        }
                    } elseif ($objective->level === 'Cá nhân') {
                        // OKR cá nhân chỉ có owner hoặc Admin mới được chỉnh sửa
                        if (Auth::user()->isMember()) {
                            $canEdit = $objective->user_id === Auth::user()->user_id;
                            $canDelete = $objective->user_id === Auth::user()->user_id;
                        }
                    }
                @endphp
                
                <div class="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2 mt-2 lg:mt-0">
                    <a href="{{ route('objectives.show', $objective->objective_id) }}" 
                       class="text-[#1b1b18] hover:text-black dark:text-[#EDEDEC] dark:hover:text-white text-sm font-medium underline underline-offset-4">View Details</a>
                    
                    @if($canEdit)
                        <a href="{{ route('objectives.edit', $objective->objective_id) }}" 
                           class="text-[#706f6c] hover:text-[#1b1b18] dark:text-[#A1A09A] dark:hover:text-[#EDEDEC] text-sm font-medium underline underline-offset-4">Edit</a>
                    @endif
                    
                    @if($canDelete)
                        <form action="{{ route('objectives.destroy', $objective->objective_id) }}" method="POST" class="inline"
                              onsubmit="return confirm('Delete this objective?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-[#f53003] hover:text-[#F61500] dark:text-[#FF4433] dark:hover:text-[#F61500] text-sm font-medium underline underline-offset-4">Delete</button>
                        </form>
                    @endif
                    
                    @if($objective->level === 'Phòng ban' && Auth::user()->isMember())
                        <span class="text-xs text-[#706f6c] dark:text-[#A1A09A] italic">
                            <i class="fas fa-info-circle"></i> Read-only
                        </span>
                    @endif
>>>>>>> 53aac8f01bead5df701031cb4d85e4d438e9f0e8
                </div>
            </div>
        </div>
        @endforeach

        <!-- Pagination -->
        @if($objectives->hasPages())
            <div class="pagination">
                {{ $objectives->links() }}
            </div>
        @endif
    @else
        <!-- Empty State -->
        <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3>No Objectives Found</h3>
            <p>Start by creating your first objective to track your goals.</p>
            <a href="{{ route('objectives.create') }}">Create First Objective</a>
        </div>
    @endif
</div>
@endsection
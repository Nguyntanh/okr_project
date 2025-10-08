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
            <div class="objective-header">
                <div>
                    <h2>{{ $objective->objTitle }}</h2>
                    <p>
                        <span>Owner:</span> 
                        @if($objective->user)
                            {{ $objective->user->full_name }}
                        @else
                            No owner
                        @endif
                    </p>
                    <p>
                        <span>Cycle:</span> 
                        @if($objective->cycle)
                            {{ $objective->cycle->name }}
                        @else
                            No cycle
                        @endif
                    </p>
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
            <div class="key-results">
                <h3>Key Results</h3>
                <div style="text-align: center;">
                    <a href="{{ route('key_results.create', $objective->objective_id) }}">+ Add Key Result</a>
                </div>
            </div>

            <!-- Actions -->
            <div class="actions">
                <div class="created-date">
                    Created {{ $objective->created_at ? $objective->created_at->format('M d, Y') : 'N/A' }}
                </div>
                <div class="action-links">
                    <a href="{{ route('objectives.show', $objective->objective_id) }}" class="view-details">View Details</a>
                    <a href="{{ route('objectives.edit', $objective->objective_id) }}" class="edit">Edit</a>
                    <form action="{{ route('objectives.destroy', $objective->objective_id) }}" method="POST" style="display: inline;"
                          onsubmit="return confirm('Delete this objective?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="delete">Delete</button>
                    </form>
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
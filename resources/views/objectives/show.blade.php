@extends('layouts.app')

@section('title', 'Objective Details - CodeGym OKR')

@section('content')
<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3><i class="bi bi-eye"></i> Objective Details</h3>
                <div class="btn-group">
                    {{-- <a href="{{ route('objectives.edit', $objective->id) }}" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-pencil"></i> Edit
                    </a> --}}
                    {{-- <form action="{{ route('objectives.destroy', $objective->id) }}" 
                          method="POST" 
                          class="d-inline"
                          onsubmit="return confirm('Are you sure you want to delete this objective?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-outline-danger btn-sm">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </form> --}}
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2 class="mb-3">{{ $objective->title }}</h2>
                        @if($objective->description)
                            <div class="mb-4">
                                <h6><i class="bi bi-text-paragraph"></i> Description</h6>
                                <p class="text-muted">{{ $objective->description }}</p>
                            </div>
                        @endif
                    </div>
                    <div class="col-md-4 text-end">
                        @php
                            $statusClass = match($objective->status) {
                                'draft' => 'bg-secondary',
                                'active' => 'bg-primary',
                                'completed' => 'bg-success',
                                default => 'bg-secondary'
                            };
                            $statusIcon = match($objective->status) {
                                'draft' => 'bi-pencil-square',
                                'active' => 'bi-play-circle',
                                'completed' => 'bi-check-circle',
                                default => 'bi-question-circle'
                            };
                        @endphp
                        <span class="badge {{ $statusClass }} fs-6">
                            <i class="bi {{ $statusIcon }}"></i> {{ ucfirst($objective->status) }}
                        </span>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <i class="bi bi-calendar-event display-6 text-primary"></i>
                                <h6 class="mt-2">Due Date</h6>
                                <p class="mb-0">
                                    @if(!empty($objective->due_date))
                                        {{ $objective->due_date->format('M d, Y') }}
                                        @if($objective->due_date->isPast() && $objective->status !== 'completed')
                                            <br><span class="badge bg-danger">Overdue</span>
                                        @elseif($objective->due_date->diffInDays() <= 7)
                                            <br><span class="badge bg-warning">Due Soon</span>
                                        @endif
                                    @else
                                        <span class="text-muted">No due date</span>
                                    @endif
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <i class="bi bi-key display-6 text-info"></i>
                                <h6 class="mt-2">Key Results</h6>
                                <p class="mb-0">
                                    {{ $objective->keyResults->count() }} KRs
                                    @if($objective->keyResults->count() > 0)
                                        <br>
                                        @php
                                            $completedKRs = $objective->keyResults->where('status', 'completed')->count();
                                            $percentage = $objective->keyResults->count() > 0 ? 
                                                round(($completedKRs / $objective->keyResults->count()) * 100) : 0;
                                        @endphp
                                        <small class="text-muted">{{ $percentage }}% Complete</small>
                                    @endif
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <i class="bi bi-clock display-6 text-success"></i>
                                <h6 class="mt-2">Created</h6>
                                <p class="mb-0">
                                    {{ $objective->created_at->format('M d, Y') }}
                                    <br><small class="text-muted">{{ $objective->created_at->diffForHumans() }}</small>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Key Results Section -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5><i class="bi bi-key"></i> Key Results</h5>
                        <button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addKRModal">
                            <i class="bi bi-plus-circle"></i> Add Key Result
                        </button>
                    </div>

                    @if($objective->keyResults->count() > 0)
                        <div class="list-group">
                            @foreach($objective->keyResults as $index => $keyResult)
                                <div class="list-group-item">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">
                                            <span class="badge bg-light text-dark">KR {{ $index + 1 }}</span>
                                            {{ $keyResult->title }}
                                        </h6>
                                        <small>
                                            @php
                                                $krStatusClass = match($keyResult->status) {
                                                    'not_started' => 'bg-secondary',
                                                    'in_progress' => 'bg-warning',
                                                    'completed' => 'bg-success',
                                                    default => 'bg-secondary'
                                                };
                                            @endphp
                                            <span class="badge {{ $krStatusClass }}">
                                                {{ ucfirst(str_replace('_', ' ', $keyResult->status)) }}
                                            </span>
                                        </small>
                                    </div>
                                    @if($keyResult->description)
                                        <p class="mb-1">{{ $keyResult->description }}</p>
                                    @endif
                                    <div class="progress mt-2" style="height: 10px;">
                                        <div class="progress-bar" 
                                             role="progressbar" 
                                             style="width: {{ $keyResult->progress ?? 0 }}%"
                                             aria-valuenow="{{ $keyResult->progress ?? 0 }}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                        </div>
                                    </div>
                                    <small class="text-muted">{{ $keyResult->progress ?? 0 }}% complete</small>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-center py-4">
                            <i class="bi bi-key display-1 text-muted"></i>
                            <h6 class="mt-3">No Key Results Yet</h6>
                            <p class="text-muted">Add key results to track your progress towards this objective.</p>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addKRModal">
                                <i class="bi bi-plus-circle"></i> Add First Key Result
                            </button>
                        </div>
                    @endif
                </div>

                <div class="d-flex justify-content-start">
                    <a href="{{ route('objectives.index') }}" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-left"></i> Back to Objectives
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Sidebar with Timeline -->
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5><i class="bi bi-clock-history"></i> Timeline</h5>
            </div>
            <div class="card-body">
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker bg-success"></div>
                        <div class="timeline-content">
                            <h6>Objective Created</h6>
                            <small class="text-muted">{{ $objective->created_at->format('M d, Y g:i A') }}</small>
                        </div>
                    </div>
                    @if($objective->updated_at != $objective->created_at)
                        <div class="timeline-item">
                            <div class="timeline-marker bg-info"></div>
                            <div class="timeline-content">
                                <h6>Last Updated</h6>
                                <small class="text-muted">{{ $objective->updated_at->format('M d, Y g:i A') }}</small>
                            </div>
                        </div>
                    @endif
                    @if($objective->status === 'completed')
                        <div class="timeline-item">
                            <div class="timeline-marker bg-success"></div>
                            <div class="timeline-content">
                                <h6>Objective Completed</h6>
                                <small class="text-muted">Congratulations! 🎉</small>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Progress Summary -->
        <div class="card mt-3">
            <div class="card-header">
                <h5><i class="bi bi-graph-up"></i> Progress Summary</h5>
            </div>
            <div class="card-body">
                @if($objective->keyResults->count() > 0)
                    @php
                        $totalKRs = $objective->keyResults->count();
                        $completedKRs = $objective->keyResults->where('status', 'completed')->count();
                        $inProgressKRs = $objective->keyResults->where('status', 'in_progress')->count();
                        $notStartedKRs = $objective->keyResults->where('status', 'not_started')->count();
                        $overallProgress = $totalKRs > 0 ? round(($completedKRs / $totalKRs) * 100) : 0;
                    @endphp
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Overall Progress</span>
                            <span>{{ $overallProgress }}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" 
                                 role="progressbar" 
                                 style="width: {{ $overallProgress }}%"
                                 aria-valuenow="{{ $overallProgress }}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                    </div>

                    <ul class="list-unstyled mb-0">
                        <li><i class="bi bi-check-circle text-success"></i> {{ $completedKRs }} Completed</li>
                        <li><i class="bi bi-play-circle text-warning"></i> {{ $inProgressKRs }} In Progress</li>
                        <li><i class="bi bi-circle text-secondary"></i> {{ $notStartedKRs }} Not Started</li>
                    </ul>
                @else
                    <p class="text-muted mb-0">No key results to track progress.</p>
                @endif
            </div>
        </div>
    </div>
</div>

<style>
.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline-item {
    position: relative;
    margin-bottom: 20px;
}

.timeline-marker {
    position: absolute;
    left: -35px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    top: 5px;
}

.timeline-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: -30px;
    top: 17px;
    width: 2px;
    height: calc(100% + 8px);
    background-color: #dee2e6;
}

.timeline-content h6 {
    margin-bottom: 2px;
    font-size: 0.9rem;
}
</style>
@endsection

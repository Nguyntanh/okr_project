@extends('layouts.app')

@section('content')
    <div class="content-container">
        <h1 class="page-title">Chỉnh Sửa Key Result</h1>

        @if ($errors->any())
            <div class="error-alert" role="alert">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('my-key-results.update', [$objective->objective_id, $keyResult->kr_id]) }}" method="POST" class="form-container">
            @csrf
            @method('PUT')
            <div class="form-grid">
                <!-- Tiêu đề Objective -->
                <div class="form-group">
                    <label for="obj_title" class="form-label">Objective</label>
                    <input type="text" id="obj_title" value="{{ $objective->obj_title }}" class="form-input" disabled>
                </div>

                <!-- Tiêu đề Key Result -->
                <div class="form-group">
                    <label for="kr_title" class="form-label">Tiêu đề Key Result *</label>
                    <input type="text" name="kr_title" id="kr_title" value="{{ old('kr_title', $keyResult->kr_title) }}" class="form-input">
                    @error('kr_title') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Mục tiêu -->
                <div class="form-group">
                    <label for="target_value" class="form-label">Mục tiêu *</label>
                    <input type="number" name="target_value" id="target_value" value="{{ old('target_value', $keyResult->target_value) }}" class="form-input" step="0.01">
                    @error('target_value') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Giá trị hiện tại -->
                <div class="form-group">
                    <label for="current_value" class="form-label">Giá trị hiện tại *</label>
                    <input type="number" name="current_value" id="current_value" value="{{ old('current_value', $keyResult->current_value) }}" class="form-input" step="0.01">
                    @error('current_value') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Đơn vị -->
                <div class="form-group">
                    <label for="unit" class="form-label">Đơn vị *</label>
                    <input type="text" name="unit" id="unit" value="{{ old('unit', $keyResult->unit) }}" class="form-input">
                    @error('unit') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Trạng thái -->
                <div class="form-group">
                    <label for="status" class="form-label">Trạng thái *</label>
                    <select name="status" id="status" class="form-input form-select">
                        <option value="draft" {{ old('status', $keyResult->status) == 'draft' ? 'selected' : '' }}>Bản nháp</option>
                        <option value="active" {{ old('status', $keyResult->status) == 'active' ? 'selected' : '' }}>Đang thực hiện</option>
                        <option value="completed" {{ old('status', $keyResult->status) == 'completed' ? 'selected' : '' }}>Hoàn thành</option>
                    </select>
                    @error('status') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Trọng số -->
                <div class="form-group">
                    <label for="weight" class="form-label">Trọng số (%)*</label>
                    <input type="number" name="weight" id="weight" value="{{ old('weight', $keyResult->weight) }}" class="form-input" min="0" max="100">
                    @error('weight') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Tiến độ -->
                <div class="form-group">
                    <label for="progress_percent" class="form-label">Tiến độ (%)</label>
                    <input type="number" name="progress_percent" id="progress_percent" value="{{ old('progress_percent', $keyResult->progress_percent) }}" class="form-input" min="0" max="100">
                    @error('progress_percent') <span class="error-message">{{ $message }}</span> @enderror
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="submit-btn">Cập nhật Key Result</button>
                <a href="{{ route('my-key-results.index') }}" class="cancel-link">Hủy</a>
            </div>
        </form>
    </div>
@endsection

<style>
    .content-container {
        margin-left: auto;
        margin-right: auto;
        padding: 1.5rem;
    }

    .page-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 1.5rem;
    }

    .error-alert {
        background-color: #fef2f2;
        border: 1px solid #feb2b2;
        color: #741a1a;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
    }

    .form-container {
        background-color: white;
        padding: 1.5rem;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    @media (min-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    .form-group {
        display: block;
    }

    .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: medium;
        color: #4a5568;
    }

    .form-input,
    .form-select,
    .form-textarea {
        margin-top: 0.25rem;
        display: block;
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        padding: 0.5rem;
        transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
    }

    .form-textarea {
        height: 100px;
        resize: vertical;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }

    .form-input:blur,
    .form-select:blur,
    .form-textarea:blur {
        border-color: #e2e8f0;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .error-message {
        color: #e53e3e;
        font-size: 0.75rem;
    }

    .form-actions {
        margin-top: 1.5rem;
    }

    .submit-btn {
        background-color: #38a169;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
    }

    .submit-btn:hover {
        background-color: #2f855a;
    }

    .cancel-link {
        margin-left: 1rem;
        color: #718096;
        text-decoration: none;
        transition: color 0.2s;
    }

    .cancel-link:hover {
        color: #4a5568;
    }
</style>
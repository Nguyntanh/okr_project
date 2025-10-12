@extends('layouts.app')

@section('content')
    <div class="content-container">
        <h1>Tạo Key Result Mới</h1>

        @if ($errors->any())
            <div class="error-alert" role="alert">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('my-key-results.store') }}" method="POST">
            @csrf
            <!-- Sửa thành objective_id -->
            <input type="hidden" name="objective_id" value="{{ $objective->objective_id }}">

            <div class="form-grid">
                <!-- Tiêu đề Objective -->
                <div>
                    <label for="obj_title">Objective</label>
                    <input type="text" id="obj_title" value="{{ $objective->obj_title }}" disabled>
                </div>

                <!-- Tiêu đề Key Result -->
                <div>
                    <label for="kr_title">Tiêu đề Key Result *</label>
                    <input type="text" name="kr_title" id="kr_title" value="{{ old('kr_title') }}">
                    @error('kr_title') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Mục tiêu -->
                <div>
                    <label for="target_value">Mục tiêu *</label>
                    <input type="number" name="target_value" id="target_value" value="{{ old('target_value') }}" step="0.01">
                    @error('target_value') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Giá trị hiện tại -->
                <div>
                    <label for="current_value">Giá trị hiện tại *</label>
                    <input type="number" name="current_value" id="current_value" value="{{ old('current_value') }}" step="0.01">
                    @error('current_value') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Đơn vị -->
                <div>
                    <label for="unit">Đơn vị *</label>
                    <input type="text" name="unit" id="unit" value="{{ old('unit') }}">
                    @error('unit') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Trạng thái -->
                <div>
                    <label for="status">Trạng thái *</label>
                    <select name="status" id="status">
                        <option value="draft" {{ old('status') == 'draft' ? 'selected' : '' }}>Bản nháp</option>
                        <option value="active" {{ old('status') == 'active' ? 'selected' : '' }}>Đang thực hiện</option>
                        <option value="completed" {{ old('status') == 'completed' ? 'selected' : '' }}>Hoàn thành</option>
                    </select>
                    @error('status') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Trọng số -->
                <div>
                    <label for="weight">Trọng số (%)*</label>
                    <input type="number" name="weight" id="weight" value="{{ old('weight') }}" min="0" max="100">
                    @error('weight') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Tiến độ -->
                <div>
                    <label for="progress_percent">Tiến độ (%)</label>
                    <input type="number" name="progress_percent" id="progress_percent" value="{{ old('progress_percent') }}" min="0" max="100">
                    @error('progress_percent') <span class="error-message">{{ $message }}</span> @enderror
                </div>
            </div>

            <div class="form-actions">
                <button type="submit">Lưu Key Result</button>
                <a href="{{ route('my-key-results.index') }}">Hủy</a>
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

    .content-container h1 {
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

    .form-grid div {
        display: block;
    }

    .form-grid label {
        display: block;
        font-size: 0.875rem;
        font-weight: medium;
        color: #4a5568;
    }

    .form-grid input,
    .form-grid textarea,
    .form-grid select {
        margin-top: 0.25rem;
        display: block;
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        padding: 0.5rem;
        transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-grid input:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
    }

    .form-grid input:focus,
    .form-grid textarea:focus,
    .form-grid select:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }

    .form-grid input:blur,
    .form-grid textarea:blur,
    .form-grid select:blur {
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

    .form-actions button {
        background-color: #38a169;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
    }

    .form-actions button:hover {
        background-color: #2f855a;
    }

    .form-actions a {
        margin-left: 1rem;
        color: #718096;
        text-decoration: none;
        transition: color 0.2s;
    }

    .form-actions a:hover {
        color: #4a5568;
    }
</style>
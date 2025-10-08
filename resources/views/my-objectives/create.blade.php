@extends('layouts.app')

@section('content')
    <div class="content-container">
        <h1>Tạo OKR Cấp Phòng Ban</h1>

        @if ($errors->any())
            <div class="error-alert" role="alert">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('my-objectives.store') }}" method="POST">
            @csrf
            <input type="hidden" name="level" value="Phòng ban">

            <div class="form-grid">
                <!-- Tiêu đề Objective -->
                <div>
                    <label for="obj_title">Tiêu đề Objective *</label>
                    <input type="text" name="obj_title" id="obj_title" value="{{ old('obj_title') }}">
                    @error('obj_title') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Mô tả -->
                <div>
                    <label for="description">Mô tả</label>
                    <textarea name="description" id="description">{{ old('description') }}</textarea>
                    @error('description') <span class="error-message">{{ $message }}</span> @enderror
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

                <!-- Tiến độ -->
                <div>
                    <label for="progress_percent">Tiến độ (%)</label>
                    <input type="number" name="progress_percent" id="progress_percent" value="{{ old('progress_percent') }}" min="0" max="100">
                    @error('progress_percent') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Chu kỳ -->
                <div>
                    <label for="cycle_id">Chu kỳ *</label>
                    <select name="cycle_id" id="cycle_id">
                        <option value="">Chọn chu kỳ</option>
                        @foreach($cycles as $cycle)
                            <option value="{{ $cycle->cycle_id }}" {{ old('cycle_id') == $cycle->cycle_id ? 'selected' : '' }}>
                                {{ $cycle->cycle_name }}
                            </option>
                        @endforeach
                    </select>
                    @error('cycle_id') <span class="error-message">{{ $message }}</span> @enderror
                </div>

                <!-- Phòng ban -->
                @if(Auth::user()->role->role_name === 'Admin')
                    <div>
                        <label for="department_id">Phòng ban *</label>
                        <select name="department_id" id="department_id">
                            <option value="">Chọn phòng ban</option>
                            @foreach($departments as $department)
                                <option value="{{ $department->department_id }}" {{ old('department_id') == $department->department_id ? 'selected' : '' }}>
                                    {{ $department->d_name }}
                                </option>
                            @endforeach
                        </select>
                        @error('department_id') <span class="error-message">{{ $message }}</span> @enderror
                    </div>
                @elseif(Auth::user()->role->role_name === 'Manager')
                    <div>
                        <label for="department_id">Phòng ban *</label>
                        <input type="hidden" name="department_id" value="{{ $departments[0]->department_id }}">
                        <input type="text" value="{{ $departments[0]->d_name }}" disabled>
                        @error('department_id') <span class="error-message">{{ $message }}</span> @enderror
                    </div>
                @endif
            </div>

            <!-- Key Results -->
            <div class="kr-section">
                <h2>Key Results</h2>
                <div id="kr-container">
                    <div class="kr-item">
                        <div class="form-grid">
                            <div>
                                <label>Tiêu đề Key Result *</label>
                                <input type="text" name="key_results[0][kr_title]" value="{{ old('key_results.0.kr_title') }}">
                                @error('key_results.0.kr_title') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <label>Mục tiêu *</label>
                                <input type="number" name="key_results[0][target_value]" value="{{ old('key_results.0.target_value') }}" step="0.01">
                                @error('key_results.0.target_value') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <label>Giá trị hiện tại *</label>
                                <input type="number" name="key_results[0][current_value]" value="{{ old('key_results.0.current_value') }}" step="0.01">
                                @error('key_results.0.current_value') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <label>Đơn vị *</label>
                                <input type="text" name="key_results[0][unit]" value="{{ old('key_results.0.unit') }}">
                                @error('key_results.0.unit') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <label>Trạng thái *</label>
                                <select name="key_results[0][status]">
                                    <option value="draft" {{ old('key_results.0.status') == 'draft' ? 'selected' : '' }}>Bản nháp</option>
                                    <option value="active" {{ old('key_results.0.status') == 'active' ? 'selected' : '' }}>Đang thực hiện</option>
                                    <option value="completed" {{ old('key_results.0.status') == 'completed' ? 'selected' : '' }}>Hoàn thành</option>
                                </select>
                                @error('key_results.0.status') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <label>Trọng số (%)*</label>
                                <input type="number" name="key_results[0][weight]" value="{{ old('key_results.0.weight') }}" min="0" max="100">
                                @error('key_results.0.weight') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <label>Tiến độ (%)</label>
                                <input type="number" name="key_results[0][progress_percent]" value="{{ old('key_results.0.progress_percent') }}" min="0" max="100">
                                @error('key_results.0.progress_percent') <span class="error-message">{{ $message }}</span> @enderror
                            </div>
                            <div>
                                <button type="button" class="remove-kr">Xóa</button>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="button" id="add-kr">Thêm Key Result</button>
            </div>

            <div class="form-actions">
                <button type="submit">Lưu OKR</button>
                <a href="{{ route('my-objectives.index') }}">Hủy</a>
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

    .kr-section {
        margin-top: 2rem;
    }

    .kr-section h2 {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 1rem;
    }

    .kr-item {
        border: 1px solid #e2e8f0;
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }

    #add-kr {
        background-color: #4c51bf;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }

    #add-kr:hover {
        background-color: #434190;
    }

    .remove-kr {
        background-color: #e53e3e;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
    }

    .remove-kr:hover {
        background-color: #c53030;
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

<script>
    document.getElementById('add-kr').addEventListener('click', function() {
        const container = document.getElementById('kr-container');
        const count = container.children.length;
        const krItem = document.createElement('div');
        krItem.className = 'kr-item';
        krItem.innerHTML = `
            <div class="form-grid">
                <div>
                    <label>Tiêu đề Key Result *</label>
                    <input type="text" name="key_results[${count}][kr_title]" value="">
                    @error('key_results.${count}.kr_title') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label>Mục tiêu *</label>
                    <input type="number" name="key_results[${count}][target_value]" value="" step="0.01">
                    @error('key_results.${count}.target_value') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label>Giá trị hiện tại *</label>
                    <input type="number" name="key_results[${count}][current_value]" value="" step="0.01">
                    @error('key_results.${count}.current_value') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label>Đơn vị *</label>
                    <input type="text" name="key_results[${count}][unit]" value="">
                    @error('key_results.${count}.unit') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label>Trạng thái *</label>
                    <select name="key_results[${count}][status]">
                        <option value="draft">Bản nháp</option>
                        <option value="active">Đang thực hiện</option>
                        <option value="completed">Hoàn thành</option>
                    </select>
                    @error('key_results.${count}.status') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label>Trọng số (%)*</label>
                    <input type="number" name="key_results[${count}][weight]" value="" min="0" max="100">
                    @error('key_results.${count}.weight') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <label>Tiến độ (%)</label>
                    <input type="number" name="key_results[${count}][progress_percent]" value="" min="0" max="100">
                    @error('key_results.${count}.progress_percent') <span class="error-message">{{ $message }}</span> @enderror
                </div>
                <div>
                    <button type="button" class="remove-kr">Xóa</button>
                </div>
            </div>
        `;
        container.appendChild(krItem);
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-kr')) {
            e.target.closest('.kr-item').remove();
        }
    });
</script>
@extends('layouts.app')

@section('content')
    <div class="content-container">
        <h1>Danh Sách Key Results</h1>

        @if ($errors->any())
            <div class="error-alert" role="alert">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        @if (session('success'))
            <div class="success-alert" role="alert">
                {{ session('success') }}
            </div>
        @endif

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Tiêu đề</th>
                        <th>Objective</th>
                        <th>Mục tiêu</th>
                        <th>Giá trị hiện tại</th>
                        <th>Đơn vị</th>
                        <th>Trạng thái</th>
                        <th>Trọng số</th>
                        <th>Tiến độ</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($keyResults as $keyResult)
                        <tr>
                            <td>{{ $keyResult->kr_title }}</td>
                            <td>{{ $keyResult->objective->obj_title }}</td>
                            <td>{{ $keyResult->target_value }}</td>
                            <td>{{ $keyResult->current_value }}</td>
                            <td>{{ $keyResult->unit }}</td>
                            <td>{{ $keyResult->status }}</td>
                            <td>{{ $keyResult->weight }}%</td>
                            <td>{{ $keyResult->progress_percent }}%</td>
                            <td>
                                <a href="{{ route('my-key-results.edit', [$keyResult->objective_id, $keyResult->kr_id]) }}">Sửa</a>
                                <form action="{{ route('my-key-results.destroy', [$keyResult->objective_id, $keyResult->kr_id]) }}" method="POST" style="display:inline;">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" onclick="return confirm('Bạn có chắc muốn xóa?')">Xóa</button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="9">Không có Key Result nào.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{ $keyResults->links() }}
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

    .success-alert {
        background-color: #f0fff4;
        border: 1px solid #9ae6b4;
        color: #22543d;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
    }

    .table-container {
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th, td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }

    th {
        background-color: #f7fafc;
        font-weight: bold;
    }

    tr:hover {
        background-color: #f7fafc;
    }

    a {
        margin-right: 1rem;
        color: #38a169;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }

    button {
        background-color: #e53e3e;
        color: white;
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
    }

    button:hover {
        background-color: #c53030;
    }
</style>
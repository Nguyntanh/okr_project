<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lỗi 500 - Server Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .error-container {
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            margin: 1rem;
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .error-title {
            font-size: 2rem;
            font-weight: bold;
            color: #e53e3e;
            margin-bottom: 1rem;
        }
        .error-message {
            color: #4a5568;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .error-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #3182ce;
            color: white;
        }
        .btn-primary:hover {
            background: #2c5aa0;
        }
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        .btn-secondary:hover {
            background: #cbd5e0;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1 class="error-title">Lỗi 500</h1>
        <p class="error-message">
            {{ $message ?? 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.' }}
        </p>
        <div class="error-actions">
            <a href="{{ url()->previous() }}" class="btn btn-secondary">Quay lại</a>
            <a href="{{ route('dashboard') }}" class="btn btn-primary">Về trang chủ</a>
        </div>
    </div>
</body>
</html>

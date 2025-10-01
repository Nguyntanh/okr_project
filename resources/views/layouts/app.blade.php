<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team OKR Dashboard</title>
    <!-- Tailwind CSS -->
    <link href="{{ asset('dist/output.css') }}" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('assets/css/app.css') }}">
</head>
<body>

    @auth
    <div class="container flex flex-row min-h-screen">
        <!-- Sidebar -->
        <div class="sidebar flex flex-col">
            <div class="user-custom container flex flex-col justify-center items-center">
                <div class="user-info container flex flex-row justify-center items-center">
                    @php
                        $user = Auth::user();
                        // \Log::info('Layout user:', ['user' => $user]);
                        $avatar = $user && $user->avatar_url ? asset($user->avatar_url) : asset('images/default.png');
                        $name = $user && $user->full_name ? $user->full_name : 'User';
                    @endphp
                    <img src="{{ $avatar }}" alt="Avatar" id="info" class="logo">
                    <span class="container">{{ $name }}</span>
                </div>
                <div id="detail" class="user-detail flex flex-col justify-center">
                    <a href="{{ route('profile.show') }}" class="child-detail">Hồ sơ / Trang của tôi</a>
                    <form action="{{ route('auth.logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="child-detail">Đăng xuất</button>
                    </form>
                    {{-- <a href="/auth/logout">Đăng xuất</a> --}}
                </div>
            </div>
            <nav class="container flex flex-col justify-center items-center">
                <a href="{{ route('dashboard') }}" class="tag container">
                    <span>Home</span>
                </a>
                <a href="#" class="tag container">
                    <span>Team</span>
                </a>
                <a href="#" class="tag container">
                    <span>Reports</span>
                </a>
                <a href="#" class="tag container">
                    <span>Settings</span>
                </a>
                <a href="{{ route('cycles.index') }}" class="tag container">
                    <span>Cycles</span>
                </a>
                <a href="{{ route('objectives.index') }}" class="tag container">
                    <span>Objectives</span>
                </a>
                <a href="{{ route('my-okr.index') }}" class="tag container">
                    <span>My OKR</span>
                </a>
            </nav>
        </div>
        <!-- Main Content -->
        <main class="main-content container">
            @yield('content')
        </main>
    </div>
    @endauth

    <script>
        const toggleProfile = document.getElementById('info');
        const detailProfile = document.getElementById('detail');

        // Kiểm tra xem các phần tử có tồn tại không
        if (toggleProfile && detailProfile) {
            toggleProfile.addEventListener('click', () => {
                detailProfile.classList.toggle('visible'); // Toggle class để hiển thị/ẩn
            });
        } else {
            console.error('Không tìm thấy phần tử #info hoặc #detail');
        }
    </script>
</body>
</html>
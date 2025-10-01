<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hồ sơ cá nhân - OKR System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<style>
    :root {
        /* Light theme colors - đồng bộ với dashboard */
        --bg-primary: #f8fafc;
        --bg-secondary: #ffffff;
        --bg-card: #ffffff;
        --text-primary: #1f2937;
        --text-secondary: #6b7280;
        --text-muted: #9ca3af;
        --accent-green: #10b981;
        --accent-blue: #3b82f6;
        --accent-orange: #f59e0b;
        --border: #e5e7eb;
        --shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg-primary);
        color: var(--text-primary);
        line-height: 1.6;
    }

    /* Header */
    .header {
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border);
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: var(--shadow);
    }

    .logo {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--text-primary);
        text-decoration: none;
    }

    .search-bar {
        display: flex;
        align-items: center;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.5rem 1rem;
        width: 300px;
    }

    .search-bar input {
        background: transparent;
        border: none;
        color: var(--text-primary);
        outline: none;
        width: 100%;
        margin-left: 0.5rem;
    }

    .search-bar input::placeholder {
        color: var(--text-muted);
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .icon {
        width: 24px;
        height: 24px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        color: var(--text-secondary);
    }

    .icon:hover {
        opacity: 1;
        color: var(--accent-blue);
    }

    /* Profile dropdown */
    .profile {
        position: relative;
    }

    .profile summary {
        list-style: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .profile summary::-webkit-details-marker {
        display: none;
    }

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
    }

    .menu {
        position: absolute;
        right: 0;
        top: 48px;
        min-width: 200px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow);
        padding: 1rem;
        z-index: 50;
    }

    .menu .user-info {
        margin-bottom: 1rem;
    }

    .menu .name {
        font-weight: 600;
        color: var(--text-primary);
    }

    .menu .email {
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .menu .line {
        height: 1px;
        background: var(--border);
        margin: 0.75rem 0;
    }

    .menu a {
        display: block;
        padding: 0.5rem 0;
        color: var(--text-primary);
        text-decoration: none;
        transition: color 0.2s;
    }

    .menu a:hover {
        color: var(--accent-blue);
    }

    /* Custom styles for section titles */
    .section-title {
        font-size: 1.5rem; /* Đồng bộ kích thước với text-2xl */
        font-weight: 600; /* Đồng bộ font-weight với font-medium */
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
</style>
<body class="bg-gray-50">
    <!-- Header -->
    <div class="header">
        <a href="{{ route('dashboard') }}" class="logo">OKR | FOCUS</a>        
        <div class="search-bar">
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
            </svg>
            <input type="text" placeholder="Search">
        </div>

        <div class="header-right">
            @auth
                @php
                    $avatar = auth()->user()->avatar_url ?: 'https://www.gravatar.com/avatar/'.md5(strtolower(trim(auth()->user()->email))).'?s=200&d=identicon';
                @endphp

                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                </svg>

                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                </svg>

                <details class="profile">
                    <summary>
                        <img class="avatar" src="{{ $avatar }}" alt="avatar">
                        <span>{{ auth()->user()->full_name ?? 'User' }}</span>
                    </summary>
                    <div class="menu">
                        <div class="user-info">
                            <img class="avatar" src="{{ $avatar }}" alt="avatar">
                            <div>
                                <div class="name">{{ auth()->user()->full_name ?? 'Chưa cập nhật' }}</div>
                                <div class="email">{{ auth()->user()->email }}</div>
                            </div>
                        </div>
                        <div class="line"></div>
                        <a href="/profile" class="dropdown-item">Hồ sơ / Trang của tôi</a>
                        <a href="{{ route('auth.logout') }}" class="dropdown-item">Đăng xuất</a>
                    </div>
                </details>
            @endauth
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
            <!-- Header -->
            <!-- Success Message -->
            @if(session('success'))
                <div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <div class="flex">
                        <i class="fas fa-check-circle text-green-400"></i>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                        </div>
                    </div>
                </div>
            @endif

            <!-- Section 1: Profile Update -->
            <div>
                <h2 class="section-title">Hồ sơ cá nhân</h2>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Profile Info -->
                    <div class="lg:col-span-1">
                        <div class="bg-white rounded-lg shadow-sm border p-6">
                            <div class="text-center">
                                @if($user->avatar_url)
                                    <img src="{{ $user->avatar_url }}" alt="Avatar" class="w-24 h-24 rounded-full mx-auto mb-4">
                                @else
                                    <div class="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <span class="text-white text-2xl font-medium">{{ substr($user->full_name ?? $user->email, 0, 1) }}</span>
                                    </div>
                                @endif
                                <h3 class="text-lg font-medium text-gray-900">{{ $user->full_name ?? 'Chưa cập nhật' }}</h3>
                                <p class="text-gray-500">{{ $user->email }}</p>
                                @if($user->job_title)
                                    <p class="text-sm text-gray-600 mt-1">{{ $user->job_title }}</p>
                                @endif
                            </div>
                        </div>
                    </div>

                    <!-- Edit Form -->
                    <div class="lg:col-span-2">
                        <div class="bg-white rounded-lg shadow-sm border">
                            <form action="{{ route('profile.update') }}" method="POST" enctype="multipart/form-data" class="p-6">
                                @csrf
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Full Name -->
                                    <div>
                                        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                                        <input type="text" 
                                               id="full_name" 
                                               name="full_name" 
                                               value="{{ old('full_name', $user->full_name) }}"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                               required>
                                        @error('full_name')
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>

                                    <!-- Email -->
                                    <div>
                                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input type="email" 
                                               id="email" 
                                               name="email" 
                                               value="{{ old('email', $user->email) }}"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                               required>
                                        @error('email')
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>

                                    <!-- Phone -->
                                    <div>
                                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                                        <input type="text" 
                                               id="phone" 
                                               name="phone" 
                                               value="{{ old('phone', $user->phone) }}"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        @error('phone')
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>

                                    <!-- Job Title -->
                                    <div>
                                        <label for="job_title" class="block text-sm font-medium text-gray-700 mb-2">Chức vụ</label>
                                        <input type="text" 
                                               id="job_title" 
                                               name="job_title" 
                                               value="{{ old('job_title', $user->job_title) }}"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        @error('job_title')
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>
                                </div>

                                <!-- Avatar Upload -->
                                <div class="mt-6">
                                    <label for="avatar" class="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                                    <div class="flex items-center space-x-4">
                                        <input type="file" 
                                               id="avatar" 
                                               name="avatar" 
                                               accept="image/*"
                                               class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                                        <p class="text-sm text-gray-500">JPG, PNG, GIF tối đa 2MB</p>
                                    </div>
                                    @error('avatar')
                                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                    @enderror
                                </div>

                                <!-- Submit Button -->
                                <div class="mt-8 flex justify-end space-x-3">
                                    <a href="{{ route('dashboard') }}" 
                                       class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        Hủy
                                    </a>
                                    <button type="submit" 
                                            class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <i class="fas fa-save mr-2"></i>Cập nhật
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Separator -->
            <div class="my-6 mx-6 text-center">
                <hr class="border-t border-gray-200">
                <hr class="border-t border-gray-200">
            </div>

            <!-- Section 2: Change Password -->
            <div>
                <h2 class="section-title">Đổi mật khẩu</h2>
                @if ($errors->any())
                    <div class="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                        <div class="flex">
                            <i class="fas fa-exclamation-triangle text-red-400"></i>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-red-800">{{ $errors->first() }}</p>
                            </div>
                        </div>
                    </div>
                @endif
                <form action="{{ route('change.password') }}" method="POST" class="space-y-6 p-6 bg-white rounded-lg shadow-sm border">
                    @csrf
                    <div>
                        <label for="old_password" class="block text-sm font-medium text-gray-700 mb-2">Mật khẩu cũ</label>
                        <input type="password" 
                               id="old_password" 
                               name="old_password" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               required>
                        @error('old_password')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                        <input type="password" 
                               id="new_password" 
                               name="new_password" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               required>
                        @error('new_password')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="new_password_confirmation" class="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                        <input type="password" 
                               id="new_password_confirmation" 
                               name="new_password_confirmation" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               required>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="submit" 
                                class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <i class="fas fa-lock mr-2"></i>Đổi mật khẩu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        function toggleDropdown() {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('hidden');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('userDropdown');
            const button = event.target.closest('button');
            
            if (!button || !button.onclick || button.onclick.toString().indexOf('toggleDropdown') === -1) {
                dropdown.classList.add('hidden');
            }
        });
    </script>
</body>
</html>
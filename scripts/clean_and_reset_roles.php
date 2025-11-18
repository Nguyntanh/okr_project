<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\Role;
use App\Models\User;

// Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🧹 Làm sạch và reset roles theo cấu trúc trong ảnh...\n\n";

// 1. Xóa tất cả users trước (để tránh foreign key constraint)
echo "🗑️  Xóa tất cả users...\n";
User::truncate();

// 2. Xóa tất cả roles
echo "🗑️  Xóa tất cả roles...\n";
Role::truncate();

// 3. Tạo lại roles theo đúng cấu trúc mới
echo "➕ Tạo lại roles theo cấu trúc mới...\n";

$roles = [
    [
        'role_name' => 'admin',
        'description' => 'Quản trị viên hệ thống',
        'level' => 'company',
        'allowed_levels' => json_encode(['company', 'unit', 'person']),
    ],
    [
        'role_name' => 'ceo',
        'description' => 'Tổng giám đốc điều hành',
        'level' => 'company',
        'allowed_levels' => json_encode(['company', 'unit', 'person']),
    ],
    [
        'role_name' => 'manager',
        'description' => 'Quản lý cấp đơn vị',
        'level' => 'unit',
        'allowed_levels' => json_encode(['unit', 'person']),
    ],
    [
        'role_name' => 'member',
        'description' => 'Thành viên cấp đơn vị',
        'level' => 'unit',
        'allowed_levels' => json_encode(['person']),
    ],
];

foreach ($roles as $roleData) {
    Role::create($roleData);
}

// 4. Tạo lại user admin
echo "👤 Tạo lại user admin...\n";
$adminRole = Role::find(1); // admin role

$adminUser = User::create([
    'email' => 'okr.admin@company.com',
    'full_name' => 'System Administrator',
    'role_id' => $adminRole->role_id,
    'sub' => 'admin-' . time(),
    'status' => 'active',
    'is_invited' => false,
]);

// 5. Tạo user member
echo "👤 Tạo user member...\n";
$memberRole = Role::where('role_name', 'member')
                 ->where('level', 'unit')
                 ->first();

$memberUser = User::create([
    'email' => 'anh249205@gmail.com',
    'full_name' => 'Nguyễn Đình Tuấn Anh',
    'role_id' => $memberRole->role_id,
    'sub' => 'member-' . time(),
    'status' => 'active',
    'is_invited' => false,
]);

echo "\n✅ Hoàn thành! Kiểm tra kết quả:\n\n";

// Hiển thị kết quả
$allRoles = Role::orderBy('role_id')->get();
echo "📋 Danh sách roles:\n";
echo str_repeat("-", 80) . "\n";
printf("%-8s %-12s %-30s %-12s %-20s\n", "ID", "Role Name", "Description", "Level", "Allowed Levels");
echo str_repeat("-", 80) . "\n";

foreach ($allRoles as $role) {
    $allowedLevels = $role->allowed_levels ? json_decode($role->allowed_levels, true) : [];
    $allowedLevelsStr = is_array($allowedLevels) ? implode(', ', $allowedLevels) : 'N/A';

    printf("%-8s %-12s %-30s %-12s %-20s\n",
        $role->role_id,
        $role->role_name,
        $role->description,
        $role->level,
        $allowedLevelsStr
    );
}

echo str_repeat("-", 80) . "\n\n";

echo "👤 User admin:\n";
echo "   - Email: {$adminUser->email}\n";
echo "   - Role ID: {$adminUser->role_id} (admin)\n";
echo "   - isAdmin(): " . ($adminUser->isAdmin() ? "✅ TRUE" : "❌ FALSE") . "\n";

echo "\n🎉 Database đã được reset và khớp hoàn toàn với ảnh của bạn!\n";

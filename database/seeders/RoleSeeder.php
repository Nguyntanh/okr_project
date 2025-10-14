<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'role_name' => 'admin',
                'description' => 'Quản trị viên hệ thống',
                'level' => 'company',
            ],
            [
                'role_name' => 'master',
                'description' => 'Quản lý cấp đơn vị',
                'level' => 'unit',
            ],
            [
                'role_name' => 'master',
                'description' => 'Quản lý cấp nhóm',
                'level' => 'team',
            ],
            [
                'role_name' => 'facilitator',
                'description' => 'Điều phối viên cấp đơn vị',
                'level' => 'unit',
            ],
            [
                'role_name' => 'facilitator',
                'description' => 'Điều phối viên cấp nhóm',
                'level' => 'team',
            ],
            [
                'role_name' => 'member',
                'description' => 'Thành viên cấp đơn vị',
                'level' => 'unit',
            ],
            [
                'role_name' => 'member',
                'description' => 'Thành viên cấp nhóm',
                'level' => 'team',
            ],
            [
                'role_name' => 'member',
                'description' => 'Thành viên cá nhân',
                'level' => 'person',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                [
                    'role_name' => $role['role_name'],
                    'level' => $role['level']
                ],
                $role
            );
        }
    }
}

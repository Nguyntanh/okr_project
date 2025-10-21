<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem hồ sơ.'
            ], 401);
        }
        
        // Load thêm thông tin role và department
        $user->load(['role', 'department']);
        
        // Nếu user có department và department có parent_department_id, load parent department
        if ($user->department && $user->department->parent_department_id) {
            // Load parent department bằng cách query trực tiếp
            $parentDepartment = \App\Models\Department::find($user->department->parent_department_id);
            if ($parentDepartment) {
                $user->department->setRelation('parentDepartment', $parentDepartment);
            }
        }
        
        // Debug: Log để kiểm tra data
        \Log::info('User department data: ' . json_encode([
            'department_id' => $user->department_id,
            'department' => $user->department ? [
                'department_id' => $user->department->department_id,
                'd_name' => $user->department->d_name,
                'type' => $user->department->type,
                'parent_department_id' => $user->department->parent_department_id,
                'parentDepartment' => $user->department->parentDepartment ? [
                    'department_id' => $user->department->parentDepartment->department_id,
                    'd_name' => $user->department->parentDepartment->d_name,
                    'type' => $user->department->parentDepartment->type,
                ] : null
            ] : null
        ], JSON_PRETTY_PRINT));
        
        // Chuẩn bị department data với parentDepartment
        $departmentData = null;
        if ($user->department) {
            $departmentData = [
                'department_id' => $user->department->department_id,
                'd_name' => $user->department->d_name,
                'd_description' => $user->department->d_description,
                'type' => $user->department->type,
                'parent_department_id' => $user->department->parent_department_id,
                'created_at' => $user->department->created_at,
                'updated_at' => $user->department->updated_at,
            ];
            
            // Thêm parentDepartment nếu có
            if ($user->department->parentDepartment) {
                $departmentData['parentDepartment'] = [
                    'department_id' => $user->department->parentDepartment->department_id,
                    'd_name' => $user->department->parentDepartment->d_name,
                    'd_description' => $user->department->parentDepartment->d_description,
                    'type' => $user->department->parentDepartment->type,
                    'parent_department_id' => $user->department->parentDepartment->parent_department_id,
                    'created_at' => $user->department->parentDepartment->created_at,
                    'updated_at' => $user->department->parentDepartment->updated_at,
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'user_id' => $user->user_id,
                'name' => $user->full_name,
                'email' => $user->email,
                'avatar' => $user->avatar_url,
                'status' => $user->status,
                'role' => $user->role,
                'department' => $departmentData,
                'department_id' => $user->department_id,
            ]
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'full_name' => 'nullable|string|max:255',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Cập nhật thông tin cơ bản
        $user->full_name = $request->full_name;

        // Xử lý upload avatar
        if ($request->hasFile('avatar')) {
            // Xóa avatar cũ nếu có
            if ($user->avatar_url && Storage::disk('public')->exists(str_replace('/storage/', '', $user->avatar_url))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $user->avatar_url));
            }

            // Lưu avatar mới
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = '/storage/' . $path;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công!',
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'email' => $user->email,
                'avatar' => $user->avatar_url,
                'status' => $user->status,
            ],
            'redirect' => '/dashboard'
        ]);
    }
}

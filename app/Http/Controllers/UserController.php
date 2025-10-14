<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Role;
use App\Models\Department;

class UserController extends Controller
{
    public function __construct()
    {
        // Middleware sẽ được áp dụng trong routes
    }

    /**
     * Hiển thị danh sách người dùng
     */
    public function index(\Illuminate\Http\Request $request)
    {
        try {
            $q = strtolower((string)$request->query('q', ''));
            $role = strtolower((string)$request->query('role', ''));
            $status = strtolower((string)$request->query('status', ''));
            $departmentId = $request->query('department_id');

            $query = User::with(['role', 'department'])->orderBy('user_id', 'asc');

            if ($q !== '') {
                $query->where(function($w) use ($q){
                    $w->whereRaw('LOWER(full_name) LIKE ?', ['%'.$q.'%'])
                      ->orWhereRaw('LOWER(email) LIKE ?', ['%'.$q.'%']);
                });
            }
            if ($role !== '') {
                $query->whereHas('role', function($r) use ($role){ $r->whereRaw('LOWER(role_name) = ?', [$role]); });
            }
            if ($status !== '') {
                $query->whereRaw('LOWER(status) = ?', [$status]);
            }
            if (!empty($departmentId)) {
                $query->where('department_id', $departmentId);
            }

            $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
            $page = max(1, (int) $request->query('page', 1));
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $paginator->items(),
                    'pagination' => [
                        'total' => $paginator->total(),
                        'per_page' => $paginator->perPage(),
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                    ],
                ]);
            }

            return view('app');
        } catch (\Exception $e) {
            \Log::error('Error loading users: ' . $e->getMessage());
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Không thể tải danh sách người dùng.'], 500);
            }
            return view('app');
        }
        return view('app');
    }

    public function show($id, \Illuminate\Http\Request $request)
    {
        $user = User::with(['role', 'department'])->findOrFail($id);
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $user]);
        }
        return view('app');
        return view('app');
    }

    /**
     * Cập nhật vai trò người dùng
     */
    public function update(Request $request, $id)
    {
        // Middleware đã kiểm tra quyền Admin

        // Chấp nhận cả role_id hoặc role (theo tên: admin/manager/member)
        $request->validate([
            'role_id' => 'nullable|exists:roles,role_id',
            'role' => 'nullable|string|in:admin,manager,member,Admin,Manager,Member',
            'role_id' => 'nullable|exists:roles,role_id',
            'department_id' => 'nullable|exists:departments,department_id',
        ]);

        $user = User::findOrFail($id);

        // Không cho phép thay đổi vai trò của Admin, nhưng vẫn cho phép cập nhật phòng ban
        $isChangingRole = $request->filled('role_id') || $request->filled('role');
        if ($user->isAdmin() && $isChangingRole) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Không thể thay đổi vai trò của Admin'], 403);
            }
            return back()->withErrors(['role' => 'Không thể thay đổi vai trò của Admin']);
        }

        // Kiểm tra xem có thể thay đổi vai trò không
        if ($user->user_id === Auth::id() && !Auth::user()->isAdmin()) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Bạn không thể thay đổi vai trò của chính mình.'], 400);
            }
            return redirect()->back()->withErrors('Bạn không thể thay đổi vai trò của chính mình.');
        }

        $oldRole = $user->role ? $user->role->role_name : 'Chưa có vai trò';
        $oldDepartment = $user->department ? $user->department->d_name : 'Chưa gán';

        // Xác định role_id (nếu có yêu cầu thay đổi vai trò)
        $roleId = null;
        if ($isChangingRole) {
            $roleId = $request->role_id;
            if (!$roleId && $request->filled('role')) {
                $name = strtolower($request->role);
                $roleId = Role::whereRaw('LOWER(role_name) = ?', [$name])->value('role_id');
            }
            if (!$roleId) {
                if ($request->expectsJson()) {
                    return response()->json(['success' => false, 'message' => 'Thiếu role hoặc role_id hợp lệ.'], 422);
                }
                return redirect()->back()->withErrors('Thiếu role hoặc role_id hợp lệ.');
            }
        }

        // Áp dụng thay đổi
        if (!is_null($roleId)) {
            $user->role_id = $roleId;
        }
        if ($request->filled('department_id')) {
            $user->department_id = $request->department_id;
        }
        // Chỉ cập nhật các trường được gửi
        if ($request->has('role_id')) {
            $user->role_id = $request->role_id;
        }
        if ($request->has('department_id')) {
            $user->department_id = $request->department_id;
        }
        $user->save();

        // Clear cache when user is updated
        \Cache::forget('users_list');

        // Reload relationship để có thể truy cập dữ liệu mới
        $user->load(['role','department']);
        // Reload relationship để có thể truy cập role và department mới
        $user->load(['role', 'department']);
        $newRole = $user->role ? $user->role->role_name : 'Chưa có vai trò';
        $newDepartment = $user->department ? $user->department->d_name : 'Chưa gán';

        // Tạo thông báo dựa trên trường được cập nhật
        $messages = [];
        if ($request->has('role_id')) {
            $messages[] = "vai trò từ {$oldRole} thành {$newRole}";
        }
        if ($request->has('department_id')) {
            $messages[] = "phòng ban từ {$oldDepartment} thành {$newDepartment}";
        }
        
        $message = "Đã cập nhật " . implode(' và ', $messages) . " của {$user->full_name}.";

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => $isChangingRole ? "Đã cập nhật vai trò của {$user->full_name} từ {$oldRole} thành {$newRole}." : 'Cập nhật người dùng thành công.',
                'data' => $user,
                'message' => $message
            ]);
        }

        return redirect()->route('users.index')
            ->with('success', $message);
    }

    /**
     * Cập nhật trạng thái người dùng
     */
    public function updateStatus(Request $request, $id)
    {
        // Middleware đã kiểm tra quyền Admin

        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user = User::findOrFail($id);

        // Không cho phép thay đổi trạng thái của Admin
        if ($user->isAdmin()) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Không thể thay đổi trạng thái của Admin.'], 400);
            }
            return redirect()->back()->withErrors('Không thể thay đổi trạng thái của Admin.');
        }

        // Không cho phép Admin tự vô hiệu hóa chính mình
        if ($user->user_id === Auth::id() && $request->status === 'inactive') {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Bạn không thể vô hiệu hóa tài khoản của chính mình.'], 400);
            }
            return redirect()->back()->withErrors('Bạn không thể vô hiệu hóa tài khoản của chính mình.');
        }

        $oldStatus = $user->status ?? 'active';
        $newStatus = $request->status;

        $user->status = $newStatus;
        $user->save();

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Cập nhật thành công!', 'data' => $user->load(['role', 'department'])]);
        }
        return back()->with('success', 'Cập nhật thành công!');
    }
}
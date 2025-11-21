<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Role;

class DepartmentController extends Controller
{
    /**
     * Hiển thị danh sách tất cả các đơn vị (phòng ban + đội nhóm)
     */
    public function index(Request $request): JsonResponse|View
    {
        $query = Department::query();

        $departments = $query->with([
            'parentDepartment',
            'users' => fn($q) => $q->select('user_id', 'full_name', 'email', 'department_id')
        ])
            ->orderBy('created_at', 'asc')
            ->get();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'data' => $departments]);
        }

        return view('app');
    }

    /**
     * Form tạo mới đơn vị
     */
    public function create(): View
    {
        // Chỉ lấy các phòng ban gốc (parent_id = null) làm cha cho đội nhóm mới
        $parentDepartments = Department::whereNull('parent_department_id')->get();
        return view('app', compact('parentDepartments'));
    }

    /**
     * Lưu đơn vị mới
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'd_name'        => 'required|string|max:255',
            'd_description' => 'nullable|string|max:1000',
            'parent_department_id' => [
                'nullable',
                'exists:departments,department_id',
                // Nếu có parent → đây là đội nhóm, không có parent → phòng ban gốc
                function ($attribute, $value, $fail) use ($request) {
                    // Ngăn việc tạo vòng lặp (cha của chính nó) – sẽ kiểm tra kỹ hơn ở update
                    if ($value && $request->parent_department_id == $value) {
                        $fail('Không thể chọn chính nó làm đơn vị cha.');
                    }
                },
            ],
        ]);

        // Tạo mới
        $department = Department::create($validated);

        $unitType = $department->parent_department_id ? 'đội nhóm' : 'phòng ban';

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Tạo $unitType thành công!",
                'data'    => $department
            ]);
        }

        return redirect()->route('departments.index')
                         ->with('success', "Tạo $unitType thành công!");
    }

    /**
     * Chi tiết đơn vị
     */
    public function show(Department $department): JsonResponse|View
    {
        $department->load(['parentDepartment']);

        if (request()->wantsJson()) {
            return response()->json(['success' => true, 'data' => $department]);
        }

        return view('app');
    }

    /**
     * Form chỉnh sửa
     */
    public function edit(Department $department): View
    {
        // Các phòng ban gốc có thể chọn làm cha (trừ chính nó và con cháu của nó)
        $possibleParents = Department::whereNull('parent_department_id')
            ->where('department_id', '!=', $department->department_id)
            ->get();

        return view('app', compact('department', 'possibleParents'));
    }

    /**
     * Cập nhật đơn vị
     */
    public function update(Request $request, Department $department): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'd_name'        => 'required|string|max:255',
            'd_description' => 'nullable|string|max:1000',
            'parent_department_id' => [
                'nullable',
                'exists:departments,department_id',
                function ($attribute, $value, $fail) use ($department) {
                    if ($value && $value == $department->department_id) {
                        $fail('Đơn vị cha không thể là chính nó.');
                    }

                    // Ngăn tạo vòng lặp (ví dụ A → B → A)
                    if ($value) {
                        $child = Department::find($value);
                        while ($child) {
                            if ($child->department_id == $department->department_id) {
                                $fail('Không thể chọn đơn vị con làm đơn vị cha (tạo vòng lặp).');
                                break;
                            }
                            $child = $child->parentDepartment;
                        }
                    }
                },
            ],
        ]);

        $oldParent = $department->parent_department_id;
        $department->update($validated);

        $unitType = $department->parent_department_id ? 'đội nhóm' : 'phòng ban';

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật thành công!',
                'data'    => $department
            ]);
        }

        return redirect()->route('departments.index')
                         ->with('success', 'Cập nhật thành công!');
    }

    /**
     * Xóa đơn vị
     */
    public function destroy(Department $department): JsonResponse|RedirectResponse
    {

        // Không cho xóa nếu còn người dùng
        if ($department->users()->exists()) {
            $message = 'Không thể xóa vì vẫn còn nhân viên thuộc đơn vị này.';
            if (request()->wantsJson()) {
                return response()->json(['success' => false, 'message' => $message], 422);
            }
            return redirect()->route('departments.index')->withErrors($message);
        }

        $unitName = $department->parent_department_id ? 'đội nhóm' : 'phòng ban';
        $department->delete();

        if (request()->wantsJson()) {
            return response()->json(['success' => true, 'message' => "Xóa $unitName thành công!"]);
        }

        return redirect()->route('departments.index')
                         ->with('success', "Xóa $unitName thành công!");
    }

    /**
     * Form gán người dùng vào đơn vị
     */
    public function assignUsers(Department $department): View
    {
        $users = User::all();
        return view('app', compact('department', 'users'));
    }

    /**
     * Thực hiện gán người dùng + vai trò
     */
    public function storeAssignUsers(Request $request, Department $department): JsonResponse|RedirectResponse
    {
        if (!Auth::user()->canManageUsers() && !Auth::user()->isManager()) {
            $msg = 'Bạn không có quyền gán người dùng.';
            return $request->wantsJson()
                ? response()->json(['success' => false, 'message' => $msg], 403)
                : redirect()->back()->withErrors($msg);
        }

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,user_id',
            'role'     => 'required|in:manager,member,Manager,Member',
        ]);

        // Xác định level dựa trên đơn vị hiện tại
        $level = $department->parent_department_id === null ? 'unit' : 'team';
        $roleName = strtolower(trim($validated['role']));

        $role = Role::whereRaw('LOWER(role_name) = ?', [$roleName])
                    ->where('level', $level)
                    ->firstOrFail();

        User::whereIn('user_id', $validated['user_ids'])
            ->update([
                'department_id' => $department->department_id,
                'role_id'       => $role->role_id,
            ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Gán người dùng và vai trò thành công!']);
        }

        return redirect()->route('departments.index')
                         ->with('success', 'Gán người dùng và vai trò thành công!');
    }
}
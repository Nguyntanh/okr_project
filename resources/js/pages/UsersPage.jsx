import React, { useEffect, useState } from "react";
import { Toast, Select, Badge, Modal } from "../components/ui";
import UserTableRow from "../components/UserTableRow";
import UserTableHeader from "../components/UserTableHeader";
import InviteUserModal from "../components/InviteUserModal";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [rolesByLevel, setRolesByLevel] = useState({});
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [level, setLevel] = useState("");
    const [toast, setToast] = useState({ type: "success", message: "" });
    const showToast = (type, message) => setToast({ type, message });
    const [editingRole, setEditingRole] = useState({});
    const [editingDept, setEditingDept] = useState({});
    const [editingLevel, setEditingLevel] = useState({});
    const [pendingChanges, setPendingChanges] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [teamId, setTeamId] = useState("");

    // Function để load roles theo level
    const loadRolesByLevel = async (level) => {
        if (rolesByLevel[level]) return rolesByLevel[level]; // Đã cache

        try {
            const res = await fetch(`/roles-by-level?level=${level}`, {
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (!res.ok || data.success === false)
                throw new Error(data.message || "Tải roles thất bại");

            const roles = data.data || [];
            setRolesByLevel(prev => ({ ...prev, [level]: roles }));
            return roles;
        } catch (e) {
            console.error("Error loading roles by level:", e);
            return [];
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [resUsers, resDeps, resRoles] = await Promise.all([
                    fetch("/users", {
                        headers: { Accept: "application/json" },
                    }),
                    fetch("/departments", {
                        headers: { Accept: "application/json" },
                    }),
                    fetch("/roles", {
                        headers: { Accept: "application/json" },
                    }),
                ]);
                const usersData = await resUsers.json();
                const depsData = await resDeps.json();
                const rolesData = await resRoles.json();
                setUsers(usersData.data || []);
                setDepartments(depsData.data || []);
                setRoles(rolesData.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Function để reset tất cả filter về trạng thái ban đầu
    const resetAllFilters = () => {
        setQ("");
        setLevel("");
        setRole("");
        setDepartmentId("");
        setStatus("");
        setTeamId("");
    };

    // Kiểm tra có filter nào đang active không
    const hasActiveFilters =
        (q && q.trim()) || level || role || departmentId || status || teamId;

    // Logic filter users
    const filtered = users.filter((u) => {
        // Ẩn tài khoản admin khỏi danh sách
        const isAdmin = (u.role?.role_name || "").toLowerCase() === "admin" || u.email === "okr.admin@company.com";
        if (isAdmin) return false;

        const matchesSearch =
            !q ||
            q.trim() === "" ||
            (u.full_name &&
                u.full_name.toLowerCase().includes(q.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(q.toLowerCase()));

        const matchesRole =
            !role ||
            role === "" ||
            (u.role && u.role.role_name === role);

        const matchesStatus =
            !status ||
            status === "" ||
            u.status === status;

        const matchesDepartment =
            !departmentId ||
            departmentId === "" ||
            u.department_id == departmentId;

        const matchesLevel =
            !level ||
            level === "" ||
            (u.role && u.role.level === level);

        const matchesTeam =
            !teamId ||
            teamId === "" ||
            u.department_id == teamId;

        return (
            matchesSearch &&
            matchesRole &&
            matchesStatus &&
            matchesDepartment &&
            matchesLevel &&
            matchesTeam
        );
    });

    // Hàm xử lý lưu thay đổi
    const handleSaveChanges = async () => {
        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            if (!token) {
                showToast("error", "Không tìm thấy CSRF token");
                return;
            }

            // Lưu từng thay đổi
            for (const [userId, changes] of Object.entries(pendingChanges)) {
                const updateData = {};

                if (changes.role_id) updateData.role_id = changes.role_id;
                if (changes.department_id !== undefined) updateData.department_id = changes.department_id;
                if (changes.status) updateData.status = changes.status;

                if (Object.keys(updateData).length > 0) {
                    console.log(`Updating user ${userId} with:`, updateData);

                    const res = await fetch(`/users/${userId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": token,
                            Accept: "application/json",
                        },
                        body: JSON.stringify(updateData),
                    });

                    const data = await res.json();
                    console.log(`Response for user ${userId}:`, data);

                    if (!res.ok) {
                        if (res.status === 403) {
                            throw new Error("Bạn không có quyền thực hiện thao tác này");
                        } else if (res.status === 401) {
                            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
                        } else if (res.status === 404) {
                            throw new Error("Không tìm thấy người dùng");
                        } else if (res.status === 422) {
                            throw new Error(data.message || "Dữ liệu không hợp lệ");
                        } else {
                            throw new Error(data.message || `Lỗi ${res.status}: Cập nhật thất bại`);
                        }
                    }

                    if (data.success === false) {
                        throw new Error(data.message || "Cập nhật thất bại");
                    }
                }
            }

            // Xóa pending changes
            setPendingChanges({});
            setShowConfirmModal(false);
            showToast("success", "Lưu thay đổi thành công!");

        } catch (e) {
            console.error("Error saving changes:", e);
            showToast("error", e.message || "Lưu thay đổi thất bại");
        }
    };

    return (
        <div className="">
            <Toast
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ type: "success", message: "" })}
            />
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-extrabold text-slate-900">
                        Quản lý người dùng
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                        >
                            Mời người dùng
                        </button>
                        <button
                            onClick={() => {
                                console.log("Pending changes:", pendingChanges);
                                setShowConfirmModal(true);
                            }}
                            disabled={Object.keys(pendingChanges).length === 0}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm shrink-0 ${
                                Object.keys(pendingChanges).length === 0
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                            Lưu thay đổi ({Object.keys(pendingChanges).length})
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                    {/* Thanh tìm kiếm - 1 dòng riêng */}
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Filter */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Select
                            value={level}
                            onChange={setLevel}
                            placeholder="Tất cả cấp độ"
                            options={[
                                { value: "", label: "Tất cả cấp độ" },
                                { value: "company", label: "Công ty" },
                                { value: "unit", label: "Phòng ban" },
                                { value: "team", label: "Nhóm" },
                            ]}
                        />
                        <Select
                            value={role}
                            onChange={setRole}
                            placeholder="Tất cả vai trò"
                            options={[
                                { value: "", label: "Tất cả vai trò" },
                                { value: "admin", label: "Quản trị viên" },
                                { value: "manager", label: "Quản lý" },
                                { value: "member", label: "Thành viên" },
                            ]}
                        />
                        <Select
                            value={departmentId}
                            onChange={setDepartmentId}
                            placeholder="Tất cả phòng ban"
                            options={[
                                { value: "", label: "Tất cả phòng ban" },
                                ...departments
                                    .filter((d) => d.type === "phòng ban")
                                    .map((d) => ({
                                        value: String(d.department_id),
                                        label: d.d_name,
                                    })),
                            ]}
                        />
                        <Select
                            value={teamId}
                            onChange={setTeamId}
                            placeholder="Tất cả đội nhóm"
                            options={[
                                { value: "", label: "Tất cả đội nhóm" },
                                ...departments
                                    .filter((d) => d.type === "đội nhóm")
                                    .map((d) => ({
                                        value: String(d.department_id),
                                        label: d.d_name,
                                    })),
                            ]}
                        />
                        <Select
                            value={status}
                            onChange={setStatus}
                            placeholder="Tất cả trạng thái"
                            options={[
                                { value: "", label: "Tất cả trạng thái" },
                                { value: "active", label: "Kích hoạt" },
                                { value: "inactive", label: "Vô hiệu" },
                            ]}
                        />
                        {hasActiveFilters && (
                            <button
                                onClick={resetAllFilters}
                                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full">
                        <UserTableHeader />
                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-3 py-8 text-center text-slate-500"
                                    >
                                        Đang tải...
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-3 py-8 text-center text-slate-500"
                                    >
                                        Không có người dùng
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filtered.map((u) => {
                                    const rname = (
                                        u.role?.role_name || ""
                                    ).toLowerCase();
                                    const isAdmin =
                                        rname === "admin" ||
                                        u.email === "okr.admin@company.com";
                                    const onChangeRole = (val) => {
                                        // Chỉ cập nhật giao diện, không gọi API
                                        const selectedRole = roles.find(
                                            (r) => r.role_id == val
                                        );
                                        setPendingChanges((prev) => ({
                                            ...prev,
                                            [u.user_id]: {
                                                ...prev[u.user_id],
                                                role_id: val,
                                                role_name:
                                                    selectedRole?.role_name,
                                                level: selectedRole?.level, // Cập nhật level theo role được chọn
                                            },
                                        }));
                                        setUsers((prev) =>
                                            prev.map((x) =>
                                                x.user_id === u.user_id
                                                    ? {
                                                          ...x,
                                                          role: {
                                                              ...(x.role || {}),
                                                              role_id: val,
                                                              role_name:
                                                                  selectedRole?.role_name,
                                                              level: selectedRole?.level, // Cập nhật level theo role được chọn
                                                          },
                                                      }
                                                    : x
                                            )
                                        );
                                    };
                                    const onChangeDept = (val) => {
                                        // Chỉ cập nhật giao diện, không gọi API
                                        const depObj = departments.find(
                                            (d) =>
                                                String(d.department_id) ===
                                                String(val)
                                        );
                                        setPendingChanges((prev) => ({
                                            ...prev,
                                            [u.user_id]: {
                                                ...prev[u.user_id],
                                                department_id: val,
                                                department: depObj,
                                            },
                                        }));
                                        setUsers((prev) =>
                                            prev.map((x) =>
                                                x.user_id === u.user_id
                                                    ? {
                                                          ...x,
                                                          department_id: val,
                                                          department:
                                                              depObj ||
                                                              x.department,
                                                      }
                                                    : x
                                            )
                                        );
                                    };
                                    const onChangeLevel = (val) => {
                                        // Chỉ cập nhật giao diện, không gọi API
                                        // Tìm role phù hợp với level mới và role_name hiện tại
                                        const currentRoleName =
                                            u.role?.role_name;
                                        const matchingRole = roles.find(
                                            (r) =>
                                                r.level === val &&
                                                r.role_name === currentRoleName
                                        );

                                        if (matchingRole) {
                                            setPendingChanges((prev) => ({
                                                ...prev,
                                                [u.user_id]: {
                                                    ...prev[u.user_id],
                                                    level: val,
                                                    role_id:
                                                        matchingRole.role_id,
                                                    role_name:
                                                        matchingRole.role_name,
                                                },
                                            }));

                                            setUsers((prev) =>
                                                prev.map((x) =>
                                                    x.user_id === u.user_id
                                                        ? {
                                                              ...x,
                                                              role: {
                                                                  ...(x.role ||
                                                                      {}),
                                                                  level: val,
                                                                  role_id:
                                                                      matchingRole.role_id,
                                                                  role_name:
                                                                      matchingRole.role_name,
                                                              },
                                                          }
                                                        : x
                                                )
                                            );
                                        }
                                    };
                                    const toggleStatus = () => {
                                        // Chỉ cập nhật giao diện, không gọi API
                                        const newStatus =
                                            u.status === "active"
                                                ? "inactive"
                                                : "active";
                                        setPendingChanges((prev) => ({
                                            ...prev,
                                            [u.user_id]: {
                                                ...prev[u.user_id],
                                                status: newStatus,
                                            },
                                        }));
                                        setUsers((prev) =>
                                            prev.map((x) =>
                                                x.user_id === u.user_id
                                                    ? {
                                                          ...x,
                                                          status: newStatus,
                                                      }
                                                    : x
                                            )
                                        );
                                    };
                                    return (
                                        <UserTableRow
                                            key={u.user_id}
                                            user={u}
                                            departments={departments}
                                            roles={roles}
                                            editingRole={editingRole}
                                            editingDept={editingDept}
                                            editingLevel={editingLevel}
                                            setEditingRole={setEditingRole}
                                            setEditingDept={setEditingDept}
                                            setEditingLevel={setEditingLevel}
                                            onChangeRole={onChangeRole}
                                            onChangeDept={onChangeDept}
                                            onChangeLevel={onChangeLevel}
                                            loadRolesByLevel={loadRolesByLevel}
                                            toggleStatus={toggleStatus}
                                            pendingChanges={pendingChanges}
                                            setPendingChanges={
                                                setPendingChanges
                                            }
                                            setUsers={setUsers}
                                        />
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showInviteModal && (
                <InviteUserModal
                    open={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    onSaved={(newUser) => {
                        setUsers((prev) => [...prev, newUser]);
                        showToast("success", "Mời người dùng thành công!");
                    }}
                />
            )}

            {/* Modal xác nhận lưu thay đổi */}
            {showConfirmModal && (
                <Modal
                    open={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title="Xác nhận lưu thay đổi"
                >
                    <div className="space-y-4">
                        <p className="text-slate-700">
                            Bạn có chắc chắn muốn lưu {Object.keys(pendingChanges).length} thay đổi?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

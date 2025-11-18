import { useMemo } from "react";

/**
 * Custom hook để lấy thông tin authentication và permissions
 * @returns {Object} Object chứa thông tin user và permissions
 */
export function useAuth() {
    return useMemo(() => {
        const user = window.__USER__ || null;
        console.log("User data:", window.__USER__);

        const roleName = user?.role?.role_name?.toLowerCase() || "";
        const roleLevel = user?.role?.level?.toLowerCase() || "";

        return {
            user,
            isAuthenticated: !!user,
            isAdmin: user?.is_admin === true,
            isCeo: user?.is_ceo === true,
            isDeptManager: roleName === "manager" && roleLevel === "unit",
            isMember: roleName === "member",
            // Helper methods
            canManageCycles: user?.is_admin === true,
            canManageUsers:
                user?.is_admin === true ||
                (roleName === "manager" && roleLevel === "unit"),
            canManageRooms: user?.is_admin === true, // Chỉ admin quản lý phòng ban
            canCreateCompanyOKR:
                user?.is_admin === true ||
                user?.is_ceo === true ||
                roleName === "manager",
            canCreatePersonalOKR: true, // Mọi user đều có thể tạo OKR cá nhân
        };
    }, []);
}

export default useAuth;

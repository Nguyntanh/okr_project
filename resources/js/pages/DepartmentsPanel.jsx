import React, { useEffect, useState } from "react";
import { Toast } from "../components/ui";

export default function DepartmentsPanel() {
    const [departments, setDepartments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ type: "success", message: "" });
    const showToast = (type, message) => setToast({ type, message });

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await fetch("/departments", {
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (!res.ok || data.success === false)
                throw new Error(data.message || "Tải dữ liệu thất bại");

            const deps = data.data || [];
            setDepartments(deps.filter(d => d.type === "phòng ban"));
            setTeams(deps.filter(d => d.type === "đội nhóm"));
        } catch (e) {
            showToast("error", e.message || "Tải dữ liệu thất bại");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const toggleExpand = (departmentId) => {
        setExpanded((prev) => ({
            ...prev,
            [departmentId]: !prev[departmentId],
        }));
    };

    return (
        <div className="px-4 py-6">
            <Toast
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ type: "success", message: "" })}
            />
            <div className="mx-auto mb-3 flex w-full max-w-5xl items-center justify-between">
                <h2 className="text-2xl font-extrabold text-slate-900">
                    Phòng ban & Đội nhóm
                </h2>
            </div>
            <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full table-fixed divide-y divide-slate-200 text-xs md:text-sm">
                    <thead className="bg-slate-50 text-left font-semibold text-slate-700">
                        <tr>
                            <th className="px-3 py-2 w-12"></th>
                            <th className="px-3 py-2 w-[30%] border-r border-slate-200">
                                Tên
                            </th>
                            <th className="px-3 py-2 w-[20%] border-r border-slate-200 text-center">
                                Loại
                            </th>
                            <th className="px-3 py-2 w-[50%] text-center">
                                Mô tả
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-3 py-5 text-center text-slate-500"
                                >
                                    Đang tải...
                                </td>
                            </tr>
                        )}
                        {!loading && departments.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-3 py-5 text-center text-slate-500"
                                >
                                    Không có dữ liệu
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            departments.map((d, index) => (
                                <React.Fragment key={d.department_id}>
                                    <tr
                                        className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 ${
                                            index > 0 ? "mt-4" : ""
                                        }`}
                                    >
                                        <td className="px-3 py-3">
                                            {teams.some(
                                                (t) =>
                                                    t.parent_department_id ===
                                                    d.department_id
                                            ) && (
                                                <button
                                                    onClick={() =>
                                                        toggleExpand(
                                                            d.department_id
                                                        )
                                                    }
                                                    className="rounded-md border border-slate-300 bg-white p-1 text-slate-700 hover:bg-slate-50 shadow-sm"
                                                >
                                                    <svg
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline
                                                            points={
                                                                expanded[
                                                                    d
                                                                        .department_id
                                                                ]
                                                                    ? "18 15 12 9 6 15"
                                                                    : "6 9 12 15 18 9"
                                                            }
                                                        ></polyline>
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 border-r border-slate-200">
                                            <span className="font-semibold text-green-700">
                                                {d.d_name}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 border-r border-slate-200 text-center">
                                            {d.type}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {d.d_description || "-"}
                                        </td>
                                    </tr>
                                    {expanded[d.department_id] &&
                                        teams
                                            .filter(
                                                (t) =>
                                                    t.parent_department_id ===
                                                    d.department_id
                                            )
                                            .map((t) => (
                                                <tr
                                                    key={t.department_id}
                                                    className="hover:bg-slate-100"
                                                >
                                                    <td className="px-8 py-3"></td>
                                                    <td className="px-3 py-3 border-r border-slate-200">
                                                        <span className="text-indigo-600">
                                                            {t.d_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 border-r border-slate-200 text-center">
                                                        {t.type}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {t.d_description || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                </React.Fragment>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useCallback } from "react";
import { canCheckInKeyResult } from "../utils/checkinPermissions";
import Dropdown from "../components/Dropdown";
import Tabs from "../components/Tabs";
import ConfirmationModal from "../components/ConfirmationModal";
import ToastNotification from "../components/ToastNotification";

export default function ObjectiveList({
    items,
    departments,
    cyclesList,
    loading,
    openObj,
    setOpenObj,
    setCreatingFor,
    setEditingObjective,
    setEditingKR,
    setCreatingObjective,
    links,
    cycleFilter,
    setCycleFilter,
    openCheckInModal,
    openCheckInHistory,
    currentUser,
    hideFilters = false,
    setItems,
}) {
    const [toast, setToast] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedItems, setArchivedItems] = useState([]);
    const [archivedCount, setArchivedCount] = useState(0);
    const [loadingArchived, setLoadingArchived] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [archivingKR, setArchivingKR] = useState(null);
    const [unarchivingKR, setUnarchivingKR] = useState(null);
    const [deletingKR, setDeletingKR] = useState(null);

    const canCheckInKR = (kr, objective) => {
        return canCheckInKeyResult(currentUser, kr, objective);
    };

    const handleOpenCheckIn = (kr, objective) => {
        if (!openCheckInModal) return;
        openCheckInModal({ ...kr, objective_id: objective.objective_id });
    };

    const handleOpenCheckInHistory = (kr, objective) => {
        if (!openCheckInHistory) return;
        openCheckInHistory({ ...kr, objective_id: objective.objective_id });
    };

    const [archiving, setArchiving] = useState(null);
    const [unarchiving, setUnarchiving] = useState(null);
    const [deleting, setDeleting] = useState(null);

    // === MODAL XÁC NHẬN CHUNG ===
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        onConfirm: () => {},
        confirmText: "OK",
        cancelText: "Hủy",
    });

    const openConfirm = (
        title,
        message,
        onConfirm,
        confirmText = "OK",
        cancelText = "Hủy"
    ) => {
        setConfirmModal({
            show: true,
            title,
            message,
            onConfirm,
            confirmText,
            cancelText,
        });
    };

    const closeConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // === TẢI OKR LƯU TRỮ ===
    useEffect(() => {
        if (showArchived) {
            const fetchArchived = async () => {
                setLoadingArchived(true);
                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const params = new URLSearchParams({
                        archived: "1",
                        include_archived_kr: "1",
                    });
                    if (cycleFilter) params.append("cycle_id", cycleFilter);

                    const res = await fetch(`/my-objectives?${params}`, {
                        headers: {
                            Accept: "application/json",
                            "X-CSRF-TOKEN": token,
                        },
                    });
                    const json = await res.json();
                    if (json.success) {
                        setArchivedItems(json.data.data || []);
                    }
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setLoadingArchived(false);
                }
            };
            fetchArchived();
        } else {
            setArchivedItems([]);
            setArchivedCount(0);
        }
    }, [showArchived, cycleFilter]);

    // === HELPER: Tìm quý hiện tại ===
    const getCurrentCycle = (cyclesList) => {
        const now = new Date();
        const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
        const currentYear = now.getFullYear();

        return cyclesList.find((cycle) => {
            const match = cycle.cycle_name.match(/Quý (\d+) năm (\d+)/);
            if (!match) return false;
            const quarter = parseInt(match[1]);
            const year = parseInt(match[2]);
            return quarter === currentQuarter && year === currentYear;
        });
    };

    // === 1. FRESH TRẠNG THÁI: XÓA cycle_id KHI VÀO TRANG ===
    useEffect(() => {
        const url = new URL(window.location);
        if (url.searchParams.has("cycle_id")) {
            url.searchParams.delete("cycle_id");
            window.history.replaceState({}, "", url);
        }
        setCycleFilter(null); // Reset filter
    }, []);

    // === 2. TỰ ĐỘNG CHỌN QUÝ HIỆN TẠI SAU KHI FRESH ===
    useEffect(() => {
        if (cycleFilter) return;

        const currentCycle = getCurrentCycle(cyclesList);
        if (currentCycle) {
            setCycleFilter(currentCycle.cycle_id);
            return;
        }

        if (items.length > 0 && items[0]?.cycle_id) {
            setCycleFilter(items[0].cycle_id);
        }
    }, [cycleFilter, cyclesList, items]);

    // === 3. CHỌN QUÝ: KHÔNG CẬP NHẬT URL ===
    const handleCycleChange = (newCycleId) => {
        setCycleFilter(newCycleId);
    };

    // === RELOAD CẢ 2 TAB TỪ SERVER ===
    const reloadBothTabs = useCallback(
        async (token) => {
            const baseParams = new URLSearchParams();
            if (cycleFilter) baseParams.append("cycle_id", cycleFilter);

            // Tab Hoạt động
            const activeRes = await fetch(`/my-objectives?${baseParams}`, {
                headers: { Accept: "application/json", "X-CSRF-TOKEN": token },
            });
            const activeJson = await activeRes.json();
            if (activeJson.success) {
                setItems(activeJson.data.data || []);
            }

            // Tab Lưu trữ
            if (showArchived) {
                const archivedParams = new URLSearchParams({
                    archived: "1",
                    include_archived_kr: "1",
                });
                if (cycleFilter) archivedParams.append("cycle_id", cycleFilter);
                const archivedRes = await fetch(
                    `/my-objectives?${archivedParams}`,
                    {
                        headers: {
                            Accept: "application/json",
                            "X-CSRF-TOKEN": token,
                        },
                    }
                );
                const archivedJson = await archivedRes.json();
                if (archivedJson.success) {
                    setArchivedItems(archivedJson.data.data || []);
                }
            }
        },
        [cycleFilter, showArchived, setItems]
    );

    // === LƯU TRỮ OKR ===
    const handleArchive = async (id) => {
        openConfirm(
            "Lưu trữ OKR",
            "Bạn sẽ không thể chỉnh sửa OKR này nữa.",
            async () => {
                setArchiving(id);
                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const res = await fetch(`/my-objectives/${id}/archive`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": token,
                            Accept: "application/json",
                        },
                    });
                    const json = await res.json();
                    if (json.success) {
                        await reloadBothTabs(token);
                        setToast({ type: "success", message: json.message });
                    } else {
                        throw new Error(json.message);
                    }
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setArchiving(null);
                }
            },
            "Lưu trữ",
            "Hủy"
        );
    };

    // === BỎ LƯU TRỮ OKR ===
    const handleUnarchive = async (id) => {
        openConfirm(
            "Bỏ lưu trữ OKR",
            "OKR sẽ được khôi phục vào danh sách hoạt động.",
            async () => {
                setUnarchiving(id);
                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const res = await fetch(`/my-objectives/${id}/unarchive`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": token,
                            Accept: "application/json",
                        },
                    });
                    const json = await res.json();
                    if (json.success) {
                        await reloadBothTabs(token);
                        setToast({ type: "success", message: json.message });
                    } else {
                        throw new Error(json.message);
                    }
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setUnarchiving(null);
                }
            }
        );
    };

    // === XÓA VĨNH VIỄN OKR ===
    const handleDelete = async (id) => {
        openConfirm(
            "XÓA VĨNH VIỄN",
            "OKR sẽ bị xóa hoàn toàn, không thể khôi phục!",
            async () => {
                setDeleting(id);
                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const res = await fetch(`/my-objectives/${id}`, {
                        method: "DELETE",
                        headers: {
                            "X-CSRF-TOKEN": token,
                            Accept: "application/json",
                        },
                    });
                    const json = await res.json();
                    if (json.success) {
                        await reloadBothTabs(token);
                        setToast({ type: "success", message: json.message });
                    } else {
                        throw new Error(json.message);
                    }
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setDeleting(null);
                }
            },
            "Xóa vĩnh viễn",
            "Hủy"
        );
    };

    // === LƯU TRỮ KR ===
    const handleArchiveKR = async (krId) => {
        openConfirm(
            "Lưu trữ Key Result",
            "Key Result sẽ được chuyển vào tab Lưu trữ.",
            async () => {
                setArchivingKR(krId);
                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const obj = items.find((o) =>
                        o.key_results?.some((kr) => kr.kr_id === krId)
                    );
                    if (!obj) throw new Error("Không tìm thấy OKR cha.");

                    const res = await fetch(
                        `/my-key-results/${obj.objective_id}/${krId}/archive`,
                        {
                            method: "POST",
                            headers: {
                                "X-CSRF-TOKEN": token,
                                Accept: "application/json",
                            },
                        }
                    );
                    const json = await res.json();
                    if (!json.success)
                        throw new Error(json.message || "Lưu trữ thất bại");

                    await reloadBothTabs(token);
                    setToast({ type: "success", message: json.message });
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setArchivingKR(null);
                }
            }
        );
    };

    // === BỎ LƯU TRỮ KR ===
    const handleUnarchiveKR = async (krId) => {
        openConfirm(
            "Bỏ lưu trữ Key Result",
            "Key Result sẽ quay lại danh sách hoạt động.",
            async () => {
                setUnarchivingKR(krId);
                const obj = archivedItems.find((o) =>
                    o.key_results?.some((kr) => kr.kr_id === krId)
                );
                if (!obj) {
                    setToast({
                        type: "error",
                        message: "Không tìm thấy OKR cha.",
                    });
                    setUnarchivingKR(null);
                    return;
                }

                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const res = await fetch(
                        `/my-key-results/${obj.objective_id}/${krId}/unarchive`,
                        {
                            method: "POST",
                            headers: {
                                "X-CSRF-TOKEN": token,
                                Accept: "application/json",
                            },
                        }
                    );
                    const json = await res.json();
                    if (!json.success)
                        throw new Error(json.message || "Bỏ lưu trữ thất bại");

                    await reloadBothTabs(token);
                    setToast({ type: "success", message: json.message });
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setUnarchivingKR(null);
                }
            }
        );
    };

    // === XÓA VĨNH VIỄN KR ===
    const handleDeleteKR = async (krId) => {
        openConfirm(
            "XÓA VĨNH VIỄN",
            "Key Result sẽ bị xóa hoàn toàn, không thể khôi phục!",
            async () => {
                setDeletingKR(krId);
                const obj = archivedItems.find((o) =>
                    o.key_results?.some((kr) => kr.kr_id === krId)
                );
                if (!obj) {
                    setToast({
                        type: "error",
                        message: "Không tìm thấy OKR cha.",
                    });
                    setDeletingKR(null);
                    return;
                }

                try {
                    const token = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    const res = await fetch(
                        `/my-key-results/destroy/${obj.objective_id}/${krId}`,
                        {
                            method: "DELETE",
                            headers: {
                                "X-CSRF-TOKEN": token,
                                Accept: "application/json",
                            },
                        }
                    );
                    const json = await res.json();

                    if (json.success) {
                        await reloadBothTabs(token);
                        setToast({ type: "success", message: json.message });
                    } else {
                        throw new Error(json.message);
                    }
                } catch (err) {
                    setToast({ type: "error", message: err.message });
                } finally {
                    setDeletingKR(null);
                }
            },
            "Xóa vĩnh viễn",
            "Hủy"
        );
    };

    // === HELPER FORMAT ===
    const formatPercent = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? `${n.toFixed(2)}%` : "";
    };

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case "draft":
                return "Bản nháp";
            case "active":
                return "Đang thực hiện";
            case "completed":
                return "Hoàn thành";
            default:
                return status || "";
        }
    };

    const getUnitText = (unit) => {
        switch (unit?.toLowerCase()) {
            case "number":
                return "Số lượng";
            case "percent":
                return "Phần trăm";
            case "completion":
                return "Hoàn thành";
            default:
                return unit || "";
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-4 flex w-full items-center justify-between">
                <div className="flex items-center gap-4">
                    <Dropdown
                        cyclesList={cyclesList}
                        cycleFilter={cycleFilter}
                        handleCycleChange={setCycleFilter}
                        dropdownOpen={dropdownOpen}
                        setDropdownOpen={setDropdownOpen}
                    />
                </div>

                <Tabs
                    showArchived={showArchived}
                    setShowArchived={setShowArchived}
                    setCreatingObjective={setCreatingObjective}
                />
            </div>

            {/* BẢNG OKR */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left font-semibold text-slate-700">
                        <tr>
                            <th className="px-3 py-2 text-left w-[30%] border-r border-slate-200">
                                Tiêu đề
                            </th>
                            <th className="px-3 py-2 text-center border-r border-slate-200 w-[12%]">
                                Phòng ban
                            </th>
                            <th className="px-3 py-2 text-center border-r border-slate-200 w-[12%]">
                                Trạng thái
                            </th>
                            <th className="px-3 py-2 text-center border-r border-slate-200 w-[10%]">
                                Đơn vị
                            </th>
                            <th className="px-3 py-2 text-center border-r border-slate-200 w-[10%]">
                                Thực tế
                            </th>
                            <th className="px-3 py-2 text-center border-r border-slate-200 w-[10%]">
                                Mục tiêu
                            </th>
                            <th className="px-3 py-2 text-center border-r border-slate-200 w-[10%]">
                                Tiến độ (%)
                            </th>
                            <th className="px-3 py-2 text-center w-[12%]">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Loading */}
                        {!showArchived && loading && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-3 py-5 text-center text-slate-500"
                                >
                                    Đang tải...
                                </td>
                            </tr>
                        )}

                        {/* Danh sách chính rỗng */}
                        {!showArchived && !loading && items.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-3 py-5 text-center text-slate-500"
                                >
                                    Bạn chưa tạo OKR nào.
                                </td>
                            </tr>
                        )}

                        {/* OKR Đang hoạt động */}
                        {!showArchived &&
                            !loading &&
                            items.map((obj, index) => (
                                <React.Fragment key={obj.objective_id}>
                                    <tr
                                        className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 ${
                                            index > 0 ? "mt-4" : ""
                                        }`}
                                    >
                                        <td
                                            colSpan={7}
                                            className="px-3 py-3 border-r border-slate-200"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-1">
                                                    {obj.key_results &&
                                                        obj.key_results.length >
                                                            0 && (
                                                            <button
                                                                onClick={() =>
                                                                    setOpenObj(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [obj.objective_id]:
                                                                                !prev[
                                                                                    obj
                                                                                        .objective_id
                                                                                ],
                                                                        })
                                                                    )
                                                                }
                                                                className="p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 group"
                                                                title="Đóng/mở Key Results"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                    className={`w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-transform duration-200 ${
                                                                        openObj[
                                                                            obj
                                                                                .objective_id
                                                                        ]
                                                                            ? "rotate-90"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}

                                                    <span className="font-semibold text-slate-900 truncate">
                                                        {obj.obj_title}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        setEditingObjective({
                                                            ...obj,
                                                            level:
                                                                obj.level ||
                                                                "team",
                                                        })
                                                    }
                                                    className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                                    title="Sửa Objective"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setCreatingFor(obj)
                                                    }
                                                    className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                                    title="Thêm KR"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            fill="none"
                                                        />
                                                        <path
                                                            d="M12 7V17M7 12H17"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleArchive(
                                                            obj.objective_id
                                                        )
                                                    }
                                                    disabled={
                                                        archiving ===
                                                        obj.objective_id
                                                    }
                                                    className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40"
                                                    title="Lưu trữ OKR"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Key Results */}
                                    {openObj[obj.objective_id] &&
                                        obj.key_results?.map((kr) => (
                                            <tr key={kr.kr_id}>
                                                <td className="px-8 py-3 border-r border-slate-200">
                                                    <span className="font-medium text-slate-900">
                                                        {kr.kr_title}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200">
                                                    {departments.find(
                                                        (d) =>
                                                            String(
                                                                d.department_id
                                                            ) ===
                                                            String(
                                                                obj.department_id
                                                            )
                                                    )?.d_name || "-"}
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${
                                                            (
                                                                kr.status || ""
                                                            ).toUpperCase() ===
                                                            "COMPLETED"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : (
                                                                      kr.status ||
                                                                      ""
                                                                  ).toUpperCase() ===
                                                                  "ACTIVE"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}
                                                    >
                                                        {getStatusText(
                                                            kr.status
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200">
                                                    {getUnitText(kr.unit)}
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200">
                                                    {kr.current_value ?? ""}
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200">
                                                    {kr.target_value ?? ""}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {formatPercent(
                                                        kr.progress_percent
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {openCheckInModal &&
                                                            canCheckInKR(
                                                                kr,
                                                                obj
                                                            ) && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleOpenCheckIn(
                                                                            kr,
                                                                            obj
                                                                        )
                                                                    }
                                                                    className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                                                    title="Check-in Key Result"
                                                                >
                                                                    <svg
                                                                        className="h-4 w-4"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        {openCheckInHistory && (
                                                            <button
                                                                onClick={() =>
                                                                    handleOpenCheckInHistory(
                                                                        kr,
                                                                        obj
                                                                    )
                                                                }
                                                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                                                title="Lịch sử Check-in"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                setEditingKR(kr)
                                                            }
                                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                                            title="Sửa KR"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleArchiveKR(
                                                                    kr.kr_id
                                                                )
                                                            }
                                                            disabled={
                                                                archivingKR ===
                                                                kr.kr_id
                                                            }
                                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40"
                                                            title="Lưu trữ Key Result"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </React.Fragment>
                            ))}

                        {/* OKR Đã lưu trữ */}
                        {showArchived &&
                            !loading &&
                            archivedItems.map((obj, index) => (
                                <React.Fragment key={obj.objective_id}>
                                    <tr
                                        className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 ${
                                            index > 0 ? "mt-4" : ""
                                        }`}
                                    >
                                        <td
                                            colSpan={7}
                                            className="px-3 py-3 border-r border-slate-200"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-1">
                                                    {obj.key_results &&
                                                        obj.key_results.length >
                                                            0 && (
                                                            <button
                                                                onClick={() =>
                                                                    setOpenObj(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [obj.objective_id]:
                                                                                !prev[
                                                                                    obj
                                                                                        .objective_id
                                                                                ],
                                                                        })
                                                                    )
                                                                }
                                                                className="p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 group"
                                                                title="Đóng/mở Key Results"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                    className={`w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-transform duration-200 ${
                                                                        openObj[
                                                                            obj
                                                                                .objective_id
                                                                        ]
                                                                            ? "rotate-90"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        )}

                                                    <span className="font-semibold text-slate-900 truncate">
                                                        {obj.obj_title}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        handleUnarchive(
                                                            obj.objective_id
                                                        )
                                                    }
                                                    disabled={
                                                        unarchiving ===
                                                        obj.objective_id
                                                    }
                                                    className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40"
                                                    title="Bỏ lưu trữ OKR"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Key Results */}
                                    {openObj[obj.objective_id] &&
                                        obj.key_results?.map((kr) => (
                                            <tr key={kr.kr_id}>
                                                <td className="px-8 py-3">
                                                    <span className="font-medium text-slate-900">
                                                        {kr.kr_title}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center"></td>
                                                <td className="px-3 py-3 text-center"></td>
                                                <td className="px-3 py-3 text-center"></td>
                                                <td className="px-3 py-3 text-center"></td>
                                                <td className="px-3 py-3 text-center"></td>
                                                <td className="px-3 py-3 text-center"></td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() =>
                                                                handleUnarchiveKR(
                                                                    kr.kr_id
                                                                )
                                                            }
                                                            disabled={
                                                                unarchivingKR ===
                                                                kr.kr_id
                                                            }
                                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40"
                                                            title="Bỏ lưu trữ Key Result"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </React.Fragment>
                            ))}

                        {/* Không có dữ liệu lưu trữ */}
                        {showArchived &&
                            !loading &&
                            archivedItems.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-3 py-5 text-center text-slate-500"
                                    >
                                        Chưa có OKR nào được lưu trữ.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>

            {/* === MODAL XÁC NHẬN === */}
            <ConfirmationModal
                confirmModal={confirmModal}
                closeConfirm={closeConfirm}
            />

            {/* === TOAST === */}
            <ToastNotification toast={toast} />
        </div>
    );
}

// components/objective-list/ArchivedTabContent.jsx
import React from "react";

export default function ObjectiveArchive({
    archivedItems,
    openObj,
    setOpenObj,
    handleUnarchive,
    handleDelete,
    handleUnarchiveKR,
    handleDeleteKR,
    unarchiving,
    deleting,
    unarchivingKR,
    deletingKR,
    loadingArchived,
}) {
    if (loadingArchived) {
        return (
            <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500">
                    <svg
                        className="inline-block h-8 w-8 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="opacity-25"
                        />
                        <path
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                            className="opacity-75"
                        />
                    </svg>
                    <span className="ml-2">Đang tải dữ liệu lưu trữ...</span>
                </td>
            </tr>
        );
    }

    const fullyArchivedObjectives = archivedItems.filter(
        (obj) => obj.archived_at !== null
    );
    const objectivesWithArchivedKRs = archivedItems.filter(
        (obj) =>
            obj.archived_at === null &&
            obj.key_results?.some((kr) => kr.archived_at)
    );

    if (
        fullyArchivedObjectives.length === 0 &&
        objectivesWithArchivedKRs.length === 0
    ) {
        return (
            <tr>
                <td colSpan={8} className="text-center py-16 text-slate-500">
                    <div className="text-5xl mb-4 opacity-30">Box Archive</div>
                    <p>Chưa có OKR nào được lưu trữ</p>
                </td>
            </tr>
        );
    }

    return (
        <>
            {/* Case 1: Objective bị lưu trữ hoàn toàn */}
            {fullyArchivedObjectives.map((obj, index) => (
                <React.Fragment key={`archived-obj-${obj.objective_id}`}>
                    <tr
                        className={`bg-gradient-to-r from-slate-100 to-slate-50 border-t-4 border-slate-300 ${
                            index > 0 ? "mt-6" : ""
                        }`}
                    >
                        <td
                            colSpan={7}
                            className="px-4 py-4 font-bold text-slate-800"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            setOpenObj((prev) => ({
                                                ...prev,
                                                [obj.objective_id]:
                                                    !prev[obj.objective_id],
                                            }))
                                        }
                                        className="p-1 rounded hover:bg-slate-200 transition"
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform ${
                                                openObj[obj.objective_id]
                                                    ? "rotate-90"
                                                    : ""
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            />
                                        </svg>
                                    </button>
                                    <span className="truncate max-w-2xl">
                                        {obj.obj_title}
                                    </span>
                                    <span className="text-xs bg-slate-300 text-slate-700 px-2 py-1 rounded">
                                        Đã lưu trữ
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleUnarchive(obj.objective_id)
                                        }
                                        disabled={
                                            unarchiving === obj.objective_id
                                        }
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                        title="Bỏ lưu trữ"
                                    >
                                        {unarchiving === obj.objective_id
                                            ? "Loading..."
                                            : "Restore"}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDelete(obj.objective_id)
                                        }
                                        disabled={deleting === obj.objective_id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa vĩnh viễn"
                                    >
                                        {deleting === obj.objective_id
                                            ? "Loading..."
                                            : "Trash"}
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>

                    {openObj[obj.objective_id] &&
                        obj.key_results?.map((kr) => (
                            <tr key={kr.kr_id} className="bg-slate-50">
                                <td className="pl-12 pr-4 py-3 italic text-slate-600">
                                    {kr.kr_title}
                                </td>
                                <td colSpan={6}></td>
                            </tr>
                        ))}
                </React.Fragment>
            ))}

            {/* Case 2: Chỉ có KR bị lưu trữ (Objective vẫn hoạt động) */}
            {objectivesWithArchivedKRs.map((obj, index) => {
                const archivedKRs = obj.key_results.filter(
                    (kr) => kr.archived_at
                );
                return (
                    <React.Fragment
                        key={`partial-archived-${obj.objective_id}`}
                    >
                        <tr
                            className={`bg-gradient-to-r from-yellow-50 to-orange-50 border-t-2 border-yellow-400 ${
                                index > 0 ? "mt-6" : ""
                            }`}
                        >
                            <td colSpan={7} className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setOpenObj((prev) => ({
                                                ...prev,
                                                [obj.objective_id]:
                                                    !prev[obj.objective_id],
                                            }))
                                        }
                                        className="p-1 rounded hover:bg-orange-100"
                                    >
                                        <svg
                                            className={`w-4 h-4 text-orange-600 transition-transform ${
                                                openObj[obj.objective_id]
                                                    ? "rotate-90"
                                                    : ""
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            />
                                        </svg>
                                    </button>
                                    <span className="font-semibold text-slate-900">
                                        {obj.obj_title}
                                    </span>
                                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                                        {archivedKRs.length} Key Result đã lưu
                                        trữ
                                    </span>
                                </div>
                            </td>
                        </tr>

                        {openObj[obj.objective_id] &&
                            archivedKRs.map((kr) => (
                                <tr key={kr.kr_id} className="bg-yellow-50">
                                    <td className="pl-12 pr-4 py-3 italic text-orange-700">
                                        {kr.kr_title}
                                    </td>
                                    <td colSpan={5}></td>
                                    <td className="text-center py-3">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleUnarchiveKR(kr.kr_id)
                                                }
                                                disabled={
                                                    unarchivingKR === kr.kr_id
                                                }
                                                className="p-2 text-green-600 hover:bg-green-100 rounded transition"
                                                title="Bỏ lưu trữ KR"
                                            >
                                                {unarchivingKR === kr.kr_id
                                                    ? "Loading..."
                                                    : "Restore"}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteKR(kr.kr_id)
                                                }
                                                disabled={
                                                    deletingKR === kr.kr_id
                                                }
                                                className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                                                title="Xóa vĩnh viễn KR"
                                            >
                                                {deletingKR === kr.kr_id
                                                    ? "Loading..."
                                                    : "Trash"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </React.Fragment>
                );
            })}
        </>
    );
}

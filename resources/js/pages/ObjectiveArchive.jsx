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
    showArchived, // chỉ để điều kiện render, nhưng thực tế đã được kiểm soát ở parent
}) {
    return (
        <>
            {/* 1. Đang tải */}
            {showArchived && loadingArchived && (
                <tr>
                    <td
                        colSpan={7}
                        className="px-3 py-5 text-center text-slate-500"
                    >
                        Đang tải...
                    </td>
                </tr>
            )}

            {/* 2. Không có dữ liệu */}
            {showArchived && !loadingArchived && archivedItems.length === 0 && (
                <tr>
                    <td
                        colSpan={7}
                        className="px-3 py-5 text-center text-slate-500"
                    >
                        Không có OKR nào Lưu trữ.
                    </td>
                </tr>
            )}

            {/* 3. Có dữ liệu */}
            {showArchived && !loadingArchived && (
                <>
                    {/* Case 1: Objective bị lưu trữ toàn bộ (archived_at !== null) */}
                    {archivedItems
                        .filter((obj) => obj.archived_at !== null)
                        .map((obj, index) => (
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
                                        <div className="flex items-center">
                                            <div className="flex items-center gap-1">
                                                {obj.key_results?.some(
                                                    (kr) => kr.archived_at
                                                ) && (
                                                    <button
                                                        onClick={() =>
                                                            setOpenObj(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [obj.objective_id]:
                                                                        !prev[
                                                                            obj
                                                                                .objective_id
                                                                        ],
                                                                })
                                                            )
                                                        }
                                                        className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 group"
                                                        title="Đóng/mở Key Results đã lưu trữ"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-all duration-300 ${
                                                                openObj[
                                                                    obj
                                                                        .objective_id
                                                                ] ?? false
                                                                    ? "rotate-90"
                                                                    : "rotate-0"
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
                                                title="Bỏ lưu trữ"
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
                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                    />
                                                </svg>
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        obj.objective_id
                                                    )
                                                }
                                                disabled={
                                                    deleting ===
                                                    obj.objective_id
                                                }
                                                className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40"
                                                title="Xóa vĩnh viễn"
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
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Key Results bị lưu trữ của Objective đã lưu trữ */}
                                {(openObj[obj.objective_id] ?? false) &&
                                    obj.key_results
                                        ?.filter((kr) => kr.archived_at)
                                        ?.map((kr) => (
                                            <tr
                                                key={kr.kr_id}
                                                className="bg-gray-50"
                                            >
                                                <td className="px-8 py-2 italic text-gray-600">
                                                    {kr.kr_title}
                                                </td>
                                                <td colSpan={6}></td>
                                                <td className="text-center py-2">
                                                    <div className="flex items-center justify-center gap-2">
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
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors relative"
                                                            title="Bỏ lưu trữ Key Result"
                                                        >
                                                            {unarchivingKR ===
                                                            kr.kr_id ? (
                                                                <svg
                                                                    className="h-4 w-4 animate-spin"
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
                                                            ) : (
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
                                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDeleteKR(
                                                                    kr.kr_id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingKR ===
                                                                kr.kr_id
                                                            }
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors relative"
                                                            title="Xóa vĩnh viễn Key Result"
                                                        >
                                                            {deletingKR ===
                                                            kr.kr_id ? (
                                                                <svg
                                                                    className="h-4 w-4 animate-spin"
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
                                                            ) : (
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
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                            </React.Fragment>
                        ))}

                    {/* Case 2: Chỉ có KR bị lưu trữ (Objective vẫn hoạt động) */}
                    {archivedItems
                        .filter(
                            (obj) =>
                                obj.archived_at === null &&
                                obj.key_results?.some((kr) => kr.archived_at)
                        )
                        .map((obj, index) => {
                            const archivedKRs = obj.key_results.filter(
                                (kr) => kr.archived_at
                            );
                            const hasArchivedKRs = archivedKRs.length > 0;

                            return (
                                <React.Fragment
                                    key={`archived-kr-${obj.objective_id}`}
                                >
                                    <tr
                                        className={`bg-gradient-to-r from-yellow-50 to-orange-50 border-t-2 border-yellow-300 ${
                                            index > 0 ? "mt-4" : ""
                                        }`}
                                    >
                                        <td
                                            colSpan={7}
                                            className="px-3 py-3 border-r border-slate-200"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-1">
                                                    {hasArchivedKRs && (
                                                        <button
                                                            onClick={() =>
                                                                setOpenObj(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [obj.objective_id]:
                                                                            !(
                                                                                prev[
                                                                                    obj
                                                                                        .objective_id
                                                                                ] ??
                                                                                false
                                                                            ),
                                                                    })
                                                                )
                                                            }
                                                            className="flex-shrink-0 p-1 rounded-md hover:bg-orange-100 transition-all duration-200 group"
                                                            title="Đóng/mở Key Results đã lưu trữ"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                                className={`w-3.5 h-3.5 text-orange-500 group-hover:text-orange-700 transition-all duration-300 ${
                                                                    openObj[
                                                                        obj
                                                                            .objective_id
                                                                    ] ?? false
                                                                        ? "rotate-90"
                                                                        : "rotate-0"
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
                                        {/* Dòng comment cũ vẫn giữ nguyên như yêu cầu */}
                                        {/* <td className="text-center text-slate-400 py-3 bg-gradient-to-r from-yellow-50 to-orange-50">
                                            Objective đang hoạt động – {archivedKRs.length} Key Result đã lưu trữ
                                        </td> */}
                                    </tr>

                                    {openObj[obj.objective_id] &&
                                        archivedKRs.map((kr) => (
                                            <tr
                                                key={kr.kr_id}
                                                className="bg-gray-50"
                                            >
                                                <td className="px-8 py-2 italic text-gray-600">
                                                    {kr.kr_title}{" "}
                                                    <span className="text-orange-600 text-xs"></span>
                                                </td>
                                                <td colSpan={6}></td>
                                                <td className="text-center py-2">
                                                    <div className="flex items-center justify-center gap-2">
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
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors relative"
                                                            title="Bỏ lưu trữ Key Result"
                                                        >
                                                            {unarchivingKR ===
                                                            kr.kr_id ? (
                                                                <svg
                                                                    className="h-4 w-4 animate-spin"
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
                                                            ) : (
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
                                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDeleteKR(
                                                                    kr.kr_id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingKR ===
                                                                kr.kr_id
                                                            }
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors relative"
                                                            title="Xóa vĩnh viễn Key Result"
                                                        >
                                                            {deletingKR ===
                                                            kr.kr_id ? (
                                                                <svg
                                                                    className="h-4 w-4 animate-spin"
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
                                                            ) : (
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
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </React.Fragment>
                            );
                        })}
                </>
            )}
        </>
    );
}

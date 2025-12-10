import React from 'react';
import SnapshotDetailView from './SnapshotDetailView';

export default function SnapshotHistoryModal({
    isOpen,
    onClose,
    snapshots,
    snapshotLevelFilter,
    onSnapshotLevelChange,
    snapshotPage,
    snapshotPagination,
    onPageChange,
    onLoadSnapshot,
    selectedSnapshot,
    onBackToList,
    onExportSnapshot,
}) {
    if (!isOpen) return null;

    // Lọc snapshot theo cấp độ
    const filteredSnapshots = (snapshots || []).filter((snap) => {
        if (!snapshotLevelFilter || snapshotLevelFilter === 'all') return true;
        const snapLevel = snap.data_snapshot?.level || 'departments';
        return snapLevel === snapshotLevelFilter;
    });

    return (
        <div 
            className="fixed inset-0 absolute inset-0 bg-black/30 bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl max-w-[80vw] w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-900">Lịch sử chốt kỳ</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg p-2 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {selectedSnapshot ? (
                        <SnapshotDetailView
                            snapshot={selectedSnapshot}
                            onBack={onBackToList}
                            onExport={onExportSnapshot}
                        />
                    ) : (
                        <div>
                            {/* Filter theo level */}
                            <div className="mb-4 flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700">Lọc theo cấp độ:</label>
                                <select
                                    value={snapshotLevelFilter}
                                    onChange={(e) => {
                                        onSnapshotLevelChange?.(e.target.value);
                                        onPageChange?.(1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="company">Công ty</option>
                                    <option value="departments">Phòng ban</option>
                                </select>
                            </div>

                            {filteredSnapshots.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-semibold text-lg">Chưa có báo cáo nào</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        {snapshotLevelFilter === 'all' 
                                            ? 'Nhấn nút "Tạo báo cáo" để tạo bản sao đầu tiên'
                                            : `Chưa có báo cáo nào cho cấp độ ${snapshotLevelFilter === 'company' ? 'Công ty' : 'Phòng ban'}`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredSnapshots.map((snap) => {
                                        const snapLevel = snap.data_snapshot?.level || 'departments';
                                        const levelText = snapLevel === 'company' ? 'Công ty' : 'Phòng ban';
                                        return (
                                            <button
                                                key={snap.id}
                                                onClick={() => onLoadSnapshot?.(snap.id)}
                                                className="w-full p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition">
                                                                {snap.title}
                                                            </h3>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                                {levelText}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
                                                            <span className="flex items-center gap-1">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                {new Date(snap.snapshotted_at).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                {snap.creator?.full_name || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <svg className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {snapshotPagination?.total > 0 && snapshotPagination?.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-center">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const newPage = Math.max(1, snapshotPage - 1);
                                                onPageChange?.(newPage);
                                            }}
                                            disabled={snapshotPage === 1}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                snapshotPage === 1
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                { length: snapshotPagination.last_page },
                                                (_, i) => i + 1
                                            ).map((pageNumber) => {
                                                if (
                                                    pageNumber === 1 ||
                                                    pageNumber === snapshotPagination.last_page ||
                                                    (pageNumber >= snapshotPage - 1 && pageNumber <= snapshotPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => onPageChange?.(pageNumber)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                                snapshotPage === pageNumber
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                } else if (
                                                    pageNumber === snapshotPage - 2 ||
                                                    pageNumber === snapshotPage + 2
                                                ) {
                                                    return (
                                                        <span key={pageNumber} className="px-2 text-gray-400">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => {
                                                const newPage = Math.min(snapshotPagination.last_page, snapshotPage + 1);
                                                onPageChange?.(newPage);
                                            }}
                                            disabled={snapshotPage === snapshotPagination.last_page}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                snapshotPage === snapshotPagination.last_page
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


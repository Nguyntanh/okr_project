import React, { useState } from 'react';
import { CycleDropdown } from '../Dropdown';
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
    modalCycleFilter,
    onModalCycleFilterChange,
    cyclesList,
}) {
    if (!isOpen) return null;

    const [snapshotSortBy, setSnapshotSortBy] = useState(null);
    const [snapshotSortDir, setSnapshotSortDir] = useState('asc');
    const [snapshotLevelDropdownOpen, setSnapshotLevelDropdownOpen] = useState(false);
    const [modalCycleDropdownOpen, setModalCycleDropdownOpen] = useState(false);

    // Lọc snapshot theo cấp độ và chu kỳ
    const filteredSnapshots = (snapshots || []).filter((snap) => {
        // Filter by level
        if (snapshotLevelFilter && snapshotLevelFilter !== 'all') {
            const snapLevel = snap.data_snapshot?.level || 'departments';
            if (snapLevel !== snapshotLevelFilter) return false;
        }
        
        // Filter by cycle
        if (modalCycleFilter && snap.cycle_id !== parseInt(modalCycleFilter)) {
            return false;
        }
        
        return true;
    });

    return (
        <div 
            className="fixed inset-0 bg-black/30 bg-opacity-70 flex items-center justify-center z-[70] p-4"
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
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-900">Danh sách Báo cáo</h2>
                    </div>
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
                        <div>
                            <SnapshotDetailView
                                snapshot={selectedSnapshot}
                                onBack={onBackToList}
                                onExport={onExportSnapshot}
                            />
                        </div>
                    ) : (
                        <div>
                            {/* Filter Bar */}
                            <div className="mb-4 flex items-center justify-end gap-6">
                                <div className="flex items-center gap-4">
                                    {/* Filter theo cấp độ */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setSnapshotLevelDropdownOpen(v => !v)}
                                            className="flex items-center justify-between gap-3 px-4 h-10 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition whitespace-nowrap min-w-40"
                                        >
                                            <span>
                                                {snapshotLevelFilter === 'all'
                                                    ? 'Tất cả cấp độ'
                                                    : snapshotLevelFilter === 'company'
                                                        ? 'Công ty'
                                                        : 'Phòng ban'}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 transition-transform flex-shrink-0 ${snapshotLevelDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {snapshotLevelDropdownOpen && (
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[65] overflow-hidden">
                                                <button
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 first:rounded-t-lg"
                                                    onClick={() => {
                                                        onSnapshotLevelChange('all');
                                                        onPageChange?.(1);
                                                        setSnapshotLevelDropdownOpen(false);
                                                    }}
                                                >
                                                    Tất cả cấp độ
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100"
                                                    onClick={() => {
                                                        onSnapshotLevelChange('company');
                                                        onPageChange?.(1);
                                                        setSnapshotLevelDropdownOpen(false);
                                                    }}
                                                >
                                                    Công ty
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 last:rounded-b-lg"
                                                    onClick={() => {
                                                        onSnapshotLevelChange('departments');
                                                        onPageChange?.(1);
                                                        setSnapshotLevelDropdownOpen(false);
                                                    }}
                                                >
                                                    Phòng ban
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Filter theo chu kỳ */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <CycleDropdown
                                                cyclesList={cyclesList}
                                                cycleFilter={modalCycleFilter}
                                                handleCycleChange={(value) => {
                                                    onModalCycleFilterChange(value || '');
                                                    onPageChange?.(1);
                                                }}
                                                dropdownOpen={modalCycleDropdownOpen}
                                                setDropdownOpen={setModalCycleDropdownOpen}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Snapshots Table */}
                            {filteredSnapshots.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-semibold text-lg">Chưa có Báo cáo nào</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        {snapshotLevelFilter === 'all'
                                            ? 'Nhấn nút "Tạo Báo cáo" để tạo bản sao đầu tiên'
                                            : `Chưa có Báo cáo nào cho cấp độ ${snapshotLevelFilter === 'company' ? 'Công ty' : 'Phòng ban'}`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    {(() => {
                                        const sorted = [...filteredSnapshots];
                                        if (snapshotSortBy === 'name') {
                                            sorted.sort((a, b) => {
                                                const A = (a.title || '').toString().toLowerCase();
                                                const B = (b.title || '').toString().toLowerCase();
                                                if (A < B) return snapshotSortDir === 'asc' ? -1 : 1;
                                                if (A > B) return snapshotSortDir === 'asc' ? 1 : -1;
                                                return 0;
                                            });
                                        } else if (snapshotSortBy === 'date') {
                                            sorted.sort((a, b) => {
                                                const A = new Date(a.snapshotted_at || a.created_at || 0).getTime();
                                                const B = new Date(b.snapshotted_at || b.created_at || 0).getTime();
                                                if (A < B) return snapshotSortDir === 'asc' ? -1 : 1;
                                                if (A > B) return snapshotSortDir === 'asc' ? 1 : -1;
                                                return 0;
                                            });
                                        }

                                        return (
                                            <table className="w-full text-left bg-white border border-gray-200 rounded-lg">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th
                                                            onClick={() => {
                                                                if (snapshotSortBy === 'name') setSnapshotSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                                                                else {
                                                                    setSnapshotSortBy('name');
                                                                    setSnapshotSortDir('asc');
                                                                }
                                                            }}
                                                            className={`
                                                                px-4 py-3 text-left cursor-pointer
                                                                ${snapshotSortBy === 'name' ? 'bg-gray-100' : ''}
                                                                w-[50%]    
                                                                hover:bg-gray-100      
                                                            `}
                                                        >
                                                            Tên Báo cáo
                                                            <span className="ml-2 text-xs text-gray-500">
                                                                {snapshotSortBy === 'name' ? (snapshotSortDir === 'asc' ? '▲' : '▼') : ''}
                                                            </span>
                                                        </th>

                                                        <th className="px-4 py-3 w-[20%]">
                                                            Người thực hiện
                                                        </th>

                                                        <th
                                                            onClick={() => {
                                                                if (snapshotSortBy === 'date') setSnapshotSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                                                                else {
                                                                    setSnapshotSortBy('date');
                                                                    setSnapshotSortDir('asc');
                                                                }
                                                            }}
                                                            className={`
                                                                px-4 py-3 cursor-pointer text-left
                                                                ${snapshotSortBy === 'date' ? 'bg-gray-100' : ''}
                                                                w-[20%]
                                                                hover:bg-gray-100
                                                            `}
                                                        >
                                                            Ngày chốt
                                                            <span className="ml-2 text-xs text-center text-gray-500">
                                                                {snapshotSortBy === 'date' ? (snapshotSortDir === 'asc' ? '▲' : '▼') : ''}
                                                            </span>
                                                        </th>

                                                        <th className="px-4 py-3 text-center w-[10%]">
                                                            Hành động
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sorted.map((snap) => {
                                                        const snapLevel = snap.data_snapshot?.level || 'departments';
                                                        const levelText = snapLevel === 'company' ? 'Công ty' : 'Phòng ban';
                                                        const rowKey = `snapshot-${snap.id}-${snapshotSortBy || 'nosort'}-${snapshotSortDir}-${snap.snapshotted_at || snap.created_at || ''}`;
                                                        return (
                                                            <tr key={rowKey} className="border-t border-gray-100 hover:bg-slate-50">
                                                                <td className="px-4 py-3 align-middle">
                                                                    <div className="flex items-center gap-3">
                                                                        <div>
                                                                            <div className="font-bold text-gray-900">{snap.title}</div>
                                                                        </div>
                                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                                            {levelText}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-middle text-gray-700">{snap.creator?.full_name || 'N/A'}</td>
                                                                <td className="px-4 py-3 align-middle text-gray-700">{new Date(snap.snapshotted_at).toLocaleDateString('vi-VN')}</td>
                                                                <td className="px-4 py-3 text-center align-middle">
                                                                    <button
                                                                        onClick={() => onLoadSnapshot?.(snap.id)}
                                                                        title="Xem chi tiết"
                                                                        className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        );
                                    })()}
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
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${snapshotPage === 1
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
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${snapshotPage === pageNumber
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
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${snapshotPage === snapshotPagination.last_page
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


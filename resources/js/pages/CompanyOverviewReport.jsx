import React, { useEffect, useMemo, useState } from 'react';
import GroupedBarChart from '../components/GroupedBarChart';
import ToastNotification from '../components/ToastNotification';
import { CycleDropdown } from '../components/Dropdown';
import StatCard from '../components/reports/StatCard';
import TrendIcon from '../components/reports/TrendIcon';
import Pagination from '../components/reports/Pagination';
import ObjectivesTable from '../components/reports/ObjectivesTable';
import KeyResultsTable from '../components/reports/KeyResultsTable';
import OwnersTable from '../components/reports/OwnersTable';
import CheckInsTable from '../components/reports/CheckInsTable';
import SnapshotModal from '../components/reports/SnapshotModal';
import SnapshotHistoryModal from '../components/reports/SnapshotHistoryModal';
// import OverviewCards from '../components/reports/OverviewCards'; // Obsolete
// import ChartSection from '../components/reports/ChartSection'; // Obsolete
// import DepartmentTable from '../components/reports/DepartmentTable'; // Obsolete
import PerformanceTab from '../components/reports/PerformanceTab'; // New Tab Component
import ProcessTab from '../components/reports/ProcessTab'; // New Tab Component
import QualityTab from '../components/reports/QualityTab'; // New Tab Component
import { fetchDetailedData, fetchDetailedDataForSnapshot } from '../utils/reports/dataFetchers';
import { loadSnapshots as loadSnapshotsUtil, loadSnapshot as loadSnapshotUtil } from '../utils/reports/snapshotHelpers';
import { exportToExcel as exportToExcelUtil } from '../utils/reports/exportHelpers';
import { FiDownload, FiArchive, FiList, FiTrendingUp, FiCheckCircle, FiGitMerge } from "react-icons/fi";

export default function CompanyOverviewReport() {
    const [cycles, setCycles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [owners, setOwners] = useState([]);
    const [filterOpen, setFilterOpen] = useState(false);
    
    // New state for tab management
    const [currentTab, setCurrentTab] = useState('performance'); // performance, process, quality

    const [toast, setToast] = useState(null);

    const [filters, setFilters] = useState({
        cycleId: '',
        departmentId: '',
        objectiveLevel: 'all', // all, company, department, individual
        dateRange: { start: null, end: null },
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // The report state will now hold data for the currently active tab
    const [reportData, setReportData] = useState(null);
    
    const [currentCycleMeta, setCurrentCycleMeta] = useState(null);
    
    const [userRole, setUserRole] = useState(null);
    const [isAdminOrCeo, setIsAdminOrCeo] = useState(false);

    const handleExport = () => {
        if (!filters.cycleId) {
            showNotification('error', 'Vui lòng chọn chu kỳ để xuất báo cáo.');
            return;
        }
        const params = new URLSearchParams();
        params.set('cycle_id', filters.cycleId);
        params.set('tab', currentTab);
        if (filters.departmentId) params.set('department_id', filters.departmentId);
        if (filters.objectiveLevel && filters.objectiveLevel !== 'all') params.set('objective_level', filters.objectiveLevel);
        if (filters.dateRange.start) params.set('start_date', filters.dateRange.start);
        if (filters.dateRange.end) params.set('end_date', filters.dateRange.end);
        
        const url = `/api/reports/okr-company/export-csv?${params.toString()}`;
        window.open(url, '_blank');
    };

    // Fetch user profile to check role
    useEffect(() => {
        (async () => {
            try {
                const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const res = await fetch('/api/profile', {
                    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token }
                });
                if (res.ok) {
                    const data = await res.json();
                    const role = data.user?.role?.role_name?.toLowerCase() || '';
                    setUserRole(role);
                    setIsAdminOrCeo(role === 'admin' || role === 'ceo');
                }
            } catch (error) {
                console.error('Lỗi khi tải thông tin user:', error);
            }
        })();
    }, []);

    // Đọc query params khi component mount
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const cycleId = params.get('cycle_id');
            if (cycleId) {
                setFilters(f => ({ ...f, cycleId }));
            }
        } catch (e) {
            console.error('Failed to read query params:', e);
        }
    }, []);

    // Fetch initial dropdown data (cycles, departments, etc.)
    useEffect(() => {
        (async () => {
            try {
                const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const headers = { Accept: 'application/json', 'X-CSRF-TOKEN': token };

                const [rCycles, rDepts, rUsers] = await Promise.all([
                    fetch('/cycles', { headers }),
                    fetch('/departments', { headers }),
                    fetch('/users?per_page=1000', { headers })
                ]);
                const dCycles = await rCycles.json();
                const dDepts = await rDepts.json();
                const dUsers = await rUsers.json();
                setCycles(Array.isArray(dCycles.data) ? dCycles.data : []);
                setDepartments(Array.isArray(dDepts.data) ? dDepts.data : []);
                setOwners(Array.isArray(dUsers.data) ? dUsers.data : []);

                if (dCycles.data.length && !filters.cycleId) {
                    const current = dCycles.data.find(c => c.status === 'active') || dCycles.data[0];
                    setFilters(f => ({ ...f, cycleId: current.cycle_id }));
                }
            } catch (e) { console.error("Failed to fetch initial data", e) }
        })();
    }, []);

    // Update cycle meta when filter changes
    useEffect(() => {
        if (!filters.cycleId || !cycles.length) return;
        const c = cycles.find(x => String(x.cycle_id) === String(filters.cycleId));
        if (c) {
            setCurrentCycleMeta(c);
        }
    }, [filters.cycleId, cycles]);

    // Main data fetching logic based on filters and currentTab
    useEffect(() => {
        if (!filters.cycleId) return;

        setLoading(true);
        setError('');
        
        (async () => {
            try {
                const params = new URLSearchParams();
                params.set('cycle_id', filters.cycleId);
                params.set('tab', currentTab);
                if (filters.departmentId) params.set('department_id', filters.departmentId);
                if (filters.objectiveLevel && filters.objectiveLevel !== 'all') params.set('objective_level', filters.objectiveLevel);
                if (filters.dateRange.start) params.set('start_date', filters.dateRange.start);
                if (filters.dateRange.end) params.set('end_date', filters.dateRange.end);
                
                const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const url = `/api/reports/okr-company?${params.toString()}`;
                const res = await fetch(url, { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', 'X-CSRF-TOKEN': token } });
                const json = await res.json();
                if (!res.ok || !json.success) {
                    throw new Error(json.message || `Failed to load report data for tab: ${currentTab}`);
                }
                
                setReportData(json.data);
            } catch (e) {
                setError(e.message || 'Có lỗi xảy ra khi tải dữ liệu báo cáo.');
                setReportData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [filters, currentTab]);

    // Sync filters to URL
    useEffect(() => {
        try {
            const url = new URL(window.location.href);
            if (filters.cycleId) {
                url.searchParams.set('cycle_id', filters.cycleId);
            } else {
                url.searchParams.delete('cycle_id');
            }
            // Add other filters to URL sync if needed in the future
            window.history.replaceState({}, '', url.toString());
        } catch (e) {
            console.error('Failed to sync filters to URL', e);
        }
    }, [filters.cycleId]);
    
    // Show notification
    const showNotification = (type, message) => {
        setToast({ type, message });
    };

    const tabConfig = [
        { id: 'performance', label: 'Hiệu suất', icon: FiTrendingUp },
        { id: 'process', label: 'Quy trình', icon: FiCheckCircle },
        { id: 'quality', label: 'Chất lượng & Cấu trúc', icon: FiGitMerge },
    ];

    return (
        <div className="px-6 py-8 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold text-slate-900">Báo cáo Thống kê Cấp Công ty</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-600">Chu kỳ OKR</span>
                            <CycleDropdown
                                cyclesList={cycles}
                                cycleFilter={filters.cycleId}
                                handleCycleChange={(value) => setFilters(f => ({ ...f, cycleId: value || null, dateRange: { start: null, end: null } }))}
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-4 h-9 mt-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                           <FiDownload />
                            Xuất CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex items-center gap-4 -mb-px">
                    {tabConfig.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-1 text-sm font-semibold transition-colors duration-200 ${
                                currentTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Notification Toast */}
            <ToastNotification toast={toast} onClose={() => setToast(null)} />

            {/* Tab Content */}
            <div className="report-content">
                {loading && (
                    <div className="text-center py-20">
                        <div className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                        <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                )}
                {!loading && error && (
                     <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-3xl mx-auto">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 font-semibold">Lỗi tải báo cáo</p>
                                <p className="mt-1 text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && !error && reportData && (
                    <>
                        {currentTab === 'performance' && <PerformanceTab data={reportData} filters={filters} setFilters={setFilters} allDepartments={departments} />}
                        {currentTab === 'process' && <ProcessTab data={reportData} />}
                        {currentTab === 'quality' && <QualityTab data={reportData} />}
                    </>
                )}
            </div>
        </div>
    );
}

import React, { useEffect, useState, useMemo } from "react";
import { Select } from "../components/ui";
import ToastNotification from "../components/ToastNotification";
import ConfirmationModal from "../components/ConfirmationModal";
import { exportTeamReportToExcel } from "../utils/reports/exportHelpers";
import SnapshotModal from "../components/reports/SnapshotModal";
import SnapshotHistoryModal from "../components/reports/SnapshotHistoryModal";
import { loadSnapshots, loadSnapshot } from "../utils/reports/snapshotHelpers";
import { FiDownload, FiFilter, FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiTrendingDown, FiMinus, FiUsers, FiMoreHorizontal, FiArchive, FiList } from "react-icons/fi";
import { HiChartPie, HiExclamationTriangle, HiUserGroup, HiDocumentCheck } from "react-icons/hi2";

export default function ReportPage() {
    const [loading, setLoading] = useState(true);
    const [cycles, setCycles] = useState([]);
    const [selectedCycle, setSelectedCycle] = useState("");
    const [reportData, setReportData] = useState(null);
    const [departmentName, setDepartmentName] = useState("");
    const [error, setError] = useState(null);
    const [canEditReport, setCanEditReport] = useState(false);
    
    // Snapshot logic
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
    const [reportName, setReportName] = useState("");
    
    // Snapshot History Logic
    const [showSnapshots, setShowSnapshots] = useState(false);
    const [snapshots, setSnapshots] = useState([]);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    const [snapshotPage, setSnapshotPage] = useState(1);
    const [snapshotPagination, setSnapshotPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [modalCycleFilter, setModalCycleFilter] = useState("");

    // --- MEMBER LIST LOGIC ---
    // Simplified for small teams (removed complex filtering)
    const memberList = useMemo(() => {
        if (!reportData?.members) return [];
        return reportData.members.map(member => {
            // Logic mapping status (fallback logic if API status is inconsistent)
            let status = member.status || 'pending';
            if (!member.status) {
                 if (member.average_completion >= 70) status = 'on_track';
                 else if (member.average_completion >= 40) status = 'at_risk';
                 else status = 'behind';
            }
            return { ...member, status };
        });
    }, [reportData]);

    // --- UI/UX ENHANCEMENTS ---
    const [toast, setToast] = useState({ message: null, type: null });
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        onConfirm: () => {},
        confirmText: "Xác nhận",
        cancelText: "Hủy"
    });
    const [remindingMap, setRemindingMap] = useState({}); // Track loading state per member ID

    // --- DERIVED METRICS ---
    
    // 1. Define activeOkrs FIRST to avoid ReferenceError
    const activeOkrs = useMemo(() => {
        if (!reportData?.team_okrs) return [];
        // Filter out archived AND keep only 'unit' level OKRs (Department Objectives)
        return reportData.team_okrs.filter(okr => okr.status !== 'archived' && okr.level === 'unit');
    }, [reportData]);

    // 2. Define metrics using activeOkrs
    const metrics = useMemo(() => {
        const data = reportData || {};
        
        // Tính toán trạng thái dựa trên status từ API (Time-based)
        let onTrack = 0, atRisk = 0, behind = 0;
        let totalProgressSum = 0;
        
        activeOkrs.forEach(okr => {
            // Cộng tổng tiến độ để tính lại trung bình
            totalProgressSum += (Number(okr.progress) || 0);

            const s = okr.status; // Status từ API: completed, on_track, at_risk, behind, pending
            if (s === 'completed' || s === 'on_track') {
                onTrack++;
            } else if (s === 'at_risk') {
                atRisk++;
            } else if (s === 'behind') {
                behind++;
            }
        });
        
        const total = activeOkrs.length || 1;
        // Tự tính lại tiến độ trung bình dựa trên danh sách Active
        const calculatedAvg = activeOkrs.length > 0 ? (totalProgressSum / activeOkrs.length) : 0;
        
        // Tính toán chi tiết cho từng cấp độ (Dept vs Team)
        const deptOkrs = activeOkrs.filter(o => o.level !== 'team');
        const subTeamOkrs = activeOkrs.filter(o => o.level === 'team');
        
        const calcAvg = (list) => list.length ? (list.reduce((sum, item) => sum + (Number(item.progress) || 0), 0) / list.length) : 0;

        // Lấy danh sách Thành viên CHẬM TRỄ (behind) - Không giới hạn số lượng
        const riskMembers = (data.members || [])
            .filter(m => m.status === 'behind')
            .sort((a, b) => (a.average_completion || 0) - (b.average_completion || 0));

        return {
            avgProgress: calculatedAvg,
            expectedProgress: data.expected_progress || 0,
            totalOkrs: activeOkrs.length,
            memberCount: data.members?.length || 0,
            onTrackPct: (onTrack / total) * 100,
            atRiskPct: (atRisk / total) * 100,
            behindPct: (behind / total) * 100,
            atRiskCount: atRisk + behind,
            riskMembers: riskMembers,
            deptStats: { count: deptOkrs.length, avg: calcAvg(deptOkrs) },
            teamStats: { count: subTeamOkrs.length, avg: calcAvg(subTeamOkrs) }
        };
    }, [reportData, activeOkrs]);

    // --- DATA FETCHING ---
    
    const loadReportData = async (cycleId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/reports/my-team?cycle_id=${cycleId}`, { headers: { Accept: "application/json" } });
            const json = await res.json();
            if (json.success) {
                setReportData(json.data);
                setDepartmentName(json.department_name);
            } else {
                setError(json.message);
            }
        } catch (e) {
            console.error("Error loading report:", e);
            setError("Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                // Fetch profile to check role
                const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const profileRes = await fetch('/api/profile', {
                    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token }
                });
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    const role = data.user?.role?.role_name?.toLowerCase() || '';
                    // Allow Manager, Admin, CEO
                    const isManagerial = ['manager', 'admin', 'ceo', 'trưởng phòng', 'giám đốc'].some(r => role.includes(r));
                    setCanEditReport(isManagerial);
                }
            } catch (e) {
                console.error("Error checking role:", e);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/reports/cycles", { headers: { Accept: "application/json" } });
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setCycles(data.data);
                    const defaultCycleId = data.meta?.default_cycle_id ?? data.data[0].cycle_id;
                    setSelectedCycle(String(defaultCycleId));
                }
            } catch (e) {
                console.error("Error loading cycles:", e);
            }
        })();
    }, []);

    useEffect(() => {
        if (selectedCycle) loadReportData(selectedCycle);
    }, [selectedCycle]);

    // --- SUB-COMPONENTS ---

    const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
        const colorStyles = {
            indigo: "bg-indigo-100 text-indigo-600",
            rose: "bg-rose-100 text-rose-600",
            blue: "bg-blue-100 text-blue-600",
            emerald: "bg-emerald-100 text-emerald-600",
        };
        const style = colorStyles[color] || "bg-slate-100 text-slate-600";

        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3.5 rounded-xl ${style} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
            </div>
        );
    };

    const ProgressBar = ({ value, color = "bg-indigo-600" }) => (
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className={`h-2.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }}></div>
        </div>
    );

    const StatusBadge = ({ progress, status }) => {
        // Ưu tiên dùng status từ API (Time-based logic)
        if (status) {
            const config = {
                completed: { color: "bg-purple-100 text-purple-800", text: "Hoàn thành" },
                on_track: { color: "bg-emerald-100 text-emerald-800", text: "Đúng tiến độ" },
                at_risk: { color: "bg-amber-100 text-amber-800", text: "Rủi ro" },
                behind: { color: "bg-rose-100 text-rose-800", text: "Chậm trễ" },
                pending: { color: "bg-slate-100 text-slate-600", text: "Chưa bắt đầu" }
            };
            const { color, text } = config[status] || config.pending;
            return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{text}</span>;
        }

        // Fallback logic cũ
        if (progress >= 100) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Hoàn thành</span>;
        if (progress >= 70) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Đúng tiến độ</span>;
        if (progress >= 40) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Rủi ro</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Chậm trễ</span>;
    };

    const CheckinStatusBadge = ({ status, lastCheckin }) => {
        const config = {
            good: { color: 'bg-emerald-100 text-emerald-700', icon: FiCheckCircle, text: 'Đều đặn' },
            warning: { color: 'bg-amber-100 text-amber-700', icon: FiClock, text: 'Cần nhắc' },
            late: { color: 'bg-rose-100 text-rose-700', icon: FiAlertCircle, text: 'Quá hạn' },
            no_data: { color: 'bg-slate-100 text-slate-500', icon: FiMinus, text: 'Chưa có' }
        };
        
        const { color, icon: Icon, text } = config[status] || config.no_data;

        return (
            <div className="flex flex-col items-start gap-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                    <Icon className="w-3 h-3" />
                    {text}
                </span>
                <span className="text-xs text-slate-400">{lastCheckin || 'Chưa check-in'}</span>
            </div>
        );
    };

    const ConfidenceTrendIcon = ({ trend }) => {
        if (trend === 'increasing') return <FiTrendingUp className="w-4 h-4 text-emerald-500" title="Mức độ tự tin đang tăng" />;
        if (trend === 'decreasing') return <FiTrendingDown className="w-4 h-4 text-rose-500" title="Mức độ tự tin đang giảm" />;
        return null; // Ẩn nếu ổn định để giao diện sạch hơn
    };

    const executeRemind = async (memberId) => {
        setRemindingMap(prev => ({ ...prev, [memberId]: true }));
        try {
            const res = await fetch("/api/reports/remind", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ""
                },
                body: JSON.stringify({ 
                    member_id: memberId,
                    cycle_id: selectedCycle 
                })
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: data.message, type: "success" });
            } else {
                setToast({ message: data.message || "Có lỗi xảy ra", type: "error" });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: "Lỗi kết nối server", type: "error" });
        } finally {
            setRemindingMap(prev => ({ ...prev, [memberId]: false }));
        }
    };

    const handleRemindClick = (memberId, memberName) => {
        setConfirmModal({
            show: true,
            title: "Xác nhận nhắc nhở",
            message: `Bạn có chắc chắn muốn gửi thông báo nhắc nhở check-in đến ${memberName}?`,
            confirmText: "Gửi ngay",
            cancelText: "Hủy bỏ",
            onConfirm: () => executeRemind(memberId)
        });
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        const cycleName = cycles.find(c => String(c.cycle_id) === String(selectedCycle))?.cycle_name || "";
        
        exportTeamReportToExcel(
            reportData,
            departmentName,
            cycleName,
            (msg) => setToast({ message: msg, type: 'success' }),
            (msg) => setToast({ message: msg, type: 'error' })
        );
    };

    // --- SNAPSHOT FUNCTIONS ---
    
    const confirmCreateSnapshot = async () => {
        if (!reportName.trim()) {
            setToast({ message: "Vui lòng nhập tên báo cáo", type: "error" });
            return;
        }
        setIsCreatingSnapshot(true);
        try {
            const cycleId = selectedCycle;
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || "";
            
            // Prepare snapshot data - structure similar to reportData
            // Ensure we tag it with 'level: unit' (or 'team' depending on convention)
            
            // Filter OKRs to match the Excel export logic (only active unit-level OKRs)
            const filteredOkrs = (reportData.team_okrs || []).filter(okr => okr.status !== 'archived' && okr.level === 'unit');

            // Recalculate metrics based on filtered list
            let onTrack = 0, atRisk = 0, behind = 0;
            let totalProgressSum = 0;
            filteredOkrs.forEach(okr => {
                totalProgressSum += (Number(okr.progress) || 0);
                const s = okr.status;
                if (s === 'completed' || s === 'on_track') onTrack++;
                else if (s === 'at_risk') atRisk++;
                else if (s === 'behind') behind++;
            });
            
            const total = filteredOkrs.length || 1;
            const calculatedAvg = filteredOkrs.length > 0 ? (totalProgressSum / filteredOkrs.length) : 0;

            const snapshotPayload = {
                ...reportData,
                team_okrs: filteredOkrs, // Override with filtered list
                total_okr_count: filteredOkrs.length, // Sync count
                team_average_completion: calculatedAvg, // Sync average
                
                // Add structure for SnapshotDetailView compatibility
                overall: {
                    totalObjectives: filteredOkrs.length,
                    averageProgress: calculatedAvg,
                    statusCounts: {
                        onTrack,
                        atRisk,
                        offTrack: behind
                    },
                    statusDistribution: {
                        onTrack: ((onTrack/total)*100).toFixed(1),
                        atRisk: ((atRisk/total)*100).toFixed(1),
                        offTrack: ((behind/total)*100).toFixed(1)
                    }
                },
                detailedData: {
                    objectives: filteredOkrs.map(okr => ({
                        ...okr,
                        progress_percent: okr.progress // Ensure compatibility with SnapshotDetailView
                    }))
                },
                
                level: 'unit', // Tag as unit/department level
                department_name: departmentName,
                // Include metrics calculated in UI if needed, but reportData should have raw data
            };

            const response = await fetch('/api/reports/snapshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    cycle_id: cycleId,
                    title: reportName.trim(),
                    data_snapshot: snapshotPayload,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setToast({ message: "Đã lưu báo cáo thành công!", type: "success" });
                setShowCreateModal(false);
                setReportName("");
                // Refresh list if open? (Not open yet)
            } else {
                setToast({ message: result.message || "Lỗi khi lưu báo cáo", type: "error" });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: "Lỗi kết nối server", type: "error" });
        } finally {
            setIsCreatingSnapshot(false);
        }
    };

    const loadSnapshotsList = async (page = 1, cycleId = null) => {
        const cId = cycleId || selectedCycle;
        if (!cId) return;
        
        // Use helper to load snapshots with filtering
        const filters = {
            level: 'unit',
            department_name: departmentName
        };
        
        const result = await loadSnapshots(cId, page, filters);
        
        setSnapshots(result.snapshots);
        setSnapshotPagination(result.pagination);
    };

    const handleViewSnapshots = () => {
        if (!showSnapshots) {
            setShowSnapshots(true);
            setSnapshotPage(1);
            setModalCycleFilter(selectedCycle); // Sync filter with current selection
            loadSnapshotsList(1, selectedCycle);
        } else {
            setShowSnapshots(false);
        }
    };

    const onLoadSnapshotDetail = async (id) => {
        const snap = await loadSnapshot(id);
        if (snap) {
            setSelectedSnapshot(snap);
        } else {
            setToast({ message: "Không thể tải chi tiết", type: "error" });
        }
    };

    const exportSnapshot = (snap) => {
        if (!snap || !snap.data_snapshot) return;
        const data = snap.data_snapshot;
        const cName = cycles.find(c => String(c.cycle_id) === String(snap.cycle_id))?.cycle_name || "";
        
        exportTeamReportToExcel(
            data,
            data.department_name || departmentName,
            cName,
            (msg) => setToast({ message: msg, type: 'success' }),
            (msg) => setToast({ message: msg, type: 'error' })
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {departmentName ? `Báo cáo ${departmentName}` : "Báo cáo Hiệu suất Nhóm"}
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">Theo dõi tiến độ, rủi ro và hiệu suất thành viên trong chu kỳ này.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <Select
                                value={selectedCycle}
                                onChange={setSelectedCycle}
                                options={cycles.map(c => ({ value: String(c.cycle_id), label: c.cycle_name }))}
                                placeholder="Chọn chu kỳ"
                            />
                        </div>

                        {/* Button Group */}
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            {canEditReport && (
                                <>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        disabled={!reportData}
                                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                                        title="Lưu báo cáo hiện tại"
                                    >
                                        <FiArchive className="w-4 h-4" />
                                        <span className="hidden sm:inline">Lưu báo cáo</span>
                                    </button>
                                    <div className="w-px h-6 bg-slate-200"></div>
                                </>
                            )}
                            <button
                                onClick={handleViewSnapshots}
                                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-sm font-medium"
                                title="Xem lịch sử báo cáo"
                            >
                                <FiList className="w-4 h-4" />
                                <span className="hidden sm:inline">Lịch sử</span>
                            </button>
                            <div className="w-px h-6 bg-slate-200"></div>
                            <button 
                                onClick={handleExportExcel}
                                disabled={!reportData}
                                className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <FiDownload className="w-4 h-4" />
                                <span className="hidden sm:inline">Xuất Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                   <div className="h-96 flex items-center justify-center text-slate-400">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                       Đang tải dữ liệu...
                   </div> 
                ) : (
                    <>
                        {/* 2. OVERVIEW STATS (BENTO GRID) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard 
                                title="Tiến độ trung bình" 
                                value={`${metrics.avgProgress.toFixed(1)}%`}
                                subtitle="So với kế hoạch toàn chu kỳ"
                                icon={HiChartPie}
                                color="indigo"
                            />
                            <StatCard 
                                title="OKRs Rủi ro" 
                                value={metrics.atRiskCount}
                                subtitle="Cần sự chú ý ngay lập tức"
                                icon={HiExclamationTriangle}
                                color="rose"
                            />
                            <StatCard 
                                title="Thành viên" 
                                value={metrics.memberCount}
                                subtitle="Đang hoạt động trong chu kỳ này"
                                icon={HiUserGroup}
                                color="blue"
                            />
                             <StatCard 
                                title="Tổng số OKR" 
                                value={metrics.totalOkrs}
                                subtitle="Mục tiêu cấp nhóm"
                                icon={HiDocumentCheck}
                                color="emerald"
                            />
                        </div>

                        {/* 3. MAIN DASHBOARD AREA */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* LEFT: Health & Insights (Replaced Donut Chart) */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6">Sức khỏe & Phân bổ</h3>
                                    
                                    <div className="flex-1 space-y-8">
                                        {/* 1. Time & Pace Analysis */}
                                        <div>
                                            {(() => {
                                                const delta = metrics.avgProgress - metrics.expectedProgress;
                                                const isBehind = delta < 0;
                                                const absDelta = Math.abs(delta).toFixed(1);
                                                
                                                // Màu sắc cho con số chênh lệch
                                                let gapColor = isBehind ? 'text-rose-600' : 'text-emerald-600';
                                                let gapBg = isBehind ? 'bg-rose-50' : 'bg-emerald-50';
                                                let gapIcon = isBehind ? <FiAlertCircle className="w-5 h-5 text-rose-500" /> : <FiTrendingUp className="w-5 h-5 text-emerald-500" />;
                                                let gapText = isBehind ? 'Chậm hơn kế hoạch' : 'Vượt kế hoạch';

                                                return (
                                                    <>
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đánh giá tiến độ</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-3xl font-bold ${gapColor}`}>
                                                                        {delta > 0 ? '+' : ''}{Math.abs(delta).toFixed(1)}%
                                                                    </span>
                                                                    <div className={`p-1.5 rounded-full ${gapBg}`}>
                                                                        {gapIcon}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs font-medium text-slate-500 mt-1">{gapText}</p>
                                                            </div>
                                                            
                                                            {/* Mini circular indicator for visual balance */}
                                                            <div className="relative w-16 h-16">
                                                                <svg className="w-full h-full transform -rotate-90">
                                                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                                                        strokeDasharray={175.9} 
                                                                        strokeDashoffset={175.9 - (175.9 * metrics.expectedProgress) / 100} 
                                                                        className="text-blue-500 transition-all duration-1000 ease-out" 
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-400">TIME</span>
                                                                    <span className="text-xs font-bold text-blue-600">{Math.round(metrics.expectedProgress)}%</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Time Bar Context */}
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian trôi qua</span>
                                                            </div>
                                                            <div className="h-2 bg-blue-50 rounded-full overflow-hidden relative">
                                                                {/* Thanh thời gian */}
                                                                <div 
                                                                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full opacity-30"
                                                                    style={{ width: `${Math.min(metrics.expectedProgress, 100)}%` }}
                                                                />
                                                                {/* Mốc tiến độ thực tế (Marker) */}
                                                                <div 
                                                                    className={`absolute top-0 h-full w-1 ${isBehind ? 'bg-rose-500' : 'bg-emerald-500'} z-10`}
                                                                    style={{ left: `${Math.min(metrics.avgProgress, 100)}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                                <span>Bắt đầu</span>
                                                                <span className="flex items-center gap-1">
                                                                    <span className={`w-2 h-2 rounded-full ${isBehind ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                                    Thực tế: {metrics.avgProgress.toFixed(0)}%
                                                                </span>
                                                                <span>Kết thúc</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <hr className="border-slate-50" />

                                        {/* 2. Top Risk Members */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <HiExclamationTriangle className="text-amber-500 w-4 h-4" />
                                                Cần hỗ trợ
                                            </h4>
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                                {metrics.riskMembers.length > 0 ? metrics.riskMembers.map((member) => (
                                                    <div key={member.user_id} className="flex items-center gap-3">
                                                        <img 
                                                            src={member.avatar || `https://ui-avatars.com/api/?name=${member.full_name}&background=random`} 
                                                            alt={member.full_name}
                                                            className="w-8 h-8 rounded-full object-cover border border-slate-100"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-medium text-slate-700 truncate" title={member.full_name}>
                                                                    {member.full_name}
                                                                </span>
                                                                <span className="font-bold text-rose-600">{member.average_completion?.toFixed(0)}%</span>
                                                            </div>
                                                            <div className="h-1.5 bg-rose-50 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-rose-500 rounded-full"
                                                                    style={{ width: `${member.average_completion}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 rounded-lg">
                                                        Tất cả thành viên đều ổn định!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Detailed OKR List (Moved Up) */}
                            <div className="lg:col-span-2">
                                {activeOkrs && activeOkrs.length > 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <HiDocumentCheck className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">Chi tiết OKRs phòng ban</h3>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                                {activeOkrs.length} Mục tiêu
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-50 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                            {activeOkrs.map((okr, index) => (
                                                <div key={okr.objective_id || index} className="p-6 hover:bg-slate-50 transition-colors group">
                                                    <div className="flex flex-col gap-4">
                                                        {/* Top Row: Title & Meta */}
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                                        <HiDocumentCheck className="w-3 h-3" />
                                                                        {okr.completed_kr_count}/{okr.key_results_count} Kết quả then chốt đã hoàn thành
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors" title={okr.obj_title}>
                                                                    {okr.obj_title}
                                                                </h4>
                                                            </div>
                                                            <StatusBadge progress={okr.progress} status={okr.status} />
                                                        </div>

                                                        {/* Bottom Row: Progress */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                <span>Tiến độ</span>
                                                                <span className="font-bold text-slate-900">{okr.progress}%</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        okr.progress >= 70 ? 'bg-emerald-500' : 
                                                                        okr.progress >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                                                    }`} 
                                                                    style={{ width: `${okr.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 p-8">
                                        Chưa có dữ liệu OKR
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. TEAM MEMBERS LEADERBOARD (Moved Down - Full Width) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <HiUserGroup className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Hiệu suất thành viên</h3>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Thành viên</th>
                                            <th className="px-6 py-4 text-center">OKRs</th>
                                            <th className="px-6 py-4 text-left w-1/3">Tiến độ</th>
                                            <th className="px-6 py-4 text-left">Check-in cuối</th>
                                            <th className="px-6 py-4 text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {memberList.map((member) => (
                                            <tr key={member.user_id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={member.avatar || `https://ui-avatars.com/api/?name=${member.full_name}&background=random`} 
                                                            alt={member.full_name}
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-slate-900">{member.full_name}</div>
                                                            <div className="text-xs text-slate-500">{member.role || "Member"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                                                        {member.total_kr_contributed || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-slate-700">{member.average_completion?.toFixed(0)}%</span>
                                                        <StatusBadge progress={member.average_completion} status={member.status} />
                                                    </div>
                                                    <ProgressBar 
                                                        value={member.average_completion} 
                                                        color={member.average_completion < 40 ? 'bg-rose-500' : (member.average_completion < 70 ? 'bg-amber-500' : 'bg-emerald-500')} 
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <FiClock className="w-4 h-4 text-slate-400" />
                                                        <span>{member.last_checkin || "Chưa check-in"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleRemindClick(member.user_id, member.full_name)}
                                                        disabled={remindingMap[member.user_id]}
                                                        className={`text-sm font-medium transition-all ${
                                                            remindingMap[member.user_id] 
                                                            ? "text-slate-400 cursor-wait"
                                                            : "text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100"
                                                        }`}
                                                    >
                                                        {remindingMap[member.user_id] ? "Đang gửi..." : "Nhắc nhở"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                <ToastNotification 
                    toast={toast}
                    onClose={() => setToast({ message: null, type: null })}
                />

                <ConfirmationModal 
                    confirmModal={confirmModal}
                    closeConfirm={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                />

                {/* MODALS */}
                <SnapshotModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setReportName("");
                    }}
                    title={reportName}
                    onTitleChange={setReportName}
                    onSubmit={confirmCreateSnapshot}
                    isSubmitting={isCreatingSnapshot}
                    showLevelSelector={false} // Hide level selector for Team Report
                    level="unit"
                    onLevelChange={() => {}} 
                />

                {showSnapshots && (
                    <SnapshotHistoryModal
                        isOpen={showSnapshots}
                        onClose={() => {
                            setShowSnapshots(false);
                            setSelectedSnapshot(null);
                        }}
                        snapshots={snapshots}
                        snapshotLevelFilter="all" // Or specific logic if needed
                        showLevelFilter={false} // Hide filter in team view
                        onSnapshotLevelChange={() => {}}
                        snapshotPage={snapshotPage}
                        snapshotPagination={snapshotPagination}
                        onPageChange={(page) => {
                            setSnapshotPage(page);
                            loadSnapshotsList(page, modalCycleFilter);
                        }}
                        onLoadSnapshot={onLoadSnapshotDetail}
                        selectedSnapshot={selectedSnapshot}
                        onBackToList={() => setSelectedSnapshot(null)}
                        onExportSnapshot={exportSnapshot}
                        modalCycleFilter={modalCycleFilter}
                        onModalCycleFilterChange={(val) => {
                            setModalCycleFilter(val);
                            loadSnapshotsList(1, val);
                        }}
                        cyclesList={cycles}
                    />
                )}
            </div>
        </div>
    );
}
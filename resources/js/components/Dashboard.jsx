
import React, { useEffect, useMemo, useState } from "react";
import ObjectiveList from "../pages/ObjectiveList.jsx";
import ObjectiveModal from "../pages/ObjectiveModal.jsx";
import KeyResultModal from "../pages/KeyResultModal.jsx";
import ToastComponent from "../pages/ToastComponent.jsx";
import ErrorBoundary from "./ErrorBoundary";
import OKRBarChart from "./OKRBarChart";
import OKRTable from "./OKRTable";
import CheckInModal from "./CheckInModal";
import CheckInHistory from "./CheckInHistory";
import OKRStats from "./OKRStats";

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [cyclesList, setCyclesList] = useState([]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ type: "success", message: "" });
    const [editingKR, setEditingKR] = useState(null);
    const [creatingFor, setCreatingFor] = useState(null);
    const [creatingObjective, setCreatingObjective] = useState(false);
    const [editingObjective, setEditingObjective] = useState(null);
    const [openObj, setOpenObj] = useState({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [currentUser, setCurrentUser] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [checkInModal, setCheckInModal] = useState({ open: false, keyResult: null });
    const [checkInHistory, setCheckInHistory] = useState({ open: false, keyResult: null });
    const [activeTab, setActiveTab] = useState('my'); // 'my', 'department', 'company'
    
    // Filters riêng cho từng tab
    const [myFilters, setMyFilters] = useState({
        cycle: "",
        department: "",
        myOKROnly: false,
        showFilters: false
    });
    const [departmentFilters, setDepartmentFilters] = useState({
        cycle: "",
        department: "",
        myOKROnly: false,
        showFilters: false
    });
    const [companyFilters, setCompanyFilters] = useState({
        cycle: "",
        department: "",
        myOKROnly: false,
        showFilters: false
    });

    // Helper để lấy filters hiện tại dựa trên tab
    const getCurrentFilters = () => {
        if (activeTab === 'my') return myFilters;
        if (activeTab === 'department') return departmentFilters;
        return companyFilters;
    };

    // Helper để set filters cho tab hiện tại
    const setCurrentFilters = (newFilters) => {
        if (activeTab === 'my') setMyFilters(newFilters);
        else if (activeTab === 'department') setDepartmentFilters(newFilters);
        else setCompanyFilters(newFilters);
    };

    const loadStaticData = async () => {
        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            const [resDept, resCycles, resLinks] = await Promise.all([
                fetch("/departments", {
                    headers: { Accept: "application/json" },
                }),
                fetch("/cycles", { headers: { Accept: "application/json" } }),
                fetch("/my-links", {
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": token,
                    },
                }),
            ]);

            if (resDept.ok) {
                const deptData = await resDept.json();
                setDepartments(deptData.data || []);
            }

            if (resCycles.ok) {
                const cyclesData = await resCycles.json();
                setCyclesList(cyclesData.data || []);
            }

            if (resLinks.ok) {
                const linksData = await resLinks.json().catch((err) => {
                    console.error("Error parsing links:", err);
                    return { data: [] };
                });
                setLinks(linksData.data || []);
            }
        } catch (err) {
            console.error("Load static data error:", err);
        }
    };

    const load = async (pageNum = 1, filter = "", myOKR = false) => {
        try {
            setLoading(true);
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");
            if (!token) {
                setToast({
                    type: "error",
                    message: "Không tìm thấy CSRF token",
                });
                throw new Error("CSRF token not found");
            }

            // Tạo URL với filter
            let url = `/my-objectives?page=${pageNum}&dashboard=1&_t=${Date.now()}`;
            if (filter) {
                url += `&cycle_id=${filter}`;
            }
            if (myOKR) {
                url += `&my_okr=1`;
            }

            const resObj = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": token,
                },
            });

            if (!resObj.ok) {
                console.error(
                    "Objectives API error:",
                    resObj.status,
                    resObj.statusText
                );
                setToast({
                    type: "error",
                    message: `Lỗi tải objectives: ${resObj.statusText}`,
                });
            }
            const objData = await resObj.json().catch((err) => {
                console.error("Error parsing objectives:", err);
                setToast({
                    type: "error",
                    message: "Lỗi phân tích dữ liệu objectives",
                });
                return { success: false, data: { data: [], last_page: 1 } };
            });
            // Normalize data: convert keyResults to key_results
            const list = Array.isArray(objData?.data?.data) ? objData.data.data : (Array.isArray(objData?.data) ? objData.data : []);
            const normalizedItems = Array.isArray(list)
                ? list.map(obj => ({
                    ...obj,
                    key_results: obj.key_results || obj.keyResults || []
                }))
                : [];
            if (resObj.ok && Array.isArray(list)) {
                setItems(normalizedItems);
                try { localStorage.setItem('my_objectives', JSON.stringify(normalizedItems)); } catch {}
                if (objData?.data?.last_page) setTotalPages(objData.data.last_page);
            } else {
                console.warn('Keeping previous objectives due to bad response');
            }

        } catch (err) {
            console.error("Load error:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            setToast({
                type: "error",
                message: "Không thể tải dữ liệu. Vui lòng thử lại.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    useEffect(() => {
        const currentFilters = getCurrentFilters();
        load(page, currentFilters.cycle, currentFilters.myOKROnly);
    }, [page]);

    useEffect(() => {
        // Reset page khi chuyển tab
        setPage(1);
    }, [activeTab]);

    useEffect(() => {
        // Load static data một lần khi component mount
        loadStaticData();
        
        // Load current user
        const loadCurrentUser = async () => {
            try {
                const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
                const res = await fetch("/api/profile", {
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": token,
                    },
                });
                const json = await res.json();
                if (res.ok && json.success) {
                    setCurrentUser(json.user);
                }
            } catch (err) {
                console.error("Error loading current user:", err);
            }
        };
        loadCurrentUser();
    }, []);

    // Phân loại OKR theo level
    const { myOKRs, departmentOKRs, companyOKRs } = useMemo(() => {
        const allItems = Array.isArray(items) ? items : [];
        
        return {
            myOKRs: allItems.filter(item => item.level === 'person'),
            departmentOKRs: allItems.filter(item => item.level === 'unit'),
            companyOKRs: allItems.filter(item => item.level === 'company')
        };
    }, [items]);

    const filteredItems = useMemo(
        () => {
            let result = Array.isArray(items) ? items : [];

            // Filter by active tab
            if (activeTab === 'my') {
                result = result.filter(item => item.level === 'person');
            } else if (activeTab === 'department') {
                result = result.filter(item => item.level === 'unit');
            } else if (activeTab === 'company') {
                result = result.filter(item => item.level === 'company');
            }

            // Get filters cho tab hiện tại
            const currentFilters = activeTab === 'my' ? myFilters : 
                                 activeTab === 'department' ? departmentFilters : 
                                 companyFilters;

            // Apply filters riêng cho từng tab
            if (currentFilters.cycle) {
                result = result.filter(item => 
                    String(item.cycle_id) === String(currentFilters.cycle)
                );
            }

            if (currentFilters.department) {
                result = result.filter(item => 
                    String(item.department_id) === String(currentFilters.department)
                );
            }

            if (currentFilters.myOKROnly && currentUser) {
                result = result.filter(item => 
                    String(item.user_id) === String(currentUser.user_id || currentUser.id)
                );
            }

            // No sorting as requested; keep server order
            return result;
        },
        [items, activeTab, myFilters, departmentFilters, companyFilters, currentUser]
    );

    const sortedItems = useMemo(() => {
        const now = new Date();
        // Tính tổng tiến độ của tất cả OKR
        const totalProgress = filteredItems.reduce((sum, item) => {
            if (!item.key_results || item.key_results.length === 0) return sum;
            const itemProgress = item.key_results.reduce((krSum, kr) => {
                const percentage = kr.progress_percent !== null && kr.progress_percent !== undefined
                    ? parseFloat(kr.progress_percent)
                    : (kr.target_value > 0 ? (parseFloat(kr.current_value || 0) / parseFloat(kr.target_value)) * 100 : 0);
                return krSum + percentage;
            }, 0) / item.key_results.length;
            return sum + itemProgress;
        }, 0);
        const overallAvgProgress = filteredItems.length > 0 ? totalProgress / filteredItems.length : 0;

        // Sort by created_at descending (newest first) và thêm thông tin deadline
        return [...filteredItems].map(item => {
            // Tính overall progress cho item này (tỷ lệ % chung)
            let itemOverallProgress = 0;
            if (item.key_results && item.key_results.length > 0) {
                const itemProgress = item.key_results.reduce((krSum, kr) => {
                    const percentage = kr.progress_percent !== null && kr.progress_percent !== undefined
                        ? parseFloat(kr.progress_percent)
                        : (kr.target_value > 0 ? (parseFloat(kr.current_value || 0) / parseFloat(kr.target_value)) * 100 : 0);
                    return krSum + percentage;
                }, 0);
                itemOverallProgress = itemProgress / item.key_results.length;
            }

            // Kiểm tra quá hạn và tính deadline, priority dựa trên cycle end_date
            let isOverdue = false;
            let isUpcoming = false; // Sắp hết hạn (còn <= 7 ngày)
            let deadlineCharacter = '-';
            let priority = 'low'; // Mặc định là thấp

            if (item.cycle && item.cycle.end_date) {
                const endDate = new Date(item.cycle.end_date);
                isOverdue = endDate < now;
                
                // Format ngày hết hạn
                deadlineCharacter = endDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                // Tính mức độ ưu tiên và trạng thái dựa trên thời gian còn lại
                const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                
                if (isOverdue) {
                    priority = 'high'; // Quá hạn = ưu tiên cao
                } else if (daysRemaining <= 7 && daysRemaining > 0) {
                    priority = 'high'; // Còn <= 7 ngày = ưu tiên cao
                    isUpcoming = true; // Sắp hết hạn
                } else if (daysRemaining <= 30) {
                    priority = 'medium'; // Còn <= 30 ngày = ưu tiên trung bình
                } else {
                    priority = 'low'; // Còn > 30 ngày = ưu tiên thấp
                }
            }

            return {
                ...item,
                deadlineCharacter,
                isOverdue,
                isUpcoming,
                priority
            };
        }).sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA; // Descending order
        });
    }, [filteredItems]);


    const handleCheckInSuccess = (keyResultData) => {
        if (keyResultData && keyResultData.kr_id) {
            // Cập nhật Key Result trong danh sách
            setItems((prev) =>
                prev.map((obj) => ({
                    ...obj,
                    key_results: (obj.key_results || []).map((kr) =>
                        kr.kr_id === keyResultData.kr_id ? { ...kr, ...keyResultData } : kr
                    ),
                }))
            );
        }
        
        // Hiển thị thông báo thành công
        setToast({
            type: "success",
            message: keyResultData?.progress_percent >= 100 
                ? "🎉 Chúc mừng! Key Result đã hoàn thành 100%."
                : "✅ Cập nhật tiến độ thành công!",
        });
        
        // Reload data để đảm bảo đồng bộ
        load(page, cycleFilter, myOKRFilter);
    };

    const openCheckInModal = (keyResult) => {
        console.log('Opening check-in modal for:', keyResult);
        console.log('Objective ID:', keyResult?.objective_id);
        setCheckInModal({ open: true, keyResult });
    };

    const openCheckInHistory = (keyResult) => {
        console.log('Opening check-in history for:', keyResult);
        console.log('Objective ID:', keyResult?.objective_id);
        setCheckInHistory({ open: true, keyResult });
    };

    // Tính toán dữ liệu cho pie chart
    // Tính toán dữ liệu cho chart dựa trên filteredItems
    useEffect(() => {
        if (filteredItems.length > 0) {
            const total = filteredItems.length;
            
            // Tính toán các trạng thái dựa trên progress của Key Results
            const completed = filteredItems.filter(item => {
                if (!item.key_results || item.key_results.length === 0) return false;
                return item.key_results.every(kr => parseFloat(kr.progress_percent || 0) >= 100);
            }).length;
            
            const inProgress = filteredItems.filter(item => {
                if (!item.key_results || item.key_results.length === 0) return false;
                const hasProgress = item.key_results.some(kr => parseFloat(kr.progress_percent || 0) > 0);
                const notCompleted = item.key_results.some(kr => parseFloat(kr.progress_percent || 0) < 100);
                return hasProgress && notCompleted;
            }).length;
            
            const draft = filteredItems.filter(item => {
                if (!item.key_results || item.key_results.length === 0) return true;
                return item.key_results.every(kr => parseFloat(kr.progress_percent || 0) === 0);
            }).length;
            
            const closed = Math.max(0, total - completed - inProgress - draft);

            setPieChartData([
                { label: "mục tiêu", value: inProgress, color: "#8b5cf6" },
                { label: "đã hoàn thành", value: completed, color: "#ec4899" },
                { label: "đã đóng", value: closed, color: "#06b6d4" },
                { label: "thực tế", value: draft, color: "#f59e0b" }
            ]);
        } else {
            setPieChartData([]);
        }
    }, [filteredItems]);

    return (
        <div className="min-h-screen bg-white">
            <ToastComponent
                type={toast.type}
                message={toast.message}
                onClose={() => setToast((prev) => ({ ...prev, message: "" }))}
            />
            
            {/* Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                {/* Dashboard Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard OKR</h1>
                    <p className="text-gray-600 mt-2">Theo dõi và quản lý các mục tiêu của bạn</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'my'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            My OKR ({myOKRs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('department')}
                            className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'department'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            OKR Phòng ban ({departmentOKRs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('company')}
                            className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'company'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            OKR Công ty ({companyOKRs.length})
                        </button>
                    </div>
                </div>

                {/* Filter Dropdown */}
                {getCurrentFilters().showFilters && (
                    <div className="relative mb-6">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Chu Kỳ</label>
                                    <select
                                        value={getCurrentFilters().cycle}
                                        onChange={(e) => setCurrentFilters({...getCurrentFilters(), cycle: e.target.value})}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Tất Cả Chu Kỳ --</option>
                                        {cyclesList.map((cycle) => (
                                            <option key={cycle.cycle_id} value={cycle.cycle_id}>
                                                {cycle.cycle_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phòng Ban</label>
                                    <select
                                        value={getCurrentFilters().department}
                                        onChange={(e) => setCurrentFilters({...getCurrentFilters(), department: e.target.value})}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Tất Cả Phòng Ban --</option>
                                        {departments.map((dept) => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.d_name || dept.department_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={() => {
                                            setCurrentFilters({
                                                ...getCurrentFilters(),
                                                cycle: '',
                                                department: '',
                                                myOKROnly: false
                                            });
                                        }}
                                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                                    >
                                        Đặt Lại
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex items-center">
                                <input
                                    type="checkbox"
                                    id="myOKR"
                                    checked={getCurrentFilters().myOKROnly}
                                    onChange={(e) => setCurrentFilters({...getCurrentFilters(), myOKROnly: e.target.checked})}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="myOKR" className="ml-2 text-sm text-gray-700">
                                    Chỉ Hiển Thị OKR Của Tôi
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Section based on Active Tab */}
                <OKRStats 
                    title={
                        activeTab === 'my' ? 'My OKR' : 
                        activeTab === 'department' ? 'OKR Phòng Ban' : 
                        'OKR Công Ty'
                    }
                    items={filteredItems}
                    onFilterClick={() => setCurrentFilters({...getCurrentFilters(), showFilters: !getCurrentFilters().showFilters})}
                    showFilters={getCurrentFilters().showFilters}
                />

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-800">{error}</span>
                            <button 
                                onClick={() => {
                                    setError(null);
                                    const filters = getCurrentFilters();
                                    load(page, filters.cycle, filters.myOKROnly);
                                }}
                                className="ml-auto text-red-600 hover:text-red-800 underline"
                            >
                                Thử Lại
                            </button>
                        </div>
                    </div>
                )}

                {/* Bar Chart Section */}
                {pieChartData.length > 0 && !error && filteredItems.length > 0 && (
                    <div className="mb-6">
                        <OKRBarChart 
                            okrData={pieChartData}
                        />
                    </div>
                )}
                {filteredItems.length === 0 && !error && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
                        <div className="text-center text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">Không Có Dữ Liệu Để Hiển Thị</p>
                            <p className="text-sm mt-1">
                                {activeTab === 'my' && 'Chưa Có OKR Cá Nhân Nào. Hãy Tạo OKR Đầu Tiên Của Bạn!'}
                                {activeTab === 'department' && 'Chưa Có OKR Phòng Ban Nào.'}
                                {activeTab === 'company' && 'Chưa Có OKR Công Ty Nào.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* OKR Table */}
                <OKRTable 
                    items={sortedItems}
                    departments={departments}
                    cyclesList={cyclesList}
                    loading={loading}
                    onViewOKR={(item) => {
                        // Navigate to objective detail page or open modal
                        console.log('View OKR:', item);
                        // You can implement navigation here
                    }}
                    onCheckIn={openCheckInModal}
                    onViewCheckInHistory={openCheckInHistory}
                    currentUser={currentUser}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300 hover:bg-blue-700 transition-colors"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-slate-600 flex items-center px-4">
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300 hover:bg-blue-700 transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
            {editingKR && (
                <KeyResultModal
                    editingKR={editingKR}
                    departments={departments}
                    cyclesList={cyclesList}
                    setEditingKR={setEditingKR}
                    setItems={setItems}
                    setToast={setToast}
                    reloadData={() => {
                        const filters = getCurrentFilters();
                        load(page, filters.cycle, filters.myOKROnly);
                    }}
                />
            )}
            {creatingFor && (
                <KeyResultModal
                    creatingFor={creatingFor}
                    departments={departments}
                    cyclesList={cyclesList}
                    setCreatingFor={setCreatingFor}
                    setItems={setItems}
                    setToast={setToast}
                    reloadData={() => {
                        const filters = getCurrentFilters();
                        load(page, filters.cycle, filters.myOKROnly);
                    }}
                />
            )}
            {creatingObjective && (
                <ObjectiveModal
                    creatingObjective={creatingObjective}
                    setCreatingObjective={setCreatingObjective}
                    departments={departments}
                    cyclesList={cyclesList}
                    setItems={setItems}
                    setToast={setToast}
                    reloadData={() => {
                        // Reset all filters when creating new objective to ensure it shows
                        setCurrentFilters({
                            cycle: "",
                            department: "",
                            myOKROnly: false,
                            showFilters: getCurrentFilters().showFilters
                        });
                        load(1, "", false); // Reload with no filters
                    }}
                />
            )}
            {editingObjective && (
                <ObjectiveModal
                    editingObjective={editingObjective}
                    setEditingObjective={setEditingObjective}
                    departments={departments}
                    cyclesList={cyclesList}
                    setItems={setItems}
                    setToast={setToast}
                    setLinks={setLinks}
                    reloadData={() => {
                        const filters = getCurrentFilters();
                        load(page, filters.cycle, filters.myOKROnly);
                    }}
                />
            )}

            {/* Check-in Modal */}
            <ErrorBoundary>
                <CheckInModal
                    open={checkInModal.open}
                    onClose={() => setCheckInModal({ open: false, keyResult: null })}
                    keyResult={checkInModal.keyResult}
                    objectiveId={checkInModal.keyResult?.objective_id}
                    onSuccess={handleCheckInSuccess}
                />
            </ErrorBoundary>

            {/* Check-in History Modal */}
            <ErrorBoundary>
                <CheckInHistory
                    open={checkInHistory.open}
                    onClose={() => setCheckInHistory({ open: false, keyResult: null })}
                    keyResult={checkInHistory.keyResult}
                    objectiveId={checkInHistory.keyResult?.objective_id}
                    onSuccess={handleCheckInSuccess}
                />
            </ErrorBoundary>

        </div>
    );
}

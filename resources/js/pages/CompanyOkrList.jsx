// src/components/CompanyOkrList.jsx
import React, { useState, useEffect, useCallback } from "react";
import { CycleDropdown } from "../components/Dropdown";
import ToastNotification from "../components/ToastNotification";
import ObjectiveList from "./ObjectiveList"; // Corrected import
import ObjectiveModal from "./ObjectiveModal.jsx"; // Import ObjectiveModal
import KeyResultModal from "./KeyResultModal.jsx"; // Import KeyResultModal
import CheckInModal from "../components/CheckInModal";
import CheckInHistory from "../components/CheckInHistory";
import LinkOkrModal from "../components/LinkOkrModal.jsx";
import LinkRequestsPanel from "../components/LinkRequestsPanel";
import ErrorBoundary from "../components/ErrorBoundary";

const pickRelation = (link, camel, snake) =>
    (link && link[camel]) || (link && link[snake]) || null;

const normalizeLinkData = (link) => {
    if (!link || typeof link !== "object") return link;
    return {
        ...link,
        sourceObjective: pickRelation(link, "sourceObjective", "source_objective"),
        sourceKr: pickRelation(link, "sourceKr", "source_kr"),
        targetObjective: pickRelation(link, "targetObjective", "target_objective"),
        targetKr: pickRelation(link, "targetKr", "target_kr"),
        requester: pickRelation(link, "requester", "requester"),
        targetOwner: pickRelation(link, "targetOwner", "target_owner"),
        approver: pickRelation(link, "approver", "approver"),
    };
};

const normalizeLinksList = (list) =>
    Array.isArray(list) ? list.map((item) => normalizeLinkData(item)) : [];


export default function CompanyOkrList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [cycleFilter, setCycleFilter] = useState(null);
    const [openObj, setOpenObj] = useState({});
    const [cyclesList, setCyclesList] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [childLinks, setChildLinks] = useState([]);
    const [linksLoading, setLinksLoading] = useState(false);
    const [creatingObjective, setCreatingObjective] = useState(false); // New state
    const [editingObjective, setEditingObjective] = useState(null);
    const [editingKR, setEditingKR] = useState(null);
    const [creatingFor, setCreatingFor] = useState(null);
    const [checkInModal, setCheckInModal] = useState({ open: false, keyResult: null });
    const [checkInHistory, setCheckInHistory] = useState({ open: false, keyResult: null });
    const [linkModal, setLinkModal] = useState({
        open: false,
        source: null,
        sourceType: "objective",
    });
    const [links, setLinks] = useState([]);
    const [incomingLinks, setIncomingLinks] = useState([]);

    // New state for advanced filtering
    const [filterType, setFilterType] = useState('company'); // 'company' or 'department'
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [departments, setDepartments] = useState([]);

    const isCeo = currentUser?.role?.role_name?.toLowerCase() === 'ceo'; // Determine if current user is CEO

    // Fetch initial data (user, cycles, departments)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [userRes, cyclesRes, deptsRes] = await Promise.all([
                    fetch("/api/profile"),
                    fetch("/cycles", { headers: { Accept: "application/json" } }),
                    fetch("/departments", { headers: { Accept: "application/json" } }),
                ]);

                if (userRes.ok) {
                    const userJson = await userRes.json();
                    setCurrentUser(userJson.user);
                }

                if (cyclesRes.ok) {
                    const cyclesJson = await cyclesRes.json();
                    const cycles = cyclesJson.data || [];
                    setCyclesList(cycles);
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    let selectedCycle = cycles.find(c => {
                        const start = c.start_date ? new Date(c.start_date) : null;
                        const end = c.end_date ? new Date(c.end_date) : null;
                        return start && end && today >= start && today <= end;
                    });
                    
                    if (!selectedCycle && cycles.length > 0) {
                        selectedCycle = cycles[0];
                    }
                    setCycleFilter(selectedCycle?.cycle_id || null);
                }
                
                if (deptsRes.ok) {
                    const deptsJson = await deptsRes.json();
                    setDepartments(deptsJson.data || []);
                }

                // An toàn tuyệt đối
                if (selectedCycle?.cycle_id) {
                    setCycleFilter(selectedCycle.cycle_id);
                } else if (cycles[0]?.cycle_id) {
                    setCycleFilter(cycles[0].cycle_id);
                    setToast({
                        type: "warning",
                        message: "Không tìm thấy quý phù hợp. Vui lòng chọn quý thủ công.",
                    });
                } else {
                    setLoading(false);
                }

            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setToast({ type: "error", message: "Không thể tải dữ liệu ban đầu." });
            }
        };
        fetchInitialData();
    }, []);

    // Fetch OKR data when filters change
    const fetchData = useCallback(async () => {
        if (cycleFilter === null) return;
        
        setLoading(true);
        setLinksLoading(true);
        try {
            const params = new URLSearchParams({ 
                cycle_id: cycleFilter,
                filter_type: filterType 
            });
            if (filterType === 'department' && selectedDepartment) {
                params.append('department_id', selectedDepartment);
            }
            
            const linkParams = new URLSearchParams({ cycle_id: cycleFilter });

            const [okrRes, linksRes] = await Promise.all([
                fetch(`/company-okrs?${params}`, { headers: { Accept: "application/json" } }),
                fetch(`/api/links?${linkParams}`, { headers: { Accept: "application/json" } })
            ]);

            if (okrRes.ok) {
                const okrJson = await okrRes.json();
                if (okrJson.success) {
                    setItems(okrJson.data.objectives.data || []);
                } else {
                    throw new Error(okrJson.message || "Không tải được OKR");
                }
            } else {
                 throw new Error("Lỗi mạng khi tải OKR");
            }


            if (linksRes.ok) {
                const linksJson = await linksRes.json();
                if (linksJson.success) {
                    setChildLinks(normalizeLinksList(linksJson.data?.children || []));
                    setLinks(normalizeLinksList(linksJson.data?.outgoing || []));
                    setIncomingLinks(normalizeLinksList(linksJson.data?.incoming || []));
                }
            }

        } catch (err) {
            setToast({ type: "error", message: err.message });
            setItems([]);
            setChildLinks([]);
        } finally {
            setLoading(false);
            setLinksLoading(false);
        }
    }, [cycleFilter, filterType, selectedDepartment]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (type, value) => {
        if (type === 'company') {
            setFilterType('company');
            setSelectedDepartment('');
        } else if (type === 'department') {
            setFilterType('department');
            setSelectedDepartment(value);
        }
    };

    const openCheckInModal = (keyResult) => {
        setCheckInModal({ open: true, keyResult });
    };

    const openCheckInHistory = (keyResult) => {
        setCheckInHistory({ open: true, keyResult });
    };

    const handleOpenLinkModal = (payload) => {
        setLinkModal({
            open: true,
            source: payload.source,
            sourceType: payload.sourceType,
        });
    };

    const closeLinkModal = () => {
        setLinkModal({
            open: false,
            source: null,
            sourceType: "objective",
        });
    };

    const performLinkAction = useCallback(
        async (linkId, action, payload = {}, fallbackMessage = "Đã cập nhật trạng thái liên kết") => {
            try {
                const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
                if (!token) throw new Error("CSRF token not found");

                const res = await fetch(`/my-links/${linkId}/${action}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": token,
                        Accept: "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                const json = await res.json();
                if (!res.ok || !json.success) {
                    throw new Error(json.message || `Hành động ${action} thất bại`);
                }
                
                setToast({ type: "success", message: json.message || fallbackMessage });
                fetchData(); // Reload data on success

            } catch (err) {
                setToast({ type: "error", message: err.message });
            }
        },
        [fetchData]
    );

    const handleCancelLink = (linkId, reason = "", keepOwnership = true) =>
        performLinkAction(linkId, "cancel", { reason, keep_ownership: keepOwnership }, "Đã hủy liên kết");

    const handleApproveLink = (linkId, note = "") =>
        performLinkAction(linkId, "approve", { note }, "Đã chấp thuận yêu cầu");

    const handleRejectLink = (linkId, note) =>
        performLinkAction(linkId, "reject", { note }, "Đã từ chối yêu cầu");
    
    const handleRequestChanges = (linkId, note) =>
        performLinkAction(linkId, "request-changes", { note }, "Đã yêu cầu chỉnh sửa");

    const handleCheckInSuccess = (responseData) => {
        const updatedObjective = responseData.objective;

        if (!updatedObjective) return;

        setItems(prevItems => {
            return prevItems.map(objective => {
                if (objective.objective_id === updatedObjective.objective_id) {
                    return updatedObjective; // Replace the old objective with the new one
                }
                return objective;
            });
        });

        setToast({ type: 'success', message: 'Đã cập nhật tiến độ thành công!' });
    };

    const handleLinkRequestSuccess = (link) => {
        setToast({ type: "success", message: "Đã gửi yêu cầu liên kết" });
        fetchData();
    };

    return (
        <div className="mx-auto w-full max-w-6xl mt-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Cycle Filter Dropdown */}
                    <CycleDropdown
                        cyclesList={cyclesList}
                        cycleFilter={cycleFilter}
                        handleCycleChange={setCycleFilter}
                        dropdownOpen={dropdownOpen}
                        setDropdownOpen={setDropdownOpen}
                    />
                    {/* OKR Filter Dropdown */}
                    <div className="relative">
                        <select 
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={filterType === 'company' ? 'company' : selectedDepartment}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'company') {
                                    handleFilterChange('company');
                                } else {
                                    handleFilterChange('department', val);
                                }
                            }}
                        >
                            <option value="company">Công ty</option>
                            {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                    {dept.d_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {isCeo && (
                    <button
                        onClick={() => setCreatingObjective(true)}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Tạo Objective
                    </button>
                )}
            </div>
            
            <ObjectiveList
                items={items}
                loading={loading || linksLoading}
                openObj={openObj}
                setOpenObj={setOpenObj}
                currentUser={currentUser}
                setItems={setItems}
                childLinks={childLinks}
                linksLoading={linksLoading}
                setCreatingFor={setCreatingFor}
                setEditingObjective={setEditingObjective}
                setEditingKR={setEditingKR}
                setCreatingObjective={setCreatingObjective}
                openCheckInModal={openCheckInModal}
                openCheckInHistory={openCheckInHistory}
                onOpenLinkModal={handleOpenLinkModal}
                onCancelLink={handleCancelLink}
                hideFilters={true}
                reloadData={fetchData}
                links={links}
            />

            {/* Modals for CEO actions */}
            {creatingObjective && (
                <ObjectiveModal
                    creatingObjective={creatingObjective}
                    setCreatingObjective={setCreatingObjective}
                    departments={departments}
                    cyclesList={cyclesList}
                    setItems={setItems}
                    setToast={setToast}
                    reloadData={fetchData}
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
                    reloadData={fetchData}
                />
            )}
            {editingKR && (
                <KeyResultModal
                    editingKR={editingKR}
                    setEditingKR={setEditingKR}
                    departments={departments}
                    cyclesList={cyclesList}
                    setItems={setItems}
                    setToast={setToast}
                />
            )}
            {creatingFor && (
                <KeyResultModal
                    creatingFor={creatingFor}
                    setCreatingFor={setCreatingFor}
                    departments={departments}
                    cyclesList={cyclesList}
                    setItems={setItems}
                    setToast={setToast}
                    currentUser={currentUser}
                />
            )}

            <LinkRequestsPanel
                incoming={incomingLinks}
                children={childLinks}
                loading={linksLoading}
                onApprove={handleApproveLink}
                onReject={handleRejectLink}
                onRequestChanges={handleRequestChanges}
                onCancel={handleCancelLink}
            />

            <ErrorBoundary>
                <CheckInModal
                    open={checkInModal.open}
                    onClose={() => setCheckInModal({ open: false, keyResult: null })}
                    keyResult={checkInModal.keyResult}
                    objectiveId={checkInModal.keyResult?.objective_id}
                    onSuccess={handleCheckInSuccess}
                />
            </ErrorBoundary>

            <ErrorBoundary>
                <CheckInHistory
                    open={checkInHistory.open}
                    onClose={() => setCheckInHistory({ open: false, keyResult: null })}
                    keyResult={checkInHistory.keyResult}
                    objectiveId={checkInHistory.keyResult?.objective_id}
                />
            </ErrorBoundary>

            {linkModal.open && (
                <LinkOkrModal
                    open={linkModal.open}
                    onClose={closeLinkModal}
                    source={linkModal.source}
                    sourceType={linkModal.sourceType}
                    onSuccess={handleLinkRequestSuccess}
                />
            )}

            <ToastNotification toast={toast} />
        </div>
    );
}

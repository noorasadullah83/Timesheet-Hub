import React, { useState, useMemo, useCallback } from 'react';
import { Status, User, Project, Activity, ActivityMainType, Role, Environment } from '../types';
import { useTimesheetData } from '../hooks/useTimesheetData';
import { exportToCSV } from '../services/exportService';
import { generateTimesheetSummary, getDeploymentCostEstimation, CostEstimatorData, getProjectManagementInsights, InsightResult } from '../services/geminiService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PasswordResetModal from '../components/PasswordResetModal';
import ConfirmationModal from '../components/ConfirmationModal';
import UserFormModal from '../components/UserFormModal';
import ProjectFormModal from '../components/ProjectFormModal';
import ActivityFormModal from '../components/ActivityFormModal';
import DeploymentCostEstimatorModal from '../components/DeploymentCostEstimatorModal';
import ProjectManagementAssistantModal from '../components/ProjectManagementAssistantModal';


const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 rounded-full bg-primary-100 text-primary-600 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </Card>
);

interface AdminDashboardProps {
    currentUser: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
    const { 
        timesheetEntries, users, projects, activities, getUserById, updateUserPassword,
        addUser, updateUser, deleteUser,
        addProject, updateProject, deleteProject,
        addActivity, updateActivity, deleteActivity,
        currentEnvironment, resetStagingData
    } = useTimesheetData();
    
    // State for modals and selections
    const [modalState, setModalState] = useState({
        isSummaryOpen: false,
        isPasswordOpen: false,
        isUserFormOpen: false,
        isProjectFormOpen: false,
        isActivityFormOpen: false,
        isDeleteConfirmOpen: false,
        isResetConfirmOpen: false,
        isCostEstimatorOpen: false,
        isAssistantOpen: false,
    });
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: string, id: number | string, name: string } | null>(null);

    const [filters, setFilters] = useState({
        department: '',
        userId: '',
        status: '',
        startDate: '',
        endDate: '',
    });
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [isCostLoading, setIsCostLoading] = useState(false);
    const [costResult, setCostResult] = useState('');
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [assistantResult, setAssistantResult] = useState<InsightResult | null>(null);

    const primaryAdminId = useMemo(() => {
        const adminUsers = users.filter(u => u.role === Role.ADMIN);
        if (adminUsers.length === 0) return null;
        // Find admin with the smallest ID to act as the primary, un-deletable admin
        return adminUsers.reduce((min, u) => u.id < min.id ? u : min).id;
    }, [users]);

    // Filtered entries for main timesheet view
    const filteredEntries = useMemo(() => {
        return timesheetEntries.filter(entry => {
            const user = getUserById(entry.userId);
            if (filters.department && user?.department !== filters.department) return false;
            if (filters.userId && entry.userId !== parseInt(filters.userId)) return false;
            if (filters.status && entry.status !== filters.status) return false;
            if (filters.startDate && entry.date < filters.startDate) return false;
            if (filters.endDate && entry.date > filters.endDate) return false;
            return true;
        });
    }, [timesheetEntries, filters, getUserById]);
    
    const analytics = useMemo(() => ({
        total: filteredEntries.length,
        approved: filteredEntries.filter(e => e.status === Status.APPROVED).length,
        pending: filteredEntries.filter(e => e.status === Status.PENDING).length,
        rejected: filteredEntries.filter(e => e.status === Status.REJECTED).length,
    }), [filteredEntries]);

    // Handlers
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        setSummary('');
        const result = await generateTimesheetSummary(filteredEntries, users, projects);
        setSummary(result);
        setIsSummaryLoading(false);
        setModalState(s => ({ ...s, isSummaryOpen: true }));
    }, [filteredEntries, users, projects]);

    const handleGetCostEstimation = useCallback(async (data: CostEstimatorData) => {
        setIsCostLoading(true);
        setCostResult('');
        const result = await getDeploymentCostEstimation(data);
        setCostResult(result);
        setIsCostLoading(false);
    }, []);

    const handleGetInsights = useCallback(async (prompt: string) => {
        setIsAssistantLoading(true);
        setAssistantResult(null);
        const result = await getProjectManagementInsights(prompt);
        setAssistantResult(result);
        setIsAssistantLoading(false);
    }, []);

    const handleExport = () => exportToCSV(filteredEntries, users, projects);

    const openModal = (modalName: keyof typeof modalState, state = true) => {
        setModalState(s => ({ ...s, [modalName]: state }));
    };

    const handleOpenPasswordModal = (user: User) => {
        setSelectedUser(user);
        openModal('isPasswordOpen');
    };

    const handlePasswordReset = (password: string) => {
        if (selectedUser) {
            updateUserPassword(selectedUser.id, password);
            alert(`Password for ${selectedUser.name} has been updated.`);
            openModal('isPasswordOpen', false);
        }
    };
    
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        openModal('isUserFormOpen');
    };

    const handleAddUser = () => {
        setSelectedUser(null);
        openModal('isUserFormOpen');
    };

    const handleSaveUser = (user: Omit<User, 'id'> | User) => {
        if ('id' in user) {
            updateUser(user);
        } else {
            addUser(user);
        }
        openModal('isUserFormOpen', false);
    };

    const handleEditProject = (project: Project) => {
        setSelectedProject(project);
        openModal('isProjectFormOpen');
    };
    
    const handleAddProject = () => {
        setSelectedProject(null);
        openModal('isProjectFormOpen');
    };

    const handleSaveProject = (project: Project) => {
        if (projects.some(p => p.id === project.id && p.id !== selectedProject?.id)) {
            alert("Project ID must be unique.");
            return;
        }
        if (selectedProject) {
            updateProject(project);
        } else {
            addProject(project);
        }
        openModal('isProjectFormOpen', false);
    };

    const handleEditActivity = (activity: Activity) => {
        setSelectedActivity(activity);
        openModal('isActivityFormOpen');
    };
    
    const handleAddActivity = () => {
        setSelectedActivity(null);
        openModal('isActivityFormOpen');
    };

    const handleSaveActivity = (activity: Omit<Activity, 'id'> | Activity) => {
        if ('id' in activity) {
            updateActivity(activity);
        } else {
            addActivity(activity);
        }
        openModal('isActivityFormOpen', false);
    };

    const handleDeleteRequest = (type: string, id: number | string, name: string) => {
        setItemToDelete({ type, id, name });
        openModal('isDeleteConfirmOpen');
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        switch (itemToDelete.type) {
            case 'user':
                deleteUser(itemToDelete.id as number);
                break;
            case 'project':
                deleteProject(itemToDelete.id as string);
                break;
            case 'activity':
                deleteActivity(itemToDelete.id as number);
                break;
        }
        openModal('isDeleteConfirmOpen', false);
        setItemToDelete(null);
    };

    const handleResetStaging = () => {
        resetStagingData();
        openModal('isResetConfirmOpen', false);
    }
    

    const uniqueDepartments = [...new Set(users.map(u => u.department))];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                 <h2 className="text-3xl font-bold text-slate-900">Administrator Dashboard</h2>
                 {currentEnvironment === Environment.STAGING && (
                    <Button variant="danger" onClick={() => openModal('isResetConfirmOpen')}>
                        Reset Staging Data
                    </Button>
                )}
            </div>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Entries" value={analytics.total} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
                <StatCard title="Approved" value={analytics.approved} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Pending" value={analytics.pending} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <StatCard title="Rejected" value={analytics.rejected} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            {/* Timesheet Entries */}
            <Card>
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-slate-800">All Timesheet Entries</h3>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleGenerateSummary} isLoading={isSummaryLoading}>Generate AI Summary</Button>
                        <Button onClick={() => openModal('isAssistantOpen')} variant="secondary">Project Mgmt. Assistant</Button>
                        <Button onClick={() => openModal('isCostEstimatorOpen')} variant="secondary">Cost Estimator</Button>
                        <Button onClick={handleExport} variant="secondary">Export to CSV</Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-slate-100/70 rounded-xl border border-slate-200/80">
                    <select name="department" value={filters.department} onChange={handleFilterChange} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm">
                        <option value="">All Departments</option>
                        {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                     <select name="userId" value={filters.userId} onChange={handleFilterChange} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm">
                        <option value="">All Employees</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                     <select name="status" value={filters.status} onChange={handleFilterChange} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm">
                        <option value="">All Statuses</option>
                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm" placeholder="Start Date" />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm" placeholder="End Date" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                         <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hours</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredEntries.map(entry => {
                                const user = getUserById(entry.userId);
                                return (
                                <tr key={entry.id} className="even:bg-slate-50/60">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.activity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.hours}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.status}</td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">User Management</h3>
                        <Button onClick={handleAddUser}>Add User</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {users.map(user => {
                                    const isPrimaryAdmin = user.id === primaryAdminId;
                                    const isSelf = user.id === currentUser.id;
                                    return (
                                    <tr key={user.id} className="even:bg-slate-50/60">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                                            <Button variant="secondary" onClick={() => handleEditUser(user)} disabled={isSelf}>Edit</Button>
                                            <Button variant="secondary" onClick={() => handleOpenPasswordModal(user)}>Password</Button>
                                            {!isPrimaryAdmin && !isSelf && <Button variant="danger" onClick={() => handleDeleteRequest('user', user.id, user.name)}>Delete</Button>}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Project Management */}
                 <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Project Management</h3>
                        <Button onClick={handleAddProject}>Add Project</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {projects.map(project => (
                                    <tr key={project.id} className="even:bg-slate-50/60">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{project.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{project.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Button variant="secondary" onClick={() => handleEditProject(project)}>Edit</Button>
                                            <Button variant="danger" onClick={() => handleDeleteRequest('project', project.id, project.name)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            
            {/* Activity Management */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Activity Management</h3>
                    <Button onClick={handleAddActivity}>Add Activity</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {activities.map(activity => (
                                <tr key={activity.id} className="even:bg-slate-50/60">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{activity.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{activity.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <Button variant="secondary" onClick={() => handleEditActivity(activity)}>Edit</Button>
                                        <Button variant="danger" onClick={() => handleDeleteRequest('activity', activity.id, activity.name)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>


            {/* Modals */}
            <Modal isOpen={modalState.isSummaryOpen} onClose={() => openModal('isSummaryOpen', false)} title="AI-Generated Summary">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: summary.replace(/\n/g, '<br />')}}></div>
                <div className="mt-6 text-right">
                    <Button onClick={() => openModal('isSummaryOpen', false)}>Close</Button>
                </div>
            </Modal>

            <ProjectManagementAssistantModal
                isOpen={modalState.isAssistantOpen}
                onClose={() => {
                    openModal('isAssistantOpen', false);
                    setAssistantResult(null);
                }}
                onSubmit={handleGetInsights}
                isLoading={isAssistantLoading}
                result={assistantResult}
            />

            <DeploymentCostEstimatorModal
                isOpen={modalState.isCostEstimatorOpen}
                onClose={() => {
                    openModal('isCostEstimatorOpen', false);
                    setCostResult('');
                }}
                onSubmit={handleGetCostEstimation}
                isLoading={isCostLoading}
                result={costResult}
            />

            {selectedUser && <PasswordResetModal isOpen={modalState.isPasswordOpen} onClose={() => openModal('isPasswordOpen', false)} user={selectedUser} onSave={handlePasswordReset}/>}
            {modalState.isUserFormOpen && <UserFormModal isOpen={modalState.isUserFormOpen} onClose={() => openModal('isUserFormOpen', false)} onSave={handleSaveUser} existingUser={selectedUser} users={users} currentUser={currentUser} />}
            {modalState.isProjectFormOpen && <ProjectFormModal isOpen={modalState.isProjectFormOpen} onClose={() => openModal('isProjectFormOpen', false)} onSave={handleSaveProject} existingProject={selectedProject} />}
            {modalState.isActivityFormOpen && <ActivityFormModal isOpen={modalState.isActivityFormOpen} onClose={() => openModal('isActivityFormOpen', false)} onSave={handleSaveActivity} existingActivity={selectedActivity} />}
            {itemToDelete && <ConfirmationModal isOpen={modalState.isDeleteConfirmOpen} onClose={() => openModal('isDeleteConfirmOpen', false)} onConfirm={confirmDelete} itemName={itemToDelete.name} />}
            <ConfirmationModal 
                isOpen={modalState.isResetConfirmOpen}
                onClose={() => openModal('isResetConfirmOpen', false)}
                onConfirm={handleResetStaging}
                itemName="all Staging data"
                title="Confirm Staging Reset"
                message="Are you sure you want to reset all data in the Staging environment? All changes will be lost and data will be restored to its default state."
             />
        </div>
    );
};

export default AdminDashboard;
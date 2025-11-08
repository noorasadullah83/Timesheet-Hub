import React, { useState, useMemo } from 'react';
import { User, TimesheetEntry, Status } from '../types';
import { useTimesheetData } from '../hooks/useTimesheetData';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface ManagerDashboardProps {
    currentUser: User;
}

interface DailySubmission {
    userId: number;
    date: string;
    entries: TimesheetEntry[];
    totalHours: number;
    status: Status;
}

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
    const colorClasses = {
        [Status.PENDING]: 'bg-amber-100 text-amber-800',
        [Status.APPROVED]: 'bg-green-100 text-green-800',
        [Status.REJECTED]: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2.5 py-1 inline-flex text-[11px] leading-4 font-semibold rounded-full ${colorClasses[status]}`}>
            {status}
        </span>
    );
};

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ currentUser }) => {
    const { timesheetEntries, updateSubmissionStatus, users, getUserById } = useTimesheetData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<DailySubmission | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [comments, setComments] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [expandedSubmissionKey, setExpandedSubmissionKey] = useState<string | null>(null);


    const teamMemberIds = useMemo(() => {
        return users.filter(u => u.managerId === currentUser.id).map(u => u.id);
    }, [users, currentUser.id]);

    const allTeamSubmissions = useMemo(() => {
        const submissionsMap = timesheetEntries
            .filter(entry => teamMemberIds.includes(entry.userId))
            .reduce((acc, entry) => {
                const key = `${entry.userId}-${entry.date}`;
                if (!acc[key]) {
                    acc[key] = {
                        userId: entry.userId,
                        date: entry.date,
                        entries: [],
                        totalHours: 0,
                        status: Status.APPROVED, // Default status
                    };
                }
                acc[key].entries.push(entry);
                acc[key].totalHours += entry.hours;
                return acc;
            }, {} as Record<string, DailySubmission>);

        // Determine overall status for each day
        Object.values(submissionsMap).forEach(submission => {
            if (submission.entries.some(e => e.status === Status.REJECTED)) {
                submission.status = Status.REJECTED;
            } else if (submission.entries.some(e => e.status === Status.PENDING)) {
                submission.status = Status.PENDING;
            }
        });

        return Object.values(submissionsMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [timesheetEntries, teamMemberIds]);

    const pendingSubmissions = useMemo(() => allTeamSubmissions.filter(s => s.status === Status.PENDING), [allTeamSubmissions]);
    const historicalSubmissions = useMemo(() => allTeamSubmissions.filter(s => s.status !== Status.PENDING), [allTeamSubmissions]);

    const openModal = (submission: DailySubmission, type: 'approve' | 'reject') => {
        setSelectedSubmission(submission);
        setActionType(type);
        setComments('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubmission(null);
        setActionType(null);
    };

    const handleAction = () => {
        if (!selectedSubmission || !actionType) return;

        if (actionType === 'reject' && !comments.trim()) {
            alert('Comments are required for rejection.');
            return;
        }

        const newStatus = actionType === 'approve' ? Status.APPROVED : Status.REJECTED;
        const entryIds = selectedSubmission.entries.map(e => e.id);
        updateSubmissionStatus(entryIds, newStatus, comments);
        closeModal();
    };

    const toggleExpand = (submissionKey: string) => {
        setExpandedSubmissionKey(prev => (prev === submissionKey ? null : submissionKey));
    };

    const employeeForSubmission = selectedSubmission ? getUserById(selectedSubmission.userId) : null;
    const submissionsToShow = activeTab === 'pending' ? pendingSubmissions : historicalSubmissions;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-900">Team Submissions</h2>
            
            <Card>
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`${
                                activeTab === 'pending'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
                        >
                            Pending Approvals
                             {pendingSubmissions.length > 0 && <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{pendingSubmissions.length}</span>}
                        </button>
                        <button
                             onClick={() => setActiveTab('history')}
                            className={`${
                                activeTab === 'history'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Submission History
                        </button>
                    </nav>
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full">
                        <thead className="bg-white">
                            <tr>
                                <th className="w-10"></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Hours</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    {activeTab === 'pending' ? 'Actions' : 'Status'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                             {submissionsToShow.length > 0 ? submissionsToShow.map(submission => {
                                 const employee = getUserById(submission.userId);
                                 const submissionKey = `${submission.userId}-${submission.date}`;
                                 const isExpanded = expandedSubmissionKey === submissionKey;
                                 const rejectionComment = submission.status === Status.REJECTED ? submission.entries.find(e => e.managerComments)?.managerComments : null;

                                 return (
                                     <React.Fragment key={submissionKey}>
                                         <tr className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(submissionKey)}>
                                             <td className="px-3 py-4 text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{employee?.name || 'Unknown'}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{submission.date}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{submission.totalHours}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {activeTab === 'pending' ? (
                                                    <div className="space-x-2" onClick={e => e.stopPropagation()}>
                                                        <Button variant="secondary" onClick={() => openModal(submission, 'approve')} className="!font-semibold bg-green-100 text-green-800 hover:bg-green-200">Approve</Button>
                                                        <Button variant="secondary" onClick={() => openModal(submission, 'reject')} className="!font-semibold bg-red-100 text-red-800 hover:bg-red-200">Reject</Button>
                                                    </div>
                                                ) : <StatusBadge status={submission.status} />}
                                             </td>
                                         </tr>
                                         {isExpanded && (
                                             <tr className="bg-slate-50">
                                                 <td colSpan={5} className="p-4">
                                                    <h4 className="font-semibold text-sm mb-2 text-slate-700">Details for {submission.date}:</h4>
                                                    <table className="w-full text-sm">
                                                        <tbody>
                                                            {submission.entries.map(entry => (
                                                                <tr key={entry.id} className="border-b last:border-b-0 border-slate-200">
                                                                    <td className="py-2 pr-2 font-medium text-slate-800 w-2/3">{entry.activity} {entry.projectId && <span className="text-slate-500 font-normal">({entry.projectId})</span>}</td>
                                                                    <td className="py-2 pl-2 text-right text-slate-600">{entry.hours} hrs</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {rejectionComment && (
                                                        <div className="mt-3 p-2 text-xs italic bg-red-50 text-red-700 border border-red-200 rounded-md">
                                                            <strong>Rejection Reason:</strong> {rejectionComment}
                                                        </div>
                                                    )}
                                                 </td>
                                             </tr>
                                         )}
                                     </React.Fragment>
                                 );
                             }) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        {activeTab === 'pending' ? 'No pending submissions from your team.' : 'No historical submissions found.'}
                                    </td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={`Review Submission for ${employeeForSubmission?.name}`}>
                {selectedSubmission && (
                    <div>
                        <div className="mb-4">
                            <p className="font-semibold">{employeeForSubmission?.name} - {selectedSubmission.date}</p>
                            <p className="text-sm text-slate-500">Total Hours: {selectedSubmission.totalHours}</p>
                        </div>
                         <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                             <table className="w-full text-sm">
                                <tbody>
                                    {selectedSubmission.entries.map(entry => (
                                        <tr key={entry.id} className="border-b last:border-b-0">
                                            <td className="py-2 pr-2 font-medium text-slate-800">{entry.activity} {entry.projectId && <span className="text-slate-500 font-normal">({entry.projectId})</span>}</td>
                                            <td className="py-2 pl-2 text-right text-slate-600">{entry.hours} hrs</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>

                        {actionType === 'reject' && (
                            <div className="mt-4">
                                <label htmlFor="comments" className="block text-sm font-medium text-slate-700">Comments (Required for rejection)</label>
                                <textarea
                                    id="comments"
                                    rows={3}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                ></textarea>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button 
                                variant={actionType === 'approve' ? 'primary' : 'danger'} 
                                onClick={handleAction}
                            >
                                Confirm {actionType?.charAt(0).toUpperCase() + actionType?.slice(1)} All
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManagerDashboard;
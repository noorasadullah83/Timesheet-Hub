

import React, { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { User, ActivityMainType, TimesheetEntry, Status } from '../types';
import { useTimesheetData } from '../hooks/useTimesheetData';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';

interface EmployeeDashboardProps {
    currentUser: User;
}

interface ActivityRow {
    key: number;
    activityType: ActivityMainType;
    activity: string;
    projectId: string;
    hours: string;
}

interface DailySubmission {
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


const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ currentUser }) => {
    const { timesheetEntries, addDailyTimesheet, projects, activities, getUserById } = useTimesheetData();
    
    const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [activityRows, setActivityRows] = useState<ActivityRow[]>([{
        key: 1,
        activityType: ActivityMainType.EXTERNAL,
        activity: 'Project',
        projectId: projects[0]?.id || '',
        hours: '',
    }]);
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

    const userTimesheets = useMemo(() => {
        return timesheetEntries.filter(entry => entry.userId === currentUser.id);
    }, [timesheetEntries, currentUser.id]);

    const dailySubmissions = useMemo(() => {
        // FIX: Added generic type `Record<string, DailySubmission>` to the reduce function to fix type inference issues.
        const grouped = userTimesheets.reduce<Record<string, DailySubmission>>((acc, entry) => {
            if (!acc[entry.date]) {
                acc[entry.date] = {
                    date: entry.date,
                    entries: [],
                    totalHours: 0,
                    status: Status.APPROVED, // Default, will be updated below
                };
            }
            acc[entry.date].entries.push(entry);
            acc[entry.date].totalHours += entry.hours;
            return acc;
        }, {});

        // Determine overall status for each day
        Object.values(grouped).forEach(submission => {
            if (submission.entries.some(e => e.status === Status.REJECTED)) {
                submission.status = Status.REJECTED;
            } else if (submission.entries.some(e => e.status === Status.PENDING)) {
                submission.status = Status.PENDING;
            }
        });

        return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [userTimesheets]);


    const handleAddRow = () => {
        if (activityRows.length < 10) {
            setActivityRows(prev => [...prev, {
                key: Date.now(),
                activityType: ActivityMainType.EXTERNAL,
                activity: activities.find(a => a.type === ActivityMainType.EXTERNAL)?.name || '',
                projectId: projects[0]?.id || '',
                hours: '',
            }]);
        }
    };

    const handleRemoveRow = (index: number) => {
        if (activityRows.length > 1) {
            setActivityRows(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleRowChange = (index: number, field: keyof Omit<ActivityRow, 'key'>, value: string) => {
        const newRows = [...activityRows];
        const updatedRow = { ...newRows[index], [field]: value };

        if (field === 'activityType') {
            const defaultActivity = activities.find(a => a.type === value as ActivityMainType);
            updatedRow.activity = defaultActivity?.name || '';
        }
        
        newRows[index] = updatedRow;
        setActivityRows(newRows);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        const totalHours = activityRows.reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
        if (totalHours <= 0) {
            alert('Total hours must be greater than zero.');
            return;
        }
        if (totalHours > 24) {
            alert('Total hours for a single day cannot exceed 24.');
            return;
        }

        const entriesToSubmit = activityRows.map(row => {
            const hours = parseFloat(row.hours);
            if (isNaN(hours) || hours <= 0) return null;

            const activityDetails = activities.find(a => a.name === row.activity);
            if (!activityDetails) return null;

            return {
                userId: currentUser.id,
                date: submissionDate,
                activity: row.activity,
                activityType: activityDetails.type,
                projectId: activityDetails.type === ActivityMainType.EXTERNAL ? row.projectId : undefined,
                hours: hours,
            };
        }).filter(Boolean) as Omit<TimesheetEntry, 'id' | 'status'>[];

        if (entriesToSubmit.length !== activityRows.length) {
            alert('Please ensure all activity rows are filled out correctly.');
            return;
        }

        addDailyTimesheet(entriesToSubmit);

        // Reset form
        setActivityRows([{
            key: 1, activityType: ActivityMainType.EXTERNAL, activity: 'Project',
            projectId: projects[0]?.id || '', hours: '',
        }]);
    };
    
    const totalHours = useMemo(() => activityRows.reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0), [activityRows]);
    
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-900">Welcome, {currentUser.name}!</h2>
            
            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-slate-800">Submit Daily Timesheet</h3>
                        <div className="flex items-center gap-4">
                            {/* FIX: Used the Input component correctly by passing the `label` prop instead of a separate <label> element. */}
                            <Input label="Date" id="date" type="date" name="date" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {activityRows.map((row, index) => {
                            const filteredActivities = activities.filter(a => a.type === row.activityType);
                            return (
                                <div key={row.key} className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-lg border">
                                    <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                        <Select label="Activity Type" id={`activityType-${index}`} name="activityType" value={row.activityType} onChange={e => handleRowChange(index, 'activityType', e.target.value)}>
                                            <option value={ActivityMainType.EXTERNAL}>External</option>
                                            <option value={ActivityMainType.INTERNAL}>Internal</option>
                                        </Select>
                                    </div>
                                    <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                        <Select label="Activity" id={`activity-${index}`} name="activity" value={row.activity} onChange={e => handleRowChange(index, 'activity', e.target.value)}>
                                            {filteredActivities.map(act => <option key={act.id} value={act.name}>{act.name}</option>)}
                                        </Select>
                                    </div>
                                    <div className="col-span-12 sm:col-span-6 md:col-span-3">
                                        {row.activityType === ActivityMainType.EXTERNAL && (
                                            <Select label="Project/CRM ID" id={`projectId-${index}`} name="projectId" value={row.projectId} onChange={e => handleRowChange(index, 'projectId', e.target.value)}>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                                            </Select>
                                        )}
                                    </div>
                                     <div className="col-span-8 sm:col-span-4 md:col-span-2">
                                        <Input label="Hours" id={`hours-${index}`} type="number" name="hours" value={row.hours} onChange={e => handleRowChange(index, 'hours', e.target.value)} min="0.5" max="24" step="0.5" required placeholder="e.g. 8" />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2 md:col-span-1 text-right">
                                        <Button type="button" variant="danger" onClick={() => handleRemoveRow(index)} disabled={activityRows.length <= 1} className="!px-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                        <Button type="button" variant="secondary" onClick={handleAddRow} disabled={activityRows.length >= 10}>Add Activity</Button>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-sm font-medium text-slate-500">Total Hours: </span>
                                <span className="text-lg font-bold text-slate-800">{totalHours}</span>
                            </div>
                            <Button type="submit">Submit Timesheet</Button>
                        </div>
                    </div>
                </form>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4 text-slate-800">My Submissions</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10"></th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Hours</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                             {dailySubmissions.length > 0 ? dailySubmissions.map(sub => (
                                <React.Fragment key={sub.date}>
                                    <tr 
                                        className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => setExpandedSubmission(prev => prev === sub.date ? null : sub.date)}
                                    >
                                        <td className="px-6 py-4 text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedSubmission === sub.date ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sub.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{sub.totalHours}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={sub.status} /></td>
                                    </tr>
                                    {expandedSubmission === sub.date && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={4} className="p-0">
                                                <div className="p-4">
                                                    <h4 className="font-semibold text-sm mb-2 text-slate-700">Details for {sub.date}:</h4>
                                                    <ul className="divide-y divide-slate-200">
                                                        {sub.entries.map(entry => (
                                                             <li key={entry.id} className="py-2 grid grid-cols-4 gap-4 text-sm">
                                                                <span className="col-span-2 text-slate-800 font-medium">{entry.activity} {entry.projectId && `(${entry.projectId})`}</span>
                                                                <span className="text-slate-600">{entry.hours} hours</span>
                                                                <span className="italic text-slate-500">{entry.managerComments || ''}</span>
                                                             </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                             )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">No submissions found.</td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EmployeeDashboard;
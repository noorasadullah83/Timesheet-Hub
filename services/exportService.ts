
import { TimesheetEntry, User, Project } from '../types';

export const exportToCSV = (
    entries: TimesheetEntry[], 
    users: User[], 
    projects: Project[]
) => {
    const userMap = new Map(users.map(u => [u.id, u]));
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    const headers = [
        'Entry ID',
        'Employee Name',
        'Department',
        'Date',
        'Activity Type',
        'Activity',
        'Project Name',
        'Hours',
        'Status',
        'Manager Comments',
    ];

    const rows = entries.map(entry => {
        const user = userMap.get(entry.userId);
        return [
            entry.id,
            user?.name || 'Unknown',
            user?.department || 'Unknown',
            entry.date,
            entry.activityType,
            entry.activity,
            entry.projectId ? projectMap.get(entry.projectId) : 'N/A',
            entry.hours,
            entry.status,
            `"${entry.managerComments || ''}"`,
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'timesheet_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

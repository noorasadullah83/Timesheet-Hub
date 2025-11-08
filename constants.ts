import { Role, User, Project, Activity, TimesheetEntry, Status, ActivityMainType } from './types';

export const USERS: User[] = [
    { id: 1, name: 'Alice Smith', role: Role.EMPLOYEE, department: 'Engineering', managerId: 3, password: 'password' },
    { id: 2, name: 'Bob Johnson', role: Role.EMPLOYEE, department: 'Engineering', managerId: 3, password: 'password' },
    { id: 3, name: 'Charlie Brown', role: Role.MANAGER, department: 'Engineering', password: 'password' },
    { id: 4, name: 'Diana Prince', role: Role.EMPLOYEE, department: 'Design', managerId: 5, password: 'password' },
    { id: 5, name: 'Ethan Hunt', role: Role.MANAGER, department: 'Design', password: 'password' },
    { id: 6, name: 'Frank Castle', role: Role.ADMIN, department: 'Administration', password: 'password' },
];

export const PROJECTS: Project[] = [
    { id: 'PROJ-001', name: 'Phoenix Project' },
    { id: 'PROJ-002', name: 'Omega Initiative' },
    { id: 'CRM-101', name: 'Pre-Sales Alpha' },
];

export const ACTIVITIES: Activity[] = [
    { id: 1, name: 'Imparting Training', type: ActivityMainType.INTERNAL },
    { id: 2, name: 'Receiving Training', type: ActivityMainType.INTERNAL },
    { id: 3, name: 'Vendor Meet', type: ActivityMainType.INTERNAL },
    { id: 4, name: 'HR Activities', type: ActivityMainType.INTERNAL },
    { id: 5, name: 'Leave', type: ActivityMainType.INTERNAL },
    { id: 6, name: 'Holiday', type: ActivityMainType.INTERNAL },
    { id: 7, name: 'Self Learning', type: ActivityMainType.INTERNAL },
    { id: 8, name: 'Idle Time', type: ActivityMainType.INTERNAL },
    { id: 9, name: 'Product Development', type: ActivityMainType.INTERNAL },
    { id: 10, name: 'Project', type: ActivityMainType.EXTERNAL },
    { id: 11, name: 'Vendor Meet', type: ActivityMainType.EXTERNAL },
    { id: 12, name: 'Pre Sales', type: ActivityMainType.EXTERNAL },
];

export const INITIAL_TIMESHEET_ENTRIES: TimesheetEntry[] = [
    {
        id: 1,
        userId: 1,
        date: '2025-11-04',
        activity: 'Project',
        activityType: ActivityMainType.EXTERNAL,
        projectId: 'PROJ-001',
        hours: 8,
        status: Status.APPROVED,
    },
    {
        id: 2,
        userId: 2,
        date: '2025-11-04',
        activity: 'Project',
        activityType: ActivityMainType.EXTERNAL,
        projectId: 'PROJ-001',
        hours: 6,
        status: Status.PENDING,
    },
    {
        id: 3,
        userId: 2,
        date: '2025-11-04',
        activity: 'Self Learning',
        activityType: ActivityMainType.INTERNAL,
        hours: 2,
        status: Status.PENDING,
    },
    {
        id: 4,
        userId: 1,
        date: '2025-11-05',
        activity: 'Project',
        activityType: ActivityMainType.EXTERNAL,
        projectId: 'PROJ-002',
        hours: 4,
        status: Status.REJECTED,
        managerComments: 'Hours seem too high for this task. Please verify.',
    },
     {
        id: 5,
        userId: 4,
        date: '2025-11-05',
        activity: 'Project',
        activityType: ActivityMainType.EXTERNAL,
        projectId: 'PROJ-002',
        hours: 8,
        status: Status.PENDING,
    },
];
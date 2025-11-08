
export enum Role {
    EMPLOYEE = 'Employee',
    MANAGER = 'Manager',
    ADMIN = 'Admin',
}

export enum Status {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum ActivityMainType {
    INTERNAL = 'Internal',
    EXTERNAL = 'External',
}

export enum Environment {
    LIVE = 'Live',
    STAGING = 'Staging',
}

export interface User {
    id: number;
    name: string;
    role: Role;
    department: string;
    password?: string; // For authentication
    managerId?: number;
}

export interface Project {
    id: string;
    name: string;
}

export interface Activity {
    id: number;
    name: string;
    type: ActivityMainType;
}

export interface TimesheetEntry {
    id: number;
    userId: number;
    date: string; // YYYY-MM-DD
    activity: string;
    activityType: ActivityMainType;
    projectId?: string;
    hours: number;
    status: Status;
    managerComments?: string;
}

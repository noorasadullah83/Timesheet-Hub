import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { TimesheetEntry, User, Project, Status, Activity, Environment } from '../types';
import { INITIAL_TIMESHEET_ENTRIES, USERS, PROJECTS, ACTIVITIES } from '../constants';

interface AppData {
    users: User[];
    projects: Project[];
    activities: Activity[];
    timesheetEntries: TimesheetEntry[];
}

interface DataContextType extends AppData {
    currentEnvironment: Environment | null;
    setCurrentEnvironment: (env: Environment | null) => void;
    resetStagingData: () => void;
    addDailyTimesheet: (entries: Omit<TimesheetEntry, 'id' | 'status'>[]) => void;
    updateSubmissionStatus: (entryIds: number[], status: Status, comments?: string) => void;
    getUserById: (id: number) => User | undefined;
    updateUserPassword: (userId: number, newPassword: string) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: number) => void;
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    deleteProject: (projectId: string) => void;
    addActivity: (activity: Omit<Activity, 'id'>) => void;
    updateActivity: (activity: Activity) => void;
    deleteActivity: (activityId: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialData: AppData = {
    users: USERS,
    projects: PROJECTS,
    activities: ACTIVITIES,
    timesheetEntries: INITIAL_TIMESHEET_ENTRIES,
};

const getStorageKey = (env: Environment) => `timesheet_app_data_${env.toLowerCase()}`;

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentEnvironment, _setCurrentEnvironment] = useState<Environment | null>(() => {
        return localStorage.getItem('timesheet_app_environment') as Environment | null;
    });
    
    const [data, setData] = useState<AppData>(initialData);

    useEffect(() => {
        if (currentEnvironment) {
            const storageKey = getStorageKey(currentEnvironment);
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                setData(JSON.parse(savedData));
            } else {
                setData(initialData);
                localStorage.setItem(storageKey, JSON.stringify(initialData));
            }
        }
    }, [currentEnvironment]);
    
    useEffect(() => {
        if (currentEnvironment) {
            const storageKey = getStorageKey(currentEnvironment);
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    }, [data, currentEnvironment]);

    const setCurrentEnvironment = (env: Environment | null) => {
        if (env) {
            localStorage.setItem('timesheet_app_environment', env);
        } else {
            localStorage.removeItem('timesheet_app_environment');
        }
        _setCurrentEnvironment(env);
    };

    const resetStagingData = useCallback(() => {
        if (currentEnvironment === Environment.STAGING) {
            const storageKey = getStorageKey(Environment.STAGING);
            localStorage.setItem(storageKey, JSON.stringify(initialData));
            setData(initialData);
            alert('Staging data has been reset to defaults.');
        }
    }, [currentEnvironment]);

    const addDailyTimesheet = useCallback((entries: Omit<TimesheetEntry, 'id' | 'status'>[]) => {
        setData(prev => {
            const newEntries = entries.map((entry, index) => ({
                ...entry,
                id: Date.now() + index, // Ensure unique IDs for batch add
                status: Status.PENDING,
            }));
            return {
                ...prev,
                timesheetEntries: [...prev.timesheetEntries, ...newEntries],
            };
        });
    }, []);

    const updateSubmissionStatus = useCallback((entryIds: number[], status: Status, comments?: string) => {
        setData(prev => ({
            ...prev,
            timesheetEntries: prev.timesheetEntries.map(entry =>
                entryIds.includes(entry.id) ? { ...entry, status, managerComments: comments } : entry
            ),
        }));
    }, []);

    const getUserById = useCallback((id: number) => data.users.find(u => u.id === id), [data.users]);

    const updateUserPassword = useCallback((userId: number, newPassword: string) => {
        setData(prev => ({
            ...prev,
            users: prev.users.map(user =>
                user.id === userId ? { ...user, password: newPassword } : user
            ),
        }));
    }, []);

    const addUser = useCallback((user: Omit<User, 'id'>) => {
        setData(prev => ({
            ...prev,
            users: [...prev.users, { ...user, id: Date.now(), password: 'password' }],
        }));
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setData(prev => ({
            ...prev,
            users: prev.users.map(user => (user.id === updatedUser.id ? updatedUser : user)),
        }));
    }, []);

    const deleteUser = useCallback((userId: number) => {
        setData(prev => ({
            ...prev,
            users: prev.users.filter(user => user.id !== userId),
            timesheetEntries: prev.timesheetEntries.filter(entry => entry.userId !== userId),
        }));
    }, []);

    const addProject = useCallback((project: Project) => {
        setData(prev => ({ ...prev, projects: [...prev.projects, project] }));
    }, []);

    const updateProject = useCallback((updatedProject: Project) => {
        setData(prev => ({
            ...prev,
            projects: prev.projects.map(p => (p.id === updatedProject.id ? updatedProject : p)),
        }));
    }, []);

    const deleteProject = useCallback((projectId: string) => {
        setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== projectId) }));
    }, []);
    
    const addActivity = useCallback((activity: Omit<Activity, 'id'>) => {
        setData(prev => ({
            ...prev,
            activities: [...prev.activities, { ...activity, id: Date.now() }],
        }));
    }, []);

    const updateActivity = useCallback((updatedActivity: Activity) => {
        setData(prev => ({
            ...prev,
            activities: prev.activities.map(a => (a.id === updatedActivity.id ? updatedActivity : a)),
        }));
    }, []);

    const deleteActivity = useCallback((activityId: number) => {
        setData(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== activityId) }));
    }, []);

    const value: DataContextType = {
        ...data,
        currentEnvironment,
        setCurrentEnvironment,
        resetStagingData,
        addDailyTimesheet,
        updateSubmissionStatus,
        getUserById,
        updateUserPassword,
        addUser,
        updateUser,
        deleteUser,
        addProject,
        updateProject,
        deleteProject,
        addActivity,
        updateActivity,
        deleteActivity,
    };

    return React.createElement(DataContext.Provider, { value }, children);
};

export const useTimesheetData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useTimesheetData must be used within a DataProvider');
    }
    return context;
};

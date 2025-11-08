import React, { useState } from 'react';
import Header from './components/Header';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import { useTimesheetData, DataProvider } from './hooks/useTimesheetData';
import { Role, User, Environment } from './types';
import Card from './components/Card';
import Button from './components/Button';
import Logo from './components/Logo';


const EnvironmentSelector: React.FC<{ onSelect: (env: Environment) => void }> = ({ onSelect }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full text-center">
                 <div className="flex flex-col justify-center items-center space-y-4 mb-6">
                    <Logo className="h-14 w-14" />
                    <h1 className="text-3xl font-bold text-slate-800 text-center">
                        TSPL Timesheet Portal
                    </h1>
                </div>
                <Card>
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">Select Your Environment</h2>
                    <p className="text-slate-500 mb-6">Choose an environment to proceed. Your data is isolated between them.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button className="w-full" onClick={() => onSelect(Environment.LIVE)}>
                            Go to Live
                        </Button>
                        <Button className="w-full" variant="secondary" onClick={() => onSelect(Environment.STAGING)}>
                            Go to Staging (Test)
                        </Button>
                    </div>
                     <p className="text-xs text-slate-400 mt-4">
                        <b>Live:</b> Your official production data.<br/>
                        <b>Staging:</b> A safe sandbox for testing and administration.
                    </p>
                </Card>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { users, currentEnvironment, setCurrentEnvironment } = useTimesheetData();

    const handleLogin = (username: string, password: string): boolean => {
        // NOTE: In a real app, never compare plain text passwords. This is for demonstration only.
        const user = users.find(u => u.name.toLowerCase() === username.toLowerCase() && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleSwitchEnvironment = () => {
        handleLogout();
        setCurrentEnvironment(null);
    }

    if (!currentEnvironment) {
        return <EnvironmentSelector onSelect={setCurrentEnvironment} />;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }


    const renderDashboard = () => {
        switch (currentUser.role) {
            case Role.EMPLOYEE:
                return <EmployeeDashboard currentUser={currentUser} />;
            case Role.MANAGER:
                return <ManagerDashboard currentUser={currentUser} />;
            case Role.ADMIN:
                return <AdminDashboard currentUser={currentUser} />;
            default:
                return <div>Invalid Role</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <Header 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                currentEnvironment={currentEnvironment}
                onSwitchEnvironment={handleSwitchEnvironment}
            />
            <main className="p-4 sm:p-6 lg:p-8">
                {renderDashboard()}
            </main>
        </div>
    );
}


const App: React.FC = () => {
    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
};


export default App;
import React from 'react';
import { User, Environment } from '../types';
import Button from './Button';
import Logo from './Logo';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    currentEnvironment: Environment;
    onSwitchEnvironment: () => void;
}

const EnvironmentBadge: React.FC<{ env: Environment }> = ({ env }) => {
    const isLive = env === Environment.LIVE;
    const baseClasses = 'px-2.5 py-1 text-[11px] font-semibold uppercase rounded-full tracking-wider';
    const variantClasses = isLive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-amber-100 text-amber-800';
    return <span className={`${baseClasses} ${variantClasses}`}>{env}</span>;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, currentEnvironment, onSwitchEnvironment }) => {
    return (
        <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                         <Logo className="h-8 w-8" />
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                            TSPL Timesheet Portal
                        </h1>
                        <EnvironmentBadge env={currentEnvironment} />
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-slate-600 hidden sm:block text-right">
                            <span className="font-bold text-slate-800">{currentUser.name}</span>
                            <span className="text-slate-500"> ({currentUser.role})</span>
                        </div>
                        <Button onClick={onSwitchEnvironment} variant="secondary" className="hidden lg:inline-flex !px-3">Switch</Button>
                        <Button onClick={onLogout} variant="secondary">
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
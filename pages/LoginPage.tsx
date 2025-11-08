import React, { useState, FormEvent } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Logo from '../components/Logo';

interface LoginPageProps {
    onLogin: (username: string, password: string) => boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(username, password);
        if (!success) {
            setError('Invalid username or password.');
            // Clear password field on failed attempt for security
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-sm w-full">
                <div className="flex flex-col justify-center items-center space-y-4 mb-6">
                    <Logo className="h-14 w-14" />
                    <h1 className="text-3xl font-bold text-slate-800 text-center">
                        TSPL Timesheet Portal
                    </h1>
                </div>
                <Card>
                    <h2 className="text-xl font-semibold text-center text-slate-700 mb-6">Welcome Back</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Username"
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="e.g. Alice Smith"
                        />
                        <Input
                            label="Password"
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                        />
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;

import React, { useState, FormEvent, useEffect } from 'react';
import { User } from '../types';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

interface PasswordResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (password: string) => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    // Reset state when modal is opened for a new user
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        onSave(password);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reset Password for ${user.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                    label="New Password"
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
                 <Input 
                    label="Confirm New Password"
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Password</Button>
                </div>
            </form>
        </Modal>
    );
};

export default PasswordResetModal;
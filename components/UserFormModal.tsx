
import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { User, Role } from '../types';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Button from './Button';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'> | User) => void;
    existingUser: User | null;
    users: User[];
    currentUser: User;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, existingUser, users, currentUser }) => {
    const [user, setUser] = useState({
        name: '',
        role: Role.EMPLOYEE,
        department: '',
        managerId: undefined as number | undefined,
    });

    useEffect(() => {
        if (existingUser) {
            setUser({
                name: existingUser.name,
                role: existingUser.role,
                department: existingUser.department,
                managerId: existingUser.managerId,
            });
        } else {
            setUser({ name: '', role: Role.EMPLOYEE, department: '', managerId: undefined });
        }
    }, [existingUser, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setUser(prev => {
            const newState: typeof user = { ...prev, [name]: value };
            
            // When role changes, clear manager if not applicable
            if (name === 'role' && value !== Role.EMPLOYEE && value !== Role.MANAGER) {
                newState.managerId = undefined;
            }

            // Ensure managerId is a number
            if (name === 'managerId') {
                newState.managerId = value ? parseInt(value, 10) : undefined;
            }
            
            return newState;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const payload = existingUser ? { ...existingUser, ...user } : user;
        onSave(payload);
    };

    const managers = users.filter(u => u.role === Role.MANAGER && u.id !== existingUser?.id);

    const primaryAdminId = useMemo(() => {
        const adminUsers = users.filter(u => u.role === Role.ADMIN);
        if (adminUsers.length === 0) return null;
        return adminUsers.reduce((min, u) => u.id < min.id ? u : min).id;
    }, [users]);
    
    const isEditingSelf = existingUser ? existingUser.id === currentUser.id : false;
    const isEditingPrimaryAdmin = existingUser ? existingUser.id === primaryAdminId : false;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingUser ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Full Name"
                    id="name"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Department"
                    id="department"
                    name="department"
                    value={user.department}
                    onChange={handleChange}
                    required
                />
                <Select label="Role" id="role" name="role" value={user.role} onChange={handleChange} disabled={isEditingSelf || isEditingPrimaryAdmin}>
                    {Object.values(Role).map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </Select>
                {(user.role === Role.EMPLOYEE || user.role === Role.MANAGER) && (
                    <Select label="Manager" id="managerId" name="managerId" value={user.managerId || ''} onChange={handleChange}>
                        <option value="">Select a Manager (Optional)</option>
                        {managers.map(manager => (
                            <option key={manager.id} value={manager.id}>{manager.name}</option>
                        ))}
                    </Select>
                )}
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;
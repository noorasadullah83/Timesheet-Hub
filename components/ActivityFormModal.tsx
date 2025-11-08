import React, { useState, FormEvent, useEffect } from 'react';
import { Activity, ActivityMainType } from '../types';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Button from './Button';

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: Omit<Activity, 'id'> | Activity) => void;
    existingActivity: Activity | null;
}

const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose, onSave, existingActivity }) => {
    const [activity, setActivity] = useState({
        name: '',
        type: ActivityMainType.INTERNAL,
    });

    useEffect(() => {
        if (existingActivity) {
            setActivity({
                name: existingActivity.name,
                type: existingActivity.type,
            });
        } else {
            setActivity({ name: '', type: ActivityMainType.INTERNAL });
        }
    }, [existingActivity, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setActivity(prev => ({ ...prev, [name]: value as ActivityMainType }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const payload = existingActivity ? { ...existingActivity, ...activity } : activity;
        onSave(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingActivity ? 'Edit Activity' : 'Add New Activity'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Activity Name"
                    id="name"
                    name="name"
                    value={activity.name}
                    onChange={handleChange}
                    required
                />
                <Select label="Activity Type" id="type" name="type" value={activity.type} onChange={handleChange}>
                    <option value={ActivityMainType.INTERNAL}>Internal</option>
                    <option value={ActivityMainType.EXTERNAL}>External</option>
                </Select>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ActivityFormModal;
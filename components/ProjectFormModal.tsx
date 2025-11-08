import React, { useState, FormEvent, useEffect } from 'react';
import { Project } from '../types';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Project) => void;
    existingProject: Project | null;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSave, existingProject }) => {
    const [project, setProject] = useState({ id: '', name: '' });

    useEffect(() => {
        if (existingProject) {
            setProject(existingProject);
        } else {
            setProject({ id: '', name: '' });
        }
    }, [existingProject, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProject(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(project);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingProject ? 'Edit Project' : 'Add New Project'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Project Name"
                    id="name"
                    name="name"
                    value={project.name}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Project/CRM ID"
                    id="id"
                    name="id"
                    value={project.id}
                    onChange={handleChange}
                    required
                    disabled={!!existingProject}
                    placeholder="e.g. PROJ-003"
                />
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectFormModal;
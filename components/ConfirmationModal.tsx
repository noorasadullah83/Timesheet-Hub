import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    title?: string;
    message?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    title = 'Confirm Deletion',
    message,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div>
                <p className="text-sm text-slate-600 mb-4">
                    {message || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
                </p>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
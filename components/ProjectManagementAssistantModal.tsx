import React, { useState, FormEvent } from 'react';
import Modal from './Modal';
import Button from './Button';
import { InsightResult } from '../services/geminiService';

interface ProjectManagementAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
    isLoading: boolean;
    result: InsightResult | null;
}

const ProjectManagementAssistantModal: React.FC<ProjectManagementAssistantModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    result,
}) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        onSubmit(prompt);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Project Management Assistant">
            <p className="text-sm text-slate-600 mb-4">
                Ask a question to get up-to-date insights and best practices, grounded by Google Search.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    id="prompt"
                    name="prompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., What are the best practices for managing a remote engineering team?"
                    disabled={isLoading}
                />
                <div className="pt-2 flex justify-end">
                    <Button type="submit" isLoading={isLoading} disabled={!prompt.trim()}>
                        Get Insights
                    </Button>
                </div>
            </form>
            
            {(isLoading || result) && (
                 <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg max-h-[50vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : result && (
                        <>
                            <h4 className="font-semibold text-slate-800 mb-2">AI Generated Answer:</h4>
                            <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: result.text.replace(/\n/g, '<br />') }}></div>
                            
                            {result.sources && result.sources.length > 0 && (
                                <div className="mt-6">
                                    <h5 className="font-semibold text-xs text-slate-600 uppercase tracking-wider mb-2">Sources</h5>
                                    <ul className="space-y-2">
                                        {result.sources.map((source, index) => (
                                            <li key={index} className="text-sm">
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:text-primary-800 hover:underline break-all">
                                                    {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                 </div>
            )}
        </Modal>
    );
};

export default ProjectManagementAssistantModal;
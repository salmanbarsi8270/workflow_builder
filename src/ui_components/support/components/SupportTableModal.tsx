import React from 'react';
// Force refresh
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Users, X } from 'lucide-react';
import { SupportTable } from './SupportTable';

interface SupportTableModalProps {
    data: any[];
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export const SupportTableModal: React.FC<SupportTableModalProps> = ({ data, isOpen, onClose, title }) => {
    if (!isOpen) return null;

    // Use portal to render at root level to ensure it sits on top of everything
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose} 
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                        transition={{ duration: 0.2, ease: "easeOut" }} 
                        className="relative w-full max-w-5xl bg-white dark:bg-[#0c0c0c] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex gap-2 items-center">
                                <Users className="w-5 h-5 text-primary" /> 
                                {title || "Data View"}
                            </h3>
                            <button 
                                onClick={onClose} 
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-100/50 dark:bg-black/20">
                           <SupportTable data={data} title="Query Results" className="my-0 shadow-none border-0" />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-end">
                            <button 
                                onClick={onClose} 
                                className="px-4 py-2 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/20 transition-colors" 
                            >
                                Close View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

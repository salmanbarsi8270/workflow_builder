import React, { useState } from 'react';
import { Bot, AlertCircle, CheckCircle, XCircle, Users, Trash2, MessageCircleMore, ExternalLink } from 'lucide-react';
import { SupportTableModal } from './SupportTableModal';

interface SupportMessageCardProps {
    data: {
        success: boolean;
        message?: string;
        type?: string;
        users?: any[];
        operation?: string;
        error?: string;
        [key: string]: any;
    };
    timestamp?: Date;
    role?: 'user' | 'assistant';
}

export const SupportMessageCard: React.FC<SupportMessageCardProps> = ({ data, timestamp, role = 'assistant' }) => {
    const [showTableModal, setShowTableModal] = useState(false);

    // Filter out these props from UI if not needed to avoid linter warnings, 
    // or just acknowledge they are available for future extensions
    // const isRoleBot = role === 'assistant';

    const isError = data.success === false || data.type === 'error' || !!data.error;
    const isConversation = data.type === 'conversation';

    const handleViewTable = () => {
        if (data.users && Array.isArray(data.users)) {
            setShowTableModal(true);
        }
    };

    const renderContent = () => {
        // Handle error responses
        if (isError) {
            return (
                <div className="space-y-2">
                    <div className="flex items-center text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">{data.error || data.message || 'An error occurred'}</p>
                </div>
            );
        }

        // Success / Info response
        return (
            <div className="space-y-3">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                    {isConversation ? (
                        <MessageCircleMore className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    <span className={`font-medium ${isConversation ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {isConversation ? 'Response' : 'Success'}
                    </span>
                </div>

                {data.message && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {data.message}
                        {!isConversation && data.users && data.users.length > 1 && (
                             <button 
                                onClick={handleViewTable} 
                                className='inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-2 font-medium text-xs'
                                title='View Full Table'
                            >
                                <ExternalLink size={12} /> View Table
                            </button>
                        )}
                    </p>
                )}

                {/* Single user result (INSERT/UPDATE and specific SELECT) */}
                {data.users && data.users.length === 1 && data.operation !== 'DELETE' && (
                    <div className="bg-white dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-slate-200 dark:border-white/10">
                            <h4 className="font-medium text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Record</h4>
                            <Users className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="space-y-1.5 text-[13px]">
                            {Object.entries(data.users[0]).map(([key, value]) => {
                                // Skip complex objects for the simple card view
                                if (typeof value === 'object' && value !== null) return null;
                                return (
                                    <div key={key} className="flex gap-2">
                                        <span className="font-medium text-slate-500 dark:text-slate-400 min-w-[60px] capitalize">{key.replace(/_/g, ' ')}:</span>
                                        <span className="text-slate-900 dark:text-slate-100 font-medium truncate">{String(value)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Deleted user (DELETE operation) */}
                {data.operation === 'DELETE' && data.users && data.users[0] && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wide">Record Deleted</h4>
                            <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300/80">
                             {/* Try to show ID or Name if available */}
                            {data.users[0].id && <p><span className="font-medium">ID:</span> {data.users[0].id}</p>}
                            {data.users[0].email && <p><span className="font-medium">Email:</span> {data.users[0].email}</p>}
                            {data.users[0].name && <p><span className="font-medium">Name:</span> {data.users[0].name}</p>}
                            
                            {!data.users[0].id && !data.users[0].email && !data.users[0].name && (
                                <p className="italic text-xs opacity-80">1 record affected</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const getBgColor = () => {
        if (isError) return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20';
        if (isConversation) return 'bg-blue-50/50 dark:bg-blue-900/5 border-blue-200/50 dark:border-blue-500/10';
        return 'bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-200/50 dark:border-emerald-500/10';
    };

    return (
        <>
            <div className={`p-4 rounded-2xl border ${getBgColor()} shadow-xs max-w-md w-full my-2`}>
               {renderContent()}
            </div>
             {timestamp && (
                <p className="text-[10px] text-slate-400 dark:text-slate-600 px-2 mt-1">
                    {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            )}

            {showTableModal && data.users && (
                <SupportTableModal 
                    data={data.users} 
                    isOpen={showTableModal} 
                    onClose={() => setShowTableModal(false)}
                    title={data.message || "Data Results"} 
                />
            )}
        </>
    );
};

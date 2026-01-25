import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPieces } from '../ui_components/api/pieces';
import type { AppDefinition } from '../ui_components/Automation/metadata/types';

interface PieceContextType {
    pieces: AppDefinition[];
    piecesMap: Record<string, AppDefinition>;
    isLoading: boolean;
    error: string | null;
    refreshPieces: () => Promise<void>;
}

const PieceContext = createContext<PieceContextType | undefined>(undefined);

export function PieceProvider({ children }: { children: ReactNode }) {
    const [pieces, setPieces] = useState<AppDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshPieces = async () => {
        try {
            setIsLoading(true);
            const response = await getPieces();
            if (response && response.success && response.pieces) {
                // Convert the object map { [key]: definition } to array [definition, ...]
                const rawPieces = response.pieces;
                const piecesArray = Object.entries(rawPieces).map(([id, piece]: [string, any]) => {
                    const actions: any[] = [];

                    // Helper to add an action or trigger
                    const addDef = (actionId: string, def: any, type: 'action' | 'trigger') => {
                        let parameters = Array.isArray(def.parameters) ? def.parameters : [];

                        // Special case: Provide custom type and labels for Agent selection
                        if (id === 'agent' && actionId === 'runAgent') {
                            const order = ['connection', 'agentId', 'input', 'timeout'];
                            const mapped: any[] = [];

                            order.forEach(name => {
                                const p = parameters.find((param: any) => param.name === name);
                                if (p) {
                                    if (name === 'connection') mapped.push({ ...p, type: 'connection', label: 'AI SERVICE CONNECTION' });
                                    else if (name === 'agentId') mapped.push({ ...p, type: 'agent', label: 'SELECT AGENT' });
                                    else if (name === 'input') mapped.push({ ...p, label: 'USER INPUT' });
                                }
                            });

                            parameters = mapped;
                        }

                        // Special case: Condition logic - inject branches and rules
                        if (id === 'logic' && actionId === 'condition') {
                            parameters = [
                                {
                                    name: 'branches',
                                    label: 'Branches',
                                    type: 'array',
                                    description: 'Branches for different conditions (If, Else If, Else)',
                                    default: ['If', 'Else']
                                },
                                {
                                    name: 'rules',
                                    label: 'Conditions',
                                    type: 'condition-builder',
                                    description: 'Complex logical expressions for each branch'
                                }
                            ];
                        }

                        // Special case: Wait for Approval - custom instructions label and ensure all email params exist
                        if (id === 'delay' && actionId === 'waitForApproval') {
                            const expectedParams = [
                                { name: 'instructions', label: 'INSTRUCTIONS', type: 'string', required: false },
                                { name: 'enableEmailApproval', label: 'Enable Email Approval', type: 'boolean', default: false },
                                { name: 'emailRecipients', label: 'Email Recipients', type: 'string', dependsOn: { field: 'enableEmailApproval', value: true } },
                                { name: 'emailSubject', label: 'Email Subject', type: 'string', default: 'Approval Requested: {{flow_name}}', dependsOn: { field: 'enableEmailApproval', value: true } },
                                { name: 'emailProvider', label: 'Email Provider', type: 'select', default: 'gmail', dependsOn: { field: 'enableEmailApproval', value: true }, options: [{ label: 'Gmail', value: 'gmail' }, { label: 'Outlook', value: 'outlook' }, { label: 'Resend (System)', value: 'resend' }] }
                            ];

                            // Merge backend parameters with expected parameters to ensure nothing is lost
                            const mergedParams = [...expectedParams];
                            parameters.forEach((p: any) => {
                                const index = mergedParams.findIndex(ep => ep.name === p.name);
                                if (index !== -1) {
                                    mergedParams[index] = { ...p, ...mergedParams[index] }; // Frontend overrides label/UI defaults if needed
                                } else {
                                    mergedParams.push(p);
                                }
                            });
                            parameters = mergedParams;
                        }

                        // Special case: Microsoft Excel - transform fileId to dynamic-select for workbook selection
                        if ((id === 'microsoft_excel' || id === 'excel') && parameters.some((p: any) => p.name === 'fileId')) {
                            parameters = parameters.map((p: any) => {
                                if (p.name === 'fileId' && p.type === 'string') {
                                    return {
                                        ...p,
                                        type: 'dynamic-select',
                                        dynamicOptions: {
                                            action: 'listWorkbooks'
                                        }
                                    };
                                }
                                return p;
                            });
                        }

                        actions.push({
                            id: actionId,
                            name: def.label || def.name || actionId,
                            description: def.description || '',
                            type: type,
                            parameters: parameters,
                            outputSchema: def.outputSchema || []
                        });
                    };

                    // 1. Try to map from metadata (nested)
                    if (piece.metadata?.actions) {
                        Object.entries(piece.metadata.actions).forEach(([aid, val]) => addDef(aid, val, 'action'));
                    }
                    if (piece.metadata?.triggers) {
                        Object.entries(piece.metadata.triggers).forEach(([tid, val]) => addDef(tid, val, 'trigger'));
                    }

                    // 2. Fallback: If metadata is missing but actions/triggers exist as objects directly
                    if (actions.length === 0) {
                        if (piece.actions && typeof piece.actions === 'object' && !Array.isArray(piece.actions)) {
                            Object.entries(piece.actions).forEach(([aid, val]) => addDef(aid, val, 'action'));
                        }
                        if (piece.triggers && typeof piece.triggers === 'object' && !Array.isArray(piece.triggers)) {
                            Object.entries(piece.triggers).forEach(([tid, val]) => addDef(tid, val, 'trigger'));
                        }
                    }

                    return {
                        id: id,
                        name: piece.name || piece.label || id,
                        description: piece.description || `Integrations and actions for ${piece.name || id}`,
                        icon: piece.icon || piece.logo || id,
                        category: piece.category || (['utility', 'logic', 'delay', 'schedule', 'http', 'email-utils', 'data'].includes(id) ? 'utility' : (id === 'agent' ? 'agent' : 'app')),
                        actions: actions
                    } as AppDefinition;
                });

                console.log(`Loaded ${piecesArray.length} dynamic pieces from backend`);
                setPieces(piecesArray);
                setError(null);
            } else {
                console.warn('Invalid pieces response format', response);
            }
        } catch (err: any) {
            console.error('Failed to fetch pieces:', err);
            setError(err.message || 'Failed to load pieces');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshPieces();
    }, []);

    const piecesMap = pieces.reduce((acc, piece) => {
        acc[piece.id] = piece;
        return acc;
    }, {} as Record<string, AppDefinition>);

    return (
        <PieceContext.Provider value={{ pieces, piecesMap, isLoading, error, refreshPieces }}>
            {children}
        </PieceContext.Provider>
    );
}

export function usePieces() {
    const context = useContext(PieceContext);
    if (context === undefined) {
        throw new Error('usePieces must be used within a PieceProvider');
    }
    return context;
}

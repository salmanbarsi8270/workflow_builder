import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { APP_DEFINITIONS as STATIC_DEFS, type AppDefinition } from '../ui_components/Automation/metadata';

interface PieceContextType {
    pieces: AppDefinition[];
    piecesMap: Record<string, AppDefinition>;
    isLoading: boolean;
    refreshPieces: () => Promise<void>;
}

const PieceContext = createContext<PieceContextType | undefined>(undefined);

export const PieceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pieces, setPieces] = useState<AppDefinition[]>(STATIC_DEFS);
    const [piecesMap, setPiecesMap] = useState<Record<string, AppDefinition>>(() => {
        const map: Record<string, AppDefinition> = {};
        STATIC_DEFS.forEach(p => {
            map[p.id] = p;
            if (p.name) map[p.name] = p;
        });
        return map;
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchPieces = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await axios.get(`${backendUrl}/api/v1/pieces`);

            if (response.data?.success) {
                const backendPieces = response.data.pieces;

                // Transform backend pieces to AppDefinition format
                const dynamicApps: AppDefinition[] = Object.entries(backendPieces).map(([id, p]: [string, any]) => {
                    // Merge actions and triggers into a single array for the UI
                    const actions = [
                        ...Object.entries(p.metadata?.actions || {}).map(([aId, a]: [string, any]) => ({
                            id: aId,
                            name: a.label,
                            description: a.description || '',
                            type: 'action' as const,
                            parameters: a.parameters || [],
                            outputSchema: a.outputSchema || []
                        })),
                        ...Object.entries(p.metadata?.triggers || {}).map(([tId, t]: [string, any]) => ({
                            id: tId,
                            name: t.label,
                            description: t.description || '',
                            type: 'trigger' as const,
                            parameters: t.parameters || [],
                            outputSchema: t.outputSchema || []
                        }))
                    ];

                    return {
                        id,
                        name: p.name,
                        description: p.description || '',
                        icon: p.icon,
                        color: p.color,
                        category: p.category || 'app',
                        actions
                    } as AppDefinition;
                });

                // Merge with static
                const combined = [...STATIC_DEFS.filter(s => !dynamicApps.find(d => d.id === s.id)), ...dynamicApps];
                setPieces(combined);

                // Create map
                const map: Record<string, AppDefinition> = {};
                combined.forEach(p => {
                    map[p.id] = p;
                    if (p.name) map[p.name] = p;
                });
                setPiecesMap(map);
            }
        } catch (error) {
            console.error('Error fetching dynamic pieces:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPieces();
    }, []);

    return (
        <PieceContext.Provider value={{ pieces, piecesMap, isLoading, refreshPieces: fetchPieces }}>
            {children}
        </PieceContext.Provider>
    );
};

export const usePieces = () => {
    const context = useContext(PieceContext);
    if (context === undefined) {
        throw new Error('usePieces must be used within a PieceProvider');
    }
    return context;
};

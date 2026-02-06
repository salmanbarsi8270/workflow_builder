import React, { createContext, useContext } from 'react';

interface SidebarContextType {
    sidebarOpenCount: number; // 0, 1, or 2
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        // Return default value if context is not available (e.g., in isolated component testing)
        return { sidebarOpenCount: 0 };
    }
    return context;
};

interface SidebarProviderProps {
    sidebarOpenCount: number;
    children: React.ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ sidebarOpenCount, children }) => {
    return (
        <SidebarContext.Provider value={{ sidebarOpenCount }}>
            {children}
        </SidebarContext.Provider>
    );
};

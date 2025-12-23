import { createContext, useContext } from 'react';

interface AutomationContextType {
    onAddNode: (edgeId: string) => void;
}

const AutomationContext = createContext<AutomationContextType | null>(null);

export const useAutomationContext = () => {
    const context = useContext(AutomationContext);
    if (!context) {
        throw new Error("useAutomationContext must be used within an AutomationProvider");
    }
    return context;
};

export default AutomationContext;

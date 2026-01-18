import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { SidebarIconExample } from "./ui_components/Slider";
import ErrorPage from "./ui_components/ErrorPage";
import LoginPage from "./ui_components/LoginPage";
import React from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { Loader2 } from 'lucide-react';

// Page Imports
import WorkflowDashboard from './ui_components/Dashboard';
import Connectors from './ui_components/Integration';
import Automation from './ui_components/Automation';
import Connections from './ui_components/Connections';
import Templates from './ui_components/Templates';
import Agents from './ui_components/Agents';
import LiveEvals from './ui_components/Evals';
import UIDesigner from './ui_components/UIDesigner';
import { PublicChat } from './ui_components/PublicChat/PublicChat';

function UIDesignerWrapper() {
    const { user } = useUser();
    return <UIDesigner userId={user?.id || ''} />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { user, isLoading } = useUser();
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

import { PieceProvider } from './context/PieceContext';

export function App() {
    return (
        <UserProvider>
            <PieceProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />

                        {/* Protected Routes with Sidebar Layout */}
                        <Route element={<RequireAuth><SidebarIconExample /></RequireAuth>}>
                            <Route path="/" element={<WorkflowDashboard />} />
                            <Route path="/connectors" element={<Connectors />} />
                            <Route path="/connections" element={<Connections />} />
                            <Route path="/templates" element={<Templates />} />
                            <Route path="/automation" element={<Automation />} />
                            <Route path="/automation/:id" element={<Automation />} />
                            <Route path="/agents" element={<Agents />} />
                            <Route path="/evals" element={<LiveEvals />} />
                            <Route path="/ui-designer" element={<UIDesignerWrapper />} />
                        </Route>

                        <Route path="/chat/:slug" element={<PublicChat />} />

                        <Route path="*" element={<ErrorPage />} />
                    </Routes>
                </BrowserRouter>
            </PieceProvider>
        </UserProvider>
    );
}
export default App;

import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { SidebarIconExample } from "./ui_components/slider";
import ErrorPage from "./ui_components/Errorpage";
import LoginPage from "./ui_components/LoginPage";

import React from 'react';

function RequireAuth({ children }: { children: React.ReactNode }) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/" element={
                    <RequireAuth>
                        <SidebarIconExample />
                    </RequireAuth>
                } />
                <Route path="/order" element={
                    <RequireAuth>
                        <SidebarIconExample />
                    </RequireAuth>
                } />
                <Route path="/integration" element={
                    <RequireAuth>
                        <SidebarIconExample />
                    </RequireAuth>
                } />
                <Route path="/automation" element={
                    <RequireAuth>
                        <SidebarIconExample />
                    </RequireAuth>
                } />
                
                <Route path="*" element={<ErrorPage />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App;
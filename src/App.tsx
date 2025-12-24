import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { SidebarIconExample } from "./ui_components/slider";
import ErrorPage from "./ui_components/Errorpage";
import LoginPage from "./ui_components/LoginPage";

import React from 'react';

function RequireAuth({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    
    // Check for token in URL (from backend redirect)
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (token) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', token);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

import { UserProvider } from './context/UserContext';

export function App() {
    return (
        <UserProvider>
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
        </UserProvider>
    );
}
export default App;
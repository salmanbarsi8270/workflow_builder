import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SidebarIconExample } from "./ui_components/slider";
import ErrorPage from "./ui_components/Errorpage";

export function App() {
return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<SidebarIconExample />} />
            <Route path="/order" element={<SidebarIconExample />} />
            <Route path="/integration" element={<SidebarIconExample />} />
            <Route path="/automation" element={<SidebarIconExample />} />
            <Route path="*" element={<ErrorPage />} />
        </Routes>
    </BrowserRouter>
);
}

export default App;
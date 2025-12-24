import { useNavigate } from 'react-router-dom';
import { DropdownMenuItem } from '@/components/dropdown-menu';
import { LogOut } from 'lucide-react';

export default function Logout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear authentication status
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authToken');
        // Redirect to login page
        navigate('/login');
    };

    return (
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
    );
}

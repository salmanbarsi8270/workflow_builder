import { DropdownMenuItem } from '@/components/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function Logout() {
    const { logout } = useUser();

    return (
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
    );
}

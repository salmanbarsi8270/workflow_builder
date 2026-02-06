import { StatsGrid } from '../components/StatsGrid';
import { useSidebarContext } from '../../context/SidebarContext';

interface StatsGridWrapperProps {
    stats: any[];
    cols?: number;
    gap?: number;
    loading?: boolean;
    variant?: 'default' | 'gradient' | 'glass' | 'bordered';
    className?: string;
}

export const StatsGridWrapper = (props: StatsGridWrapperProps) => {
    const { sidebarOpenCount } = useSidebarContext();

    // Determine columns based on sidebar state
    // sidebarOpenCount = 2 (both open): 4 columns
    // sidebarOpenCount = 1 (one open): 3 columns
    // sidebarOpenCount = 0 (none open): 2 columns
    const responsiveCols = sidebarOpenCount === 2 ? 4 : sidebarOpenCount === 1 ? 3 : 2;

    // Use provided cols if specified, otherwise use responsive cols
    const finalCols = responsiveCols;

    return <StatsGrid {...props} cols={finalCols} />;
};

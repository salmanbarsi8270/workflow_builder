import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table as TableIcon } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { TableModal } from '@/ui_components/support/components/TableModal';
import { useSidebarContext } from '../../context/SidebarContext';
import { cn } from '@/lib/utils';

interface DataTableWrapperProps {
    title?: string;
    data?: any[];
    columns?: any[];
    className?: string;
    pageSize?: number;
    showPagination?: boolean;
    striped?: boolean;
    compact?: boolean;
    searchable?: boolean;
    onRowClick?: (row: any) => void;
    span?: string | number;
    rowSpan?: number;
    isDarkMode?: boolean;
}

export const DataTableWrapper = (props: DataTableWrapperProps) => {
    const { sidebarOpenCount } = useSidebarContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Detect dark mode from document or props
    const isDarkMode = props.isDarkMode ?? document.documentElement.classList.contains('dark');

    // When 0 or 1 sidebar is open, show button instead of table
    // When both sidebars are open (count === 2), render table directly
    if (sidebarOpenCount < 2) {
        const spanClass = props.span ? (typeof props.span === 'string' ? props.span : `col-span-${props.span}`) : 'col-span-12';
        const rowSpanClass = props.rowSpan ? `row-span-${props.rowSpan}` : '';

        return (
            <>
                <div className={cn(
                    "bg-card rounded-xl border shadow-sm overflow-hidden flex items-center justify-center p-8",
                    spanClass,
                    rowSpanClass,
                    props.className
                )}>
                    <div className="flex flex-col items-center gap-4 text-center">
                        <TableIcon className="w-12 h-12 text-primary/60" />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {props.title || 'Data Table'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {props.data?.length || 0} rows available
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="gap-2"
                            size="lg"
                        >
                            <TableIcon className="w-4 h-4" />
                            View Table
                        </Button>
                    </div>
                </div>

                <TableModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    data={props.data || []}
                    isDarkMode={isDarkMode}
                    title={props.title}
                    columns={props.columns}
                    pageSize={props.pageSize}
                    showPagination={props.showPagination}
                    striped={props.striped}
                    compact={props.compact}
                    searchable={props.searchable}
                    onRowClick={props.onRowClick}
                />
            </>
        );
    }

    // When both sidebars are open (count === 2), render table directly
    return <DataTable {...props} />;
};

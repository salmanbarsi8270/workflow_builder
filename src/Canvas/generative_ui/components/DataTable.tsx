import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown, ArrowUpDown, ChevronRight, Filter } from 'lucide-react';

export const DataTable = ({
    title,
    data = [],
    columns = [],
    className,
    pageSize = 10,
    showPagination = true,
    striped = true,
    compact = true,
    searchable = true,
    onRowClick,
    span,
    rowSpan
}: any) => {
    const spanClass = span ? (typeof span === 'string' ? span : `col-span-${span}`) : 'col-span-12';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter((row: any) =>
            columns.some((col: any) => {
                const value = row[col.key];
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return sortDirection === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }, [filteredData, sortKey, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        if (!showPagination || pageSize >= sortedData.length) return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, showPagination]);

    const TableRow = ({ row, rowIdx }: { row: any, rowIdx: number }) => (
        <tr
            key={rowIdx}
            className={cn(
                "border-b transition-colors",
                striped && rowIdx % 2 === 0 && "bg-muted/30",
                onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted",
                !onRowClick && "hover:bg-muted/30"
            )}
            onClick={() => onRowClick?.(row)}
        >
            {columns.map((col: any, colIdx: number) => (
                <td
                    key={colIdx}
                    className={cn(
                        "align-middle",
                        compact ? "p-2" : "p-3",
                        col.className
                    )}
                >
                    <div className={cn(
                        "flex items-center gap-2",
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end'
                    )}>
                        {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                        {colIdx === columns.length - 1 && onRowClick && (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 ml-auto" />
                        )}
                    </div>
                </td>
            ))}
        </tr>
    );

    return (
        <div className={cn("bg-card rounded-xl border shadow-sm overflow-hidden", spanClass, rowSpanClass, className)}>
            {/* Header */}
            {(title || searchable) && (
                <CardHeader className="px-6 py-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {title && (
                            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                        )}
                        {searchable && (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                                />
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}

            {/* Table */}
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b">
                                {columns.map((col: any, idx: number) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "text-left align-middle font-semibold text-muted-foreground whitespace-nowrap",
                                            compact ? "p-2" : "p-3",
                                            col.sortable !== false && "cursor-pointer hover:bg-muted select-none",
                                            col.headerClassName
                                        )}
                                        onClick={() => col.sortable !== false && handleSort(col.key)}
                                    >
                                        <div className={cn(
                                            "flex items-center gap-2",
                                            col.align === 'center' && 'justify-center',
                                            col.align === 'right' && 'justify-end'
                                        )}>
                                            <span className="truncate">{col.label || col.key}</span>
                                            {col.sortable !== false && (
                                                <div className="flex flex-col">
                                                    {sortKey === col.key ? (
                                                        <>
                                                            <ChevronUp className={cn(
                                                                "h-3 w-3",
                                                                sortDirection === 'asc'
                                                                    ? "text-primary"
                                                                    : "text-muted-foreground/40"
                                                            )} />
                                                            <ChevronDown className={cn(
                                                                "h-3 w-3 -mt-2",
                                                                sortDirection === 'desc'
                                                                    ? "text-primary"
                                                                    : "text-muted-foreground/40"
                                                            )} />
                                                        </>
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row: any, rowIdx: number) => (
                                    <TableRow key={rowIdx} row={row} rowIdx={rowIdx} />
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="p-8 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="text-sm">No data found</div>
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination & Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                        Showing {paginatedData.length} of {sortedData.length} results
                        {searchTerm && ` for "${searchTerm}"`}
                    </div>

                    {showPagination && totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                                    currentPage === 1
                                        ? "text-muted-foreground/40 cursor-not-allowed"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Previous
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "h-8 w-8 rounded-md text-sm transition-colors",
                                                currentPage === pageNum
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                                    currentPage === totalPages
                                        ? "text-muted-foreground/40 cursor-not-allowed"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </CardContent>
        </div>
    );
};

// Mobile-friendly list view version
export const DataTableList = (props: any) => {
    return (
        <div className="sm:hidden">
            <DataTable
                {...props}
                columns={props.columns.map((col: any) => ({
                    ...col,
                    className: cn(col.className, "max-w-[150px] truncate"),
                }))}
                compact={true}
            />
        </div>
    );
};
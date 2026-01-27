import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';

export const DataTable = ({ title, data = [], columns = [], className }: any) => {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return sortDirection === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }, [data, sortKey, sortDirection]);

    return (
        <div className={cn("w-full bg-primary/[0.01]", className)}>
            {title && (
                <CardHeader className="border-b bg-primary/[0.02]">
                    <h3 className="text-lg font-bold">{title}</h3>
                </CardHeader>
            )}
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b transition-colors">
                                {columns.map((col: any, idx: number) => (
                                    <th
                                        key={idx}
                                        className={cn(
                                            "h-12 px-4 text-left align-middle font-bold text-muted-foreground",
                                            col.sortable !== false && "cursor-pointer hover:bg-muted select-none"
                                        )}
                                        onClick={() => col.sortable !== false && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{col.label || col.key}</span>
                                            {col.sortable !== false && sortKey === col.key && (
                                                <span className="text-xs">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {sortedData.map((row: any, rowIdx: number) => (
                                <tr key={rowIdx} className="border-b transition-colors hover:bg-muted/50">
                                    {columns.map((col: any, colIdx: number) => (
                                        <td key={colIdx} className="p-4 align-middle">
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </div>
    );
};

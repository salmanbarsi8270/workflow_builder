import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table as TableIcon } from 'lucide-react';
import { DataTable } from '@/Canvas/generative_ui/components/DataTable';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  isDarkMode: boolean;
  title?: string;
  columns?: any[];
  pageSize?: number;
  showPagination?: boolean;
  striped?: boolean;
  compact?: boolean;
  searchable?: boolean;
  onRowClick?: (row: any) => void;
}

export const TableModal = ({
  isOpen,
  onClose,
  data,
  isDarkMode,
  title,
  columns,
  pageSize,
  showPagination,
  striped,
  compact,
  searchable,
  onRowClick
}: TableModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-6xl max-h-[90vh] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
        <DialogHeader>
          <DialogTitle className={`flex gap-2 items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
            <TableIcon className="w-6 h-6 text-blue-600" /> {title || 'Query Results'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-180px)]">
          <DataTable
            data={data}
            title={title || "Query Results"}
            isDarkMode={isDarkMode}
            columns={columns}
            pageSize={pageSize}
            showPagination={showPagination}
            striped={striped}
            compact={compact}
            searchable={searchable}
            onRowClick={onRowClick}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className={isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : ''}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

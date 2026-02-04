import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';

interface DataTableProps {
  data: any[];
  title?: string;
  isDarkMode?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ data, title = 'Data Table', isDarkMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (!data || data.length === 0) {
    return (
      <div className={`rounded-lg border p-6 text-center ${
        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
      }`}>
        No data available
      </div>
    );
  } 

  // Get all unique keys from the data
  const columns = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  );

  // Filter data based on search term
  const filteredData = data.filter((item) =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc' ? (aValue as any) - (bValue as any) : (bValue as any) - (aValue as any);
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const exportToCSV = () => {
    const headers = columns.join(',');
    const rows = data.map(item =>
      columns.map(col => `"${formatValue(item[col])}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className={`rounded-lg shadow-sm border my-3 max-w-full overflow-hidden ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-linear-to-r from-violet-50 to-purple-50'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{title}</h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {paginatedData.length} of {filteredData.length} items
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent w-full sm:w-48 text-sm ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className={`px-3 py-1.5 border rounded-lg transition-colors flex items-center justify-center text-sm ${
                isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full text-sm table-auto">
          <thead className={isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className={`px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column}</span>
                    <span className="text-gray-400 text-xs">{getSortIcon(column)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs mt-1">
                      {searchTerm ? 'Try adjusting your search terms' : 'No data available'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-3 max-w-[200px]">
                      <div className={`text-sm break-words ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`} title={formatValue(item[column])}>
                        {formatValue(item[column])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <div className={`px-4 py-3 border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            {/* Items per page */}
            <div className="flex items-center space-x-2">
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className={`border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>entries</span>
            </div>

            {/* Page info */}
            <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center space-x-1 mx-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-violet-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 3 && currentPage < totalPages - 1 && (
                  <span className="px-1 text-gray-500 text-xs">...</span>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

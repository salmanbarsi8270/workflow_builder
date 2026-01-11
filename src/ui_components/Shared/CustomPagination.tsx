import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

interface CustomPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  className?: string;
}

export function CustomPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className
}: CustomPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  if (totalItems === 0) return null;

  return (
    <div className={`sticky bottom-0 z-20 mx-auto w-fit pb-6 ${className || ''}`}>
      <div className="flex items-center gap-6 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-blue-500/10 px-6 py-3 transition-all duration-300 hover:shadow-blue-500/20">
        
        {/* Left */}
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-medium whitespace-nowrap">View count:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-[72px] rounded-lg border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
                  {itemsPerPage}
                  <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950">
                {[5, 10, 15, 20].map(size => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => {
                      onItemsPerPageChange(size)
                      onPageChange(1) // Reset to first page when size changes
                    }}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="font-medium border-l border-slate-200 dark:border-white/10 pl-6 h-4 flex items-center">
            Showing <span className="text-slate-900 dark:text-white font-bold mx-1">{startIndex + 1}</span> to{" "}
            <span className="text-slate-900 dark:text-white font-bold mx-1">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="text-slate-900 dark:text-white font-bold mx-1">{totalItems}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 pl-6 border-l border-slate-200 dark:border-white/10">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="h-9 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all font-semibold"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>

          <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm">
             {currentPage} <span className="text-blue-300 dark:text-blue-500/40">/</span> {totalPages}
           </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="h-9 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all font-semibold"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

      </div>
    </div>
  );
}

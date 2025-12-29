import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontal,
  TrashIcon,
  EyeIcon,
  PencilIcon
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

export interface AutomationItem {
  id: string;
  name: string;
  createdDate: string;
  status: boolean;
  nodes: any[];
  edges: any[];
}

interface AutomationListProps {
    automations: AutomationItem[];
    search: string;
    setSearch: (val: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
    onEditName: (item: AutomationItem) => void;
    onOpenEditor: (item: AutomationItem) => void;
    onCreate: () => void;
    isLoading?: boolean;
    createsutomationloading?: boolean;
}

export default function AutomationList({
    automations,
    search,
    setSearch,
    onToggleStatus,
    onDelete,
    onEditName,
    onOpenEditor,
    onCreate,
    isLoading = false,
    createsutomationloading = false
}: AutomationListProps) {
    const filteredAutomations = automations.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl font-bold">Automations</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] pl-8 md:w-[300px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="bg-violet-500 hover:bg-violet-600" onClick={onCreate}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Automation Name</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-[50px] rounded-full" /></TableCell>
                          <TableCell className="text-right flex justify-end"><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                  ))
              ) : filteredAutomations.length > 0 ? (
                  filteredAutomations.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer">
                      <TableCell onClick={() => onOpenEditor(item)} className="font-medium">{item.name}</TableCell>
                      <TableCell onClick={() => onOpenEditor(item)}>{item.createdDate}</TableCell>
                      <TableCell className="cursor-pointer">
                        <Switch className="cursor-pointer"
                            checked={item.status}
                            onCheckedChange={() => onToggleStatus(item.id, item.status)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onOpenEditor(item)}>
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View / Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditName(item)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Edit Name
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600 focus:text-red-500">
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No automations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
}

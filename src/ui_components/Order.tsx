import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, MoreHorizontal } from "lucide-react"

interface Order {
  id: string
  orderId: string
  description: string
  cargo: string
  price: string
  deliveryDate: string
  status: 'Pending' | 'Shipped' | 'Delivered'
}

const initialOrders: Order[] = [
  { id: "1", orderId: "ORD-001", description: "Electronics Components", cargo: "Fragile", price: "1,200", deliveryDate: "2024-01-15", status: "Pending" },
  { id: "2", orderId: "ORD-002", description: "Office Furniture", cargo: "Heavy", price: "3,500", deliveryDate: "2024-01-20", status: "Shipped" },
  { id: "3", orderId: "ORD-003", description: "Medical Supplies", cargo: "Urgent", price: "8,900", deliveryDate: "2024-01-10", status: "Delivered" },
  { id: "4", orderId: "ORD-004", description: "Construction Material", cargo: "Heavy", price: "12,000", deliveryDate: "2024-02-01", status: "Pending" },
  { id: "5", orderId: "ORD-005", description: "Automotive Parts", cargo: "Standard", price: "2,400", deliveryDate: "2024-01-25", status: "Shipped" },
]

export default function Order() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  const [formData, setFormData] = useState<Omit<Order, 'id'>>({
    orderId: "",
    description: "",
    cargo: "",
    price: "",
    deliveryDate: "",
    status: "Pending",
  })

  const filteredOrders = orders.filter((order) =>
    order.description.toLowerCase().includes(search.toLowerCase()) ||
    order.orderId.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenModal = (order?: Order) => {
    if (order) {
      setCurrentOrder(order)
      setFormData({
        orderId: order.orderId,
        description: order.description,
        cargo: order.cargo,
        price: order.price,
        deliveryDate: order.deliveryDate,
        status: order.status,
      })
    } else {
      setCurrentOrder(null)
      setFormData({
        orderId: `ORD-${Math.floor(Math.random() * 1000)}`,
        description: "",
        cargo: "",
        price: "",
        deliveryDate: "",
        status: "Pending",
      })
    }
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter(o => o.id !== id))
    }
  }

  const handleSave = () => {
    if (currentOrder) {
      // Edit
      setOrders(orders.map(o => o.id === currentOrder.id ? { ...o, ...formData } : o))
    } else {
      // Create
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      }
      setOrders([...orders, newOrder])
    }
    setIsModalOpen(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-2xl font-bold">Orders</CardTitle>
        <div className="flex items-center gap-2">
            <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search orders..."
                className="w-[200px] pl-8 md:w-[300px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Order
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
                        <DialogDescription>
                            {currentOrder ? "Make changes to the order details below." : "Fill in the details for the new order."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="orderId" className="text-right">Order ID</Label>
                            <Input id="orderId" name="orderId" value={formData.orderId} onChange={handleChange} className="col-span-3"  disabled />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Input id="description" name="description" value={formData.description} onChange={handleChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cargo" className="text-right">Cargo</Label>
                            <Input id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price</Label>
                            <Input id="price" name="price" value={formData.price} onChange={handleChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="deliveryDate" className="text-right">Delivery Date</Label>
                            <Input id="deliveryDate" name="deliveryDate" type="date" value={formData.deliveryDate} onChange={handleChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3">
                                <option value="Pending">Pending</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSave}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="font-sans font-bold">
              <TableHead>Order ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="font-sans text-gray-500">
                <TableCell className="font-medium">{order.orderId}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>{order.cargo}</TableCell>
                <TableCell>$ {order.price}</TableCell>
                <TableCell>{order.deliveryDate}</TableCell>
                <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.status === "Delivered" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                      order.status === "Shipped" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}>
                      {order.status}
                    </span>
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
                        <DropdownMenuItem onClick={() => handleOpenModal(order)}>
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600 focus:text-red-500">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

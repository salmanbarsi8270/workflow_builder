import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  CheckmarkCircle02Icon, 
  HourglassIcon, 
  AlertCircleIcon, 
  PlayIcon,
  PlusSignIcon
} from "@hugeicons/core-free-icons"

export default function WorkflowDashboard() {
  const stats = [
    {
      title: "Total Workflows",
      value: "12",
      description: "+2 from last week",
      icon: PlayIcon,
      color: "text-muted-foreground",
    },
    {
      title: "Successful Runs",
      value: "1,234",
      description: "+15% success rate",
      icon: CheckmarkCircle02Icon,
      color: "text-green-500",
    },
    {
      title: "Running Now",
      value: "3",
      description: "Active processes",
      icon: HourglassIcon,
      color: "text-blue-500",
    },
    {
      title: "Failed Runs",
      value: "7",
      description: "Requires attention",
      icon: AlertCircleIcon,
      color: "text-red-500",
    },
  ]

  const recentRuns = [
    { id: "1", name: "Data Sync: CRM to Sheet", status: "Success", time: "2 mins ago" },
    { id: "2", name: "New Lead Notification", status: "Running", time: "5 mins ago" },
    { id: "3", name: "Daily Report Generator", status: "Success", time: "1 hour ago" },
    { id: "4", name: "Inventory Update", status: "Failed", time: "3 hours ago" },
    { id: "5", name: "Email Campaign Trigger", status: "Success", time: "5 hours ago" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <Button>
          <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <HugeiconsIcon icon={stat.icon} className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center">
                  <div className={`ml-4 space-y-1`}>
                    <p className="text-sm font-medium leading-none">{run.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {run.time}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      run.status === "Success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                      run.status === "Running" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {run.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Adding dummy content to force scroll for testing fixed header */}
            <div className="mt-8 space-y-4">
                <p className="text-sm text-muted-foreground">More historical data...</p>
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-12 w-full rounded-md bg-muted/20 animate-pulse" />
                ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid gap-2">
                <Button variant="outline" className="w-full justify-start">Connect New App</Button>
                <Button variant="outline" className="w-full justify-start">View Logs</Button>
                <Button variant="outline" className="w-full justify-start">Manage API Keys</Button>
                <Button variant="outline" className="w-full justify-start">Documentation</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

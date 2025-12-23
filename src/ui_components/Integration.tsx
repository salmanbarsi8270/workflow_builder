import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Mail, 
  FileSpreadsheet, 
  FileText, 
  Slack, 
  HardDrive, 
  Database, 
  Trello, 
  MessageSquare, 
  Github, 
  ShoppingBag,
  ExternalLink
} from "lucide-react"

interface IntegrationApp {
  name: string
  description: string
  icon: React.ElementType
  color: string
  connected: boolean
}

const apps: IntegrationApp[] = [
  {
    name: "Gmail",
    description: "Send and receive emails, manage drafts and labels.",
    icon: Mail,
    color: "text-red-500",
    connected: true,
  },
  {
    name: "Google Sheets",
    description: "Create, read, and edit spreadsheets dynamically.",
    icon: FileSpreadsheet,
    color: "text-green-600",
    connected: false,
  },
  {
    name: "Google Forms",
    description: "Collect data and trigger workflows on form submission.",
    icon: FileText,
    color: "text-purple-600",
    connected: false,
  },
  {
    name: "Slack",
    description: "Send messages, alerts, and manage channels.",
    icon: Slack,
    color: "text-orange-500",
    connected: true,
  },
  {
    name: "Google Drive",
    description: "Upload, download, and manage files in the cloud.",
    icon: HardDrive,
    color: "text-blue-500",
    connected: false,
  },
  {
    name: "Notion",
    description: "Manage databases, pages, and content blocks.",
    icon: Database,
    color: "text-black dark:text-white",
    connected: false,
  },
  {
    name: "Trello",
    description: "Create cards, lists, and manage boards.",
    icon: Trello,
    color: "text-blue-600",
    connected: false,
  },
  {
    name: "Discord",
    description: "Post messages to channels and manage servers.",
    icon: MessageSquare,
    color: "text-indigo-500",
    connected: false,
  },
  {
    name: "GitHub",
    description: "Trigger on pushes, pull requests, and manage issues.",
    icon: Github,
    color: "text-slate-800 dark:text-slate-200",
    connected: true,
  },
  {
    name: "Shopify",
    description: "Manage orders, products, and customers.",
    icon: ShoppingBag,
    color: "text-green-500",
    connected: false,
  },
]

export default function Integration() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <Button variant="outline">
          <ExternalLink className="mr-2 h-4 w-4" />
          Request Integration
        </Button>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {apps.map((app) => (
          <Card key={app.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-muted ${app.color} bg-opacity-10`}>
                  <app.icon className={`h-6 w-6 ${app.color}`} />
                </div>
                <CardTitle className="text-lg">{app.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-sm">
                {app.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                variant={app.connected ? "outline" : "default"} 
                className="w-full"
              >
                {app.connected ? "Manage" : "Connect"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

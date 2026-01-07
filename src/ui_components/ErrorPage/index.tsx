
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, Home } from "lucide-react"

export default function ErrorPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-destructive/10 p-6 animate-bounce">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          404 - Page Not Found
        </h1>
        <p className="max-w-[500px] text-muted-foreground text-lg">
          Oops! The page you are looking for does not exist or has been moved. 
          Please check the URL or return to the dashboard.
        </p>
        <div className="pt-4">
            <Button size="lg" onClick={() => navigate("/")} className="gap-2 font-semibold shadow-lg hover:shadow-xl transition-all">
            <Home className="h-5 w-5" />
            Back to Dashboard
            </Button>
        </div>
      </div>
    </div>
  )
}

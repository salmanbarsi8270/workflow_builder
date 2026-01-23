import { useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Check,
  Loader2,
  Clock,
} from "lucide-react"
import { API_URL } from "@/ui_components/api/apiurl"
import { Skeleton } from "@/components/skeleton"

interface PendingApproval {
  id: string
  flow_id: string
  name: string
  status: string
  created_at: string
  current_context: any
}

export function ApprovalsList({ userId }: { userId: string }) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchApprovals = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/v1/dashboard/stats?userId=${userId}`
      )

      const runs = data?.recentRuns || []
      const waiting = runs.filter(
        (r: any) => r.status?.toLowerCase() === "waiting"
      )

      setApprovals(waiting)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
    const interval = setInterval(fetchApprovals, 10000)
    return () => clearInterval(interval)
  }, [userId])

  const handleAction = async (
    run: PendingApproval,
    action: "resume" | "reject"
  ) => {
    setProcessing(run.id)
    try {
      await axios.post(
        `${API_URL}/api/v1/flows/${run.flow_id}/runs/${run.id}/${action}`,
        { 
          approver: userId,
          source: 'dashboard'
        }
      )

      toast.success(
        action === "resume"
          ? "Workflow approved"
          : "Workflow rejected"
      )

      setApprovals(prev => prev.filter(a => a.id !== run.id))
    } catch {
      toast.error("Action failed")
    } finally {
      setProcessing(null)
    }
  }

if (loading && approvals.length === 0) {
  return (
    <Card className="col-span-4 rounded-3xl overflow-hidden border-none shadow-2xl">
      <CardHeader className="pb-2 flex items-center justify-between flex-row">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-muted/40 flex gap-4"
          >
            <Skeleton className="h-12 w-12 rounded-xl" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-10 w-20 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


  if (approvals.length === 0) return null

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
      {approvals.map(run => {
          const context =
            typeof run.current_context === "string"
              ? JSON.parse(run.current_context)
              : run.current_context

          const waitInfo = context?.wait_info
          const stepName = waitInfo ? Object.keys(waitInfo)[0] : null
          const instructions =
            stepName && waitInfo?.[stepName]?.instructions

          return (
            <div
              key={run.id}
              className="
                group
                bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-800
                rounded-xl
                p-4
                shadow-xs
                hover:shadow-md
                transition-all
              "
            >
              <div className="flex items-start gap-3">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Clock className="h-5 w-5" />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate leading-tight">
                        {run.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mx-0 mt-0.5 font-mono">
                        #{run.id.slice(0, 8)}
                    </p>
                 </div>
              </div>

              {instructions && (
                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">Note:</span>
                    {instructions}
                  </div>
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-900"
                  onClick={() => handleAction(run, "reject")}
                  disabled={processing === run.id}
                >
                  {processing === run.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reject"}
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => handleAction(run, "resume")}
                  disabled={processing === run.id}
                >
                  {processing === run.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <>Approve <Check className="ml-1.5 h-3.5 w-3.5" /></>}
                </Button>
              </div>
            </div>
          )
        })}
    </div>
  )
}

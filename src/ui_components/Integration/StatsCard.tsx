import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export const StatsCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <Card className="overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-blue-300/50 font-black">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
            {trend && (
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-black ${trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                <TrendingUp className={`h-3 w-3 ${trend > 0 ? '' : 'rotate-180'}`} />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${color} bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

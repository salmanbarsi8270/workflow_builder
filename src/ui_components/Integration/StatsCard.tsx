import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export const StatsCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <Card className="overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 group">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${trend > 0 ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend)}% this month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

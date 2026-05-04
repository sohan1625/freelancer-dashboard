import { motion } from "framer-motion";
import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { ds, tk } from "@/lib/ds"; // Use your design system!

interface AnalyticsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
}

export function AnalyticsCard({ title, value, change, changeType, icon: Icon, delay = 0 }: AnalyticsCardProps) {
  const ui = tk(true); // Enforce dark mode

  // Map your custom token colors to the change type
  const changeColor =
      changeType === "positive" ? ds.color.green :
          changeType === "negative" ? ds.color.red :
              ds.dark.text.muted;

  const TrendIcon =
      changeType === "positive" ? ArrowUpRight :
          changeType === "negative" ? ArrowDownRight :
              Minus;

  return (
      <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay }}
          className={`${ui.card} p-5 flex flex-col justify-between`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`${ds.font.sm} ${ds.weight.medium} ${ui.muted} uppercase tracking-wider`}>
              {title}
            </p>
            <p className={`mt-2 ${ds.font["3xl"]} ${ds.weight.semibold} ${ui.primary}`}>
              {value}
            </p>

            {/* Trend Indicator */}
            <div className="mt-3 flex items-center gap-1" style={{ color: changeColor }}>
              <TrendIcon className="w-3 h-3" />
              <span className={`${ds.font.sm} ${ds.weight.medium}`}>
              {change}
            </span>
              <span className={`${ds.font.sm} ${ui.muted} ml-1 font-normal`}>
              vs last month
            </span>
            </div>
          </div>

          {/* Icon with a subtle background glow */}
          <div className={`rounded-lg p-2.5`} style={{ backgroundColor: `${ds.color.blue}15` }}>
            <Icon className="h-5 w-5" style={{ color: ds.color.blue }} />
          </div>
        </div>
      </motion.div>
  );
}
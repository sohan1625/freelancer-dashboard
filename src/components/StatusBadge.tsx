import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        paid: "bg-success/10 text-success",
        pending: "bg-warning/10 text-warning",
        overdue: "bg-destructive/10 text-destructive",
        draft: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const labels: Record<string, string> = {
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    draft: "Draft",
  };

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {labels[status || "draft"]}
    </span>
  );
}

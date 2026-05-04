import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

/* ---------------- CONFIG ---------------- */

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
    [k: string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
        color?: string;
    };
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) throw new Error("useChart must be used within ChartContainer");
    return context;
}

/* ---------------- CONTAINER ---------------- */

export const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactNode;
}
>(({ className, children, config, ...props }, ref) => {
    return (
        <ChartContext.Provider value={{ config }}>
            <div
                ref={ref}
                className={cn("w-full h-[300px]", className)}
                {...props}
            >
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});
ChartContainer.displayName = "ChartContainer";

/* ---------------- TOOLTIP ---------------- */

type SafePayload = {
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
    payload?: any;
};

export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = ({
                                        active,
                                        payload,
                                        label,
                                    }: {
    active?: boolean;
    payload?: SafePayload[];
    label?: string;
}) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="bg-background border rounded-md p-2 text-xs shadow">
            <p className="font-medium">{label}</p>

            {payload.map((item, index) => (
                <div key={index} className="flex justify-between gap-2">
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                </div>
            ))}
        </div>
    );
};

/* ---------------- LEGEND ---------------- */

type LegendPayload = {
    value?: string;
    color?: string;
    dataKey?: string;
};

export const ChartLegend = RechartsPrimitive.Legend;

export const ChartLegendContent = ({
                                       payload,
                                   }: {
    payload?: LegendPayload[];
}) => {
    if (!payload || payload.length === 0) return null;

    return (
        <div className="flex gap-4 justify-center mt-2">
            {payload.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: item.color }}
                    />
                    <span>{item.value}</span>
                </div>
            ))}
        </div>
    );
};

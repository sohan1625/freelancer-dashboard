// src/components/dashboard/StatsCard.tsx

import { Card } from "@/components/ui/card";

interface StatsCardProps {
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
}

export function StatsCard({
                              title,
                              value,
                              change,
                              icon,
                          }: StatsCardProps) {
    return (
        <Card className="p-5 flex justify-between items-center hover:shadow-md transition rounded-xl">

            <div>
                <p className="text-sm text-muted-foreground">
                    {title}
                </p>

                <h2 className="text-2xl font-semibold">
                    {value}
                </h2>

                <p className="text-xs text-green-500 mt-1">
                    {change}
                </p>
            </div>

            <div className="text-muted-foreground text-xl">
                {icon}
            </div>

        </Card>
    );
}

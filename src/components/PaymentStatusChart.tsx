// src/components/ui/PaymentStatusChart.tsx

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const data = [
    { name: "Paid", value: 60 },
    { name: "Pending", value: 25 },
    { name: "Overdue", value: 15 },
];

const COLORS = ["#22c55e", "#eab308", "#ef4444"];

export function PaymentStatusChart() {
    return (
        <div className="bg-white rounded-xl shadow p-6 h-[350px]">
            <h3 className="text-lg font-semibold mb-4">
                Payment Status
            </h3>

            <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={index} fill={COLORS[index]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-around mt-4 text-sm">
                <span className="text-green-500">● Paid</span>
                <span className="text-yellow-500">● Pending</span>
                <span className="text-red-500">● Overdue</span>
            </div>
        </div>
    );
}

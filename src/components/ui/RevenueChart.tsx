import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

const data = [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 2100 },
    { month: "Mar", revenue: 1800 },
    { month: "Apr", revenue: 3200 },
    { month: "May", revenue: 2800 },
    { month: "Jun", revenue: 4200 }
];

export default function RevenueChart() {
    return (
        <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
                Revenue Overview
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryTotal } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';

const COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#f59e0b', // amber-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#f43f5e'  // rose-500
];

export function ExpenseBreakdownChart({ data }: { data: CategoryTotal[] }) {
    return (
        <Card className="rounded-2xl shadow-sm border-none bg-card h-full">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
                <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-[300px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card)', color: 'var(--foreground)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </CardContent>
        </Card>
    );
}

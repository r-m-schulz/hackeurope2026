import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayForecast } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

export function CashForecastChart({ forecast }: { forecast: DayForecast[] }) {
    const finalBalance = forecast[forecast.length - 1].balance;

    let riskLevel = 'Safe';
    let riskColor = 'bg-green-500/10 text-green-600 hover:bg-green-500/20';

    if (finalBalance < 0) {
        riskLevel = 'Shortfall Predicted';
        riskColor = 'bg-red-500/10 text-red-600 hover:bg-red-500/20';
    } else if (finalBalance < 10000) {
        riskLevel = 'Warning';
        riskColor = 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20';
    }

    return (
        <Card className="rounded-2xl shadow-sm border-none bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6">
                <CardTitle className="text-lg font-semibold">30-Day Cash Forecast</CardTitle>
                <Badge variant="secondary" className={`px-2 py-1 ${riskColor} border-0 transition-colors`}>
                    {riskLevel}
                </Badge>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-[300px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecast} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <XAxis
                                dataKey="day"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.replace('Day ', '')}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`$${value}`, 'Balance']}
                                labelStyle={{ color: '#888' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="currentColor"
                                strokeWidth={3}
                                className={finalBalance >= 0 ? "text-primary" : "text-destructive"}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </CardContent>
        </Card>
    );
}

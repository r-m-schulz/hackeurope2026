import { CalendarDays, Landmark, Vault, Wallet } from 'lucide-react';
import type { AppData } from '../data/mockData';
import { calculateEstimatedTax, getUpcomingPayments } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useEffect, useState } from 'react';

function AnimatedNumber({ value, isCurrency = true }: { value: number, isCurrency?: boolean }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        const duration = 1000;
        const incrementTime = 20;
        const steps = duration / incrementTime;
        const stepValue = (end - start) / steps;

        let current = start;
        const timer = setInterval(() => {
            current += stepValue;
            if ((stepValue > 0 && current >= end) || (stepValue < 0 && current <= end)) {
                clearInterval(timer);
                setDisplayValue(end);
            } else {
                setDisplayValue(current);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    const formatted = new Intl.NumberFormat('en-US', {
        style: isCurrency ? 'currency' : 'decimal',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(Math.round(displayValue));

    return <span>{formatted}</span>;
}

export function TopSummary({ appData }: { appData: AppData }) {
    const totalIncome = appData.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const { totalTaxLiability, estimatedVat, estimatedCorpTax } = calculateEstimatedTax(totalIncome, appData);
    const { total: upcomingPayments } = getUpcomingPayments(appData.subscriptions, 30);
    const trueAvailableCash = appData.currentBalance - totalTaxLiability - upcomingPayments;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl shadow-sm p-4 border-none bg-card hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
                    <Landmark className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    <div className="text-2xl font-bold text-green-500">
                        <AnimatedNumber value={appData.currentBalance} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm p-4 border-none bg-card hover:shadow-md transition-shadow relative group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Estimated Tax Owed</CardTitle>
                    <Vault className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="p-0 pt-4 cursor-pointer">
                    <div className="text-2xl font-bold text-orange-500">
                        <AnimatedNumber value={totalTaxLiability} />
                    </div>
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                        VAT: ${Math.round(estimatedVat)} | Corp: ${Math.round(estimatedCorpTax)}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm p-4 border-none bg-card hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">Upcoming Payments (30 Days)</CardTitle>
                    <CalendarDays className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    <div className="text-2xl font-bold text-red-500">
                        <AnimatedNumber value={upcomingPayments} />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm p-4 border-none bg-card hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                    <CardTitle className="text-sm font-medium">True Available Cash</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    <div className={`text-3xl font-black ${trueAvailableCash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <AnimatedNumber value={trueAvailableCash} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

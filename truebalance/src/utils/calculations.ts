import { addDays, isSameDay } from 'date-fns';
import type { AppData, Subscription } from '../data/mockData';

export function calculateEstimatedTax(incomeTransAmount: number, appData: AppData, customReservePercent: number = 0) {
    // Simple estimation based on total income (in reality it's much more complex)
    const estimatedVat = incomeTransAmount * appData.taxConfig.vatRate;
    const estimatedCorpTax = incomeTransAmount * appData.taxConfig.corpTaxRate;
    const totalTaxLiability = estimatedVat + estimatedCorpTax;

    // They can reserve a custom percentage. Default is just the liability
    const vaultAmount = customReservePercent > 0
        ? incomeTransAmount * (customReservePercent / 100)
        : totalTaxLiability;

    return { estimatedVat, estimatedCorpTax, totalTaxLiability, vaultAmount };
}

export function getUpcomingPayments(subscriptions: Subscription[], days: number = 30) {
    const upcoming = subscriptions.filter(sub => {
        const due = new Date(sub.nextDueDate);
        const now = new Date();
        const diffTime = Math.abs(due.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    });

    const total = upcoming.reduce((sum, sub) => sum + sub.amount, 0);
    return { upcoming, total };
}

export interface DayForecast {
    day: string;
    balance: number;
}

export function generateForecast(appData: AppData, days: number = 30): DayForecast[] {
    const forecast: DayForecast[] = [];
    let runningBalance = appData.currentBalance;
    const today = new Date();

    // Tax is simulated on day 30
    const totalIncome = appData.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const tax = calculateEstimatedTax(totalIncome, appData).totalTaxLiability;

    for (let i = 0; i <= days; i++) {
        const currentDay = addDays(today, i);

        // deduct subscriptions
        appData.subscriptions.forEach(sub => {
            if (isSameDay(new Date(sub.nextDueDate), currentDay)) {
                runningBalance -= sub.amount;
            }
        });

        // deduct tax on day 30
        if (i === 30) {
            runningBalance -= tax;
        }

        forecast.push({
            day: `Day ${i}`,
            balance: runningBalance
        });
    }

    return forecast;
}

export function generateAIInsight(appData: AppData, forecast: DayForecast[], taxLiability: number): string {
    const finalBalance = forecast[forecast.length - 1].balance;
    const taxPercentage = ((taxLiability / appData.currentBalance) * 100).toFixed(1);

    if (finalBalance < 0) {
        const shortfallDay = forecast.findIndex(f => f.balance < 0);
        return `At current burn rate, you will face a shortfall in ${shortfallDay} days.`;
    }

    if (taxLiability > appData.currentBalance * 0.2) {
        return `Your estimated tax liability represents ${taxPercentage}% of available cash. Ensure your Tax Vault is funded.`;
    }

    return `Your cash flow looks stable. No shortfalls predicted in the next 30 days.`;
}

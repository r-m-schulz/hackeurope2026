import { addDays, subDays } from 'date-fns';

export interface Transaction {
    id: string;
    date: string;
    merchant: string;
    amount: number;
    category: string;
    type: 'Income' | 'Expense';
}

export interface Subscription {
    id: string;
    merchant: string;
    amount: number;
    nextDueDate: string;
    frequency: 'monthly' | 'weekly';
}

export interface TaxConfig {
    vatRate: number; // e.g., 0.23
    corpTaxRate: number; // e.g., 0.125
}

export interface AppData {
    currentBalance: number;
    taxConfig: TaxConfig;
    subscriptions: Subscription[];
    transactions: Transaction[];
}

const today = new Date();

export const mockTransactions: Transaction[] = Array.from({ length: 35 }).map((_, i) => {
    const isIncome = i % 5 === 0; // Every 5th transaction is income
    const merchants = isIncome ? ['Stripe', 'App Store', 'Shopify', 'Direct Transfer'] : ['AWS', 'Google Workspace', 'WeWork', 'Gusto', 'Adobe', 'Slack', 'GitHub', 'Internet', 'Office Supplies', 'Marketing Agency'];
    const categories = isIncome ? ['Sales', 'Services', 'Refund'] : ['Software', 'Rent', 'Payroll', 'Utilities', 'Marketing'];

    return {
        id: `tx-${i}`,
        date: subDays(today, Math.floor(i * 1.5)).toISOString(),
        merchant: merchants[i % merchants.length],
        amount: isIncome ? Math.floor(Math.random() * 5000) + 500 : Math.floor(Math.random() * 500) + 20,
        category: categories[i % categories.length],
        type: isIncome ? 'Income' : 'Expense',
    };
});

export const mockSubscriptions: Subscription[] = [
    { id: 'sub-1', merchant: 'AWS', amount: 1250, nextDueDate: addDays(today, 2).toISOString(), frequency: 'monthly' },
    { id: 'sub-2', merchant: 'Google Workspace', amount: 240, nextDueDate: addDays(today, 5).toISOString(), frequency: 'monthly' },
    { id: 'sub-3', merchant: 'WeWork', amount: 3500, nextDueDate: addDays(today, 12).toISOString(), frequency: 'monthly' },
    { id: 'sub-4', merchant: 'Gusto (Payroll)', amount: 18000, nextDueDate: addDays(today, 28).toISOString(), frequency: 'monthly' },
    { id: 'sub-5', merchant: 'Slack', amount: 85, nextDueDate: addDays(today, 15).toISOString(), frequency: 'monthly' },
];

export const initialAppData: AppData = {
    currentBalance: 85400,
    taxConfig: {
        vatRate: 0.23,
        corpTaxRate: 0.125,
    },
    subscriptions: mockSubscriptions,
    transactions: mockTransactions,
};

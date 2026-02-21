import { useState } from 'react';
import type { Subscription } from '../data/mockData';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';

interface Props {
    subscriptions: Subscription[];
    onAdd: (sub: Omit<Subscription, 'id'>) => void;
    onDelete: (id: string) => void;
}

export function RecurringPayments({ subscriptions, onAdd, onDelete }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    // Form state
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!merchant || !amount || !date) return;

        onAdd({
            merchant,
            amount: Number(amount),
            nextDueDate: new Date(date).toISOString(),
            frequency
        });

        setIsOpen(false);
        setMerchant('');
        setAmount('');
        setDate('');
        setFrequency('monthly');
    };

    return (
        <Card className="rounded-2xl shadow-sm border-none bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6">
                <CardTitle className="text-lg font-semibold">Recurring Payments</CardTitle>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-full flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Subscription
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Add Subscription</DialogTitle>
                                <DialogDescription>
                                    Add a new recurring payment to your forecast.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="merchant" className="text-right">Merchant</Label>
                                    <Input id="merchant" value={merchant} onChange={e => setMerchant(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="amount" className="text-right">Amount</Label>
                                    <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">Next Due</Label>
                                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="frequency" className="text-right">Frequency</Label>
                                    <div className="col-span-3">
                                        <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[250px] overflow-y-auto relative">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                            <TableRow className="border-b-0 hover:bg-transparent">
                                <TableHead className="pl-6 bg-card">Merchant</TableHead>
                                <TableHead className="bg-card">Amount</TableHead>
                                <TableHead className="bg-card">Next Due Date</TableHead>
                                <TableHead className="bg-card">Frequency</TableHead>
                                <TableHead className="pr-6 text-right bg-card">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No recurring payments</TableCell>
                                </TableRow>
                            )}
                            {subscriptions.map((sub) => (
                                <TableRow key={sub.id} className="border-b-0 h-[53px]">
                                    <TableCell className="font-medium pl-6">{sub.merchant}</TableCell>
                                    <TableCell>${sub.amount.toLocaleString()}</TableCell>
                                    <TableCell>{format(new Date(sub.nextDueDate), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="capitalize">{sub.frequency}</TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(sub.id)} className="text-muted-foreground hover:text-red-500 rounded-full">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

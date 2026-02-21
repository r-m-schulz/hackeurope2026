import { useState } from 'react';
import type { Transaction } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { ArrowUpDown } from 'lucide-react';

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount', direction: 'asc' | 'desc' } | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const categories = ['All', ...Array.from(new Set(transactions.map(t => t.category)))];

    const handleSort = (key: 'date' | 'amount') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredData = transactions.filter(t => {
        const matchesSearch = t.merchant.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'All' || t.category === category;
        return matchesSearch && matchesCategory;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        if (sortConfig.key === 'amount') {
            return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        if (sortConfig.key === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    return (
        <Card className="rounded-2xl shadow-sm border-none bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <div className="px-6 py-4 flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Search merchants..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm rounded-full"
                />
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[180px] rounded-full">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b-0">
                            <TableHead className="pl-6 w-[200px]">
                                <Button variant="ghost" onClick={() => handleSort('date')} className="-ml-4 hover:bg-transparent font-medium">
                                    Date
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Merchant</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right pr-6">
                                <Button variant="ghost" onClick={() => handleSort('amount')} className="-mr-4 hover:bg-transparent justify-end w-full font-medium">
                                    Amount
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No transactions found</TableCell>
                            </TableRow>
                        )}
                        {paginatedData.map(tx => (
                            <TableRow key={tx.id} className="border-b-0">
                                <TableCell className="pl-6">{format(new Date(tx.date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="font-medium">{tx.merchant}</TableCell>
                                <TableCell>
                                    <span className="bg-secondary px-2 py-1 rounded-full text-xs">{tx.category}</span>
                                </TableCell>
                                <TableCell className={`text-right pr-6 font-semibold ${tx.type === 'Income' ? 'text-green-500' : 'text-foreground'}`}>
                                    {tx.type === 'Income' ? '+' : '-'}${tx.amount.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-full"
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-muted-foreground px-2">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="rounded-full"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

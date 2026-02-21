import type { AppData } from '../data/mockData';
import { calculateEstimatedTax } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { useState } from 'react';
import { Vault } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TaxVault({ appData }: { appData: AppData }) {
    const [reservePercent, setReservePercent] = useState(0);
    const [isMoving, setIsMoving] = useState(false);

    const totalIncome = appData.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const { totalTaxLiability, vaultAmount } = calculateEstimatedTax(totalIncome, appData, reservePercent);

    const rawProgressPercent = (vaultAmount / totalTaxLiability) * 100 || 0;
    const progressPercent = Math.min(100, Math.max(0, rawProgressPercent));

    const handleMoveToVault = () => {
        setIsMoving(true);
        setTimeout(() => {
            setIsMoving(false);
        }, 1500);
    };

    return (
        <Card className="rounded-2xl shadow-sm border-none bg-card">
            <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Vault className="h-5 w-5 text-orange-500" />
                    Tax Vault Simulator
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Tax Liability</p>
                        <p className="text-2xl font-bold">${Math.round(totalTaxLiability).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Simulated Reserved Amount</p>
                        <p className="text-2xl font-bold text-orange-500">${Math.round(vaultAmount).toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Set Custom Reserve % of Income</span>
                        <span className="font-medium">{reservePercent}%</span>
                    </div>
                    <Slider
                        value={[reservePercent]}
                        onValueChange={v => setReservePercent(v[0])}
                        max={50}
                        step={1}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Reserve Progress</span>
                        <span>{Math.round(rawProgressPercent)}% of Liability</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                </div>

                <Button
                    onClick={handleMoveToVault}
                    disabled={isMoving || vaultAmount === 0}
                    className="w-full rounded-full transition-all duration-300"
                    variant="secondary"
                >
                    <AnimatePresence mode="wait">
                        {isMoving ? (
                            <motion.span
                                key="moving"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                Moving Funds...
                            </motion.span>
                        ) : (
                            <motion.span
                                key="ready"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                Move To Vault
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </CardContent>
        </Card>
    );
}

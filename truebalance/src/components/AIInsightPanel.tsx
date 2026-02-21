import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export function AIInsightPanel({ insightText }: { insightText: string }) {
    const isWarning = insightText.toLowerCase().includes('shortfall') || insightText.toLowerCase().includes('ensure');

    return (
        <Card className="rounded-2xl shadow-sm border-none bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 relative z-10">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    CFO Insight
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 relative z-10 min-h-[120px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={insightText}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-start gap-3"
                    >
                        {isWarning ? (
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                            <TrendingUp className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                            {insightText}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

import { useEffect, useState } from 'react';
import { initialAppData } from './data/mockData';
import type { Subscription } from './data/mockData';
import { generateForecast, calculateEstimatedTax, generateAIInsight } from './utils/calculations';
import { TopSummary } from './components/TopSummary';
import { CashForecastChart } from './components/CashForecastChart';
import { RecurringPayments } from './components/RecurringPayments';
import { TaxVault } from './components/TaxVault';
import { TransactionsTable } from './components/TransactionsTable';
import { AIInsightPanel } from './components/AIInsightPanel';
import { Moon, Sun, LayoutDashboard, Settings, User } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [appData, setAppData] = useState(initialAppData);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddSubscription = (sub: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = { ...sub, id: `sub-${Date.now()}` };
    setAppData(prev => ({
      ...prev,
      subscriptions: [...prev.subscriptions, newSub]
    }));
  };

  const handleDeleteSubscription = (id: string) => {
    setAppData(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(s => s.id !== id)
    }));
  };

  const forecast = generateForecast(appData, 30);
  const totalIncome = appData.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const { totalTaxLiability } = calculateEstimatedTax(totalIncome, appData);
  const aiInsight = generateAIInsight(appData, forecast, totalTaxLiability);

  return (
    <div className="min-h-screen bg-secondary/30 transition-colors duration-300 font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg border-b bg-background/80 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">True<span className="text-muted-foreground font-light">Balance</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Headers */}
        <section>
          <TopSummary appData={appData} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <CashForecastChart forecast={forecast} />
            </section>
            <section>
              <TransactionsTable transactions={appData.transactions} />
            </section>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            <section>
              <AIInsightPanel insightText={aiInsight} />
            </section>
            <section>
              <TaxVault appData={appData} />
            </section>
            <section>
              <RecurringPayments
                subscriptions={appData.subscriptions}
                onAdd={handleAddSubscription}
                onDelete={handleDeleteSubscription}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { getUserCurrencySymbol } from '@/lib/currency';

interface CashFlowProps {
    income: number;
    expenses: number;
    currency?: string;
}

export function CashFlowCard({ income, expenses, currency = 'USD' }: CashFlowProps) {
    const currencySymbol = getUserCurrencySymbol(currency);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate percentages for visual bars (max width 100%)
    const total = Math.max(income + expenses, 1); // Avoid div by zero
    const maxVal = Math.max(income, expenses, 1);
    const incomePct = Math.min((income / maxVal) * 100, 100);
    const expensesPct = Math.min((expenses / maxVal) * 100, 100);

    const netFlow = income - expenses;
    const isPositive = netFlow >= 0;

    return (
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(31 41 55)' }}>
            <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white">Monthly Cash Flow</h3>
            </div>
            <div className="p-6">
                {/* Net Flow Summary */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                        <h4 className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : '-'}{currencySymbol}{formatCurrency(Math.abs(netFlow))}
                        </h4>
                        <span className="text-base text-gray-400 block">Net flow this month</span>
                    </div>
                </div>

                {/* Comparison Bars */}
                <div className="space-y-5">
                    {/* Income Bar */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-green-500/20">
                                    <TrendingUp className="h-3 w-3 text-green-400" />
                                </div>
                                <span className="text-base text-gray-300">Income</span>
                            </div>
                            <span className="text-base font-medium text-white">{currencySymbol}{formatCurrency(income)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${incomePct}%` }}
                            />
                        </div>
                    </div>

                    {/* Expense Bar */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-red-500/20">
                                    <TrendingDown className="h-3 w-3 text-red-400" />
                                </div>
                                <span className="text-base text-gray-300">Expenses</span>
                            </div>
                            <span className="text-base font-medium text-white">{currencySymbol}{formatCurrency(expenses)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${expensesPct}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

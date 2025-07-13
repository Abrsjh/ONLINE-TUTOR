"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCard, 
  Plus, 
  Minus, 
  Download, 
  Filter, 
  Search, 
  MoreHorizontal,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Gift,
  Zap,
  Crown,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Settings,
  HelpCircle,
  Shield,
  Smartphone,
  Building,
  Receipt
} from 'lucide-react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, SearchInput } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Hooks and State
import { useAuth } from '@/hooks/use-auth'
import { useWalletStore, type Transaction, type PaymentPackage, type SubscriptionPlan, type RefundRequest, type PaymentMethod } from '@/lib/state/wallet'
import { formatCurrency } from '@/lib/api/payments'
import { cn } from '@/lib/utils'

// Stripe configuration
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key')

// Transaction type icons and colors
const transactionConfig = {
  credit: { icon: ArrowDownLeft, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Credit' },
  debit: { icon: ArrowUpRight, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Debit' },
  refund: { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Refund' },
  earning: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Earning' },
  withdrawal: { icon: TrendingDown, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Withdrawal' },
  'top-up': { icon: Plus, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Top-up' }
}

// Status badges configuration
const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
  processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw }
}

// Main Wallet Page Component
export default function WalletPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Wallet store state
  const {
    wallet,
    transactions,
    pendingPayments,
    refundRequests,
    paymentMethods,
    availablePackages,
    availableSubscriptions,
    isLoading,
    isProcessingPayment,
    isLoadingTransactions,
    error,
    transactionFilter,
    hasMoreTransactions,
    
    // Actions
    initializeWallet,
    refreshWallet,
    loadTransactions,
    loadMoreTransactions,
    setTransactionFilter,
    topUpWallet,
    requestWithdrawal,
    requestRefund,
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    purchasePackage,
    subscribeToplan,
    clearError,
    
    // Getters
    getFormattedBalance,
    getFormattedAmount,
    getPendingAmount,
    getRecentTransactions,
    canWithdraw,
    getAvailableBalance
  } = useWalletStore()

  // Local state
  const [activeTab, setActiveTab] = useState('overview')
  const [showBalance, setShowBalance] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  // Initialize wallet on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initializeWallet(user.id)
      loadPaymentMethods(user.id)
    }
  }, [isAuthenticated, user?.id, initializeWallet, loadPaymentMethods])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions
    
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.amount.toString().includes(searchQuery)
    )
  }, [transactions, searchQuery])

  // Calculate wallet statistics
  const walletStats = useMemo(() => {
    const recentTransactions = getRecentTransactions(30) // Last 30 transactions
    const totalSpent = recentTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalEarned = recentTransactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0)
    const pendingAmount = getPendingAmount()
    
    return {
      totalSpent,
      totalEarned,
      pendingAmount,
      availableBalance: getAvailableBalance(),
      transactionCount: recentTransactions.length
    }
  }, [getRecentTransactions, getPendingAmount, getAvailableBalance])

  // Handle transaction filter change
  const handleFilterChange = (filter: string) => {
    setTransactionFilter(filter as Transaction['type'] | 'all')
    if (user?.id) {
      loadTransactions(user.id, 1, true)
    }
  }

  // Handle load more transactions
  const handleLoadMore = () => {
    if (user?.id && hasMoreTransactions && !isLoadingTransactions) {
      loadMoreTransactions(user.id)
    }
  }

  // Handle refresh wallet
  const handleRefreshWallet = async () => {
    if (user?.id) {
      await refreshWallet(user.id)
      await loadTransactions(user.id, 1, true)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your credits, payments, and transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshWallet}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showBalance ? 'Hide' : 'Show'} Balance
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Balance Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalance ? getFormattedBalance() : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {showBalance ? getFormattedAmount(walletStats.availableBalance) : '••••••'}
            </p>
            <div className="flex items-center space-x-2 mt-4">
              <Button 
                size="sm" 
                onClick={() => setIsTopUpModalOpen(true)}
                disabled={isProcessingPayment}
              >
                <Plus className="h-4 w-4 mr-2" />
                Top Up
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={!canWithdraw(100) || isProcessingPayment}
              >
                <Minus className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalance ? getFormattedAmount(walletStats.pendingAmount) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} pending transactions
            </p>
          </CardContent>
        </Card>

        {/* Monthly Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalance ? getFormattedAmount(walletStats.totalEarned - walletStats.totalSpent) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              {walletStats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Transactions
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getRecentTransactions(5).map((transaction) => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction}
                    showBalance={showBalance}
                    onClick={() => setSelectedTransaction(transaction)}
                  />
                ))}
                {getRecentTransactions(5).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No transactions yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common wallet operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setIsTopUpModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('packages')}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Buy Package
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('subscriptions')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  disabled={!canWithdraw(100)}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Pending Payments */}
          {pendingPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>
                  Payments awaiting processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-full", statusConfig[payment.status].color)}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{getFormattedAmount(payment.amount)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View and manage your transaction history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery('')}
                  />
                </div>
                <Select value={transactionFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                    <SelectItem value="debit">Debits</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                    <SelectItem value="earning">Earnings</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="top-up">Top-ups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    showBalance={showBalance}
                    onClick={() => setSelectedTransaction(transaction)}
                    detailed
                  />
                ))}
                
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                )}
              </div>

              {/* Load More Button */}
              {hasMoreTransactions && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingTransactions}
                    loading={isLoadingTransactions}
                    loadingText="Loading..."
                  >
                    Load More Transactions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {availablePackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onSelect={() => setSelectedPackage(pkg)}
                disabled={isProcessingPayment}
              />
            ))}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableSubscriptions.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                onSelect={() => setSelectedPlan(plan)}
                disabled={isProcessingPayment}
              />
            ))}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Payment Methods
                <Button onClick={() => setIsPaymentMethodModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your saved payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onSetDefault={() => user?.id && setDefaultPaymentMethod(user.id, method.id)}
                  onRemove={() => user?.id && removePaymentMethod(user.id, method.id)}
                />
              ))}
              
              {paymentMethods.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment methods added</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsPaymentMethodModalOpen(true)}
                  >
                    Add Your First Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>
                Configure your wallet preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Balance</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your wallet balance on the overview
                  </p>
                </div>
                <Switch
                  checked={showBalance}
                  onCheckedChange={setShowBalance}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Label>Security</Label>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Enable Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Smartphone className="h-4 w-4 mr-2" />
                    SMS Notifications
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Label>Support</Label>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="h-4 w-4 mr-2" />
                    Download Statements
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        paymentMethods={paymentMethods}
        onTopUp={async (amount, paymentMethodId) => {
          if (user?.id) {
            await topUpWallet(user.id, amount, paymentMethodId)
            setIsTopUpModalOpen(false)
          }
        }}
        isProcessing={isProcessingPayment}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={walletStats.availableBalance}
        onWithdraw={async (amount, bankAccountId) => {
          if (user?.id) {
            await requestWithdrawal(user.id, amount, bankAccountId)
            setIsWithdrawModalOpen(false)
          }
        }}
        isProcessing={isProcessingPayment}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        transaction={selectedTransaction}
        onRefund={async (paymentId, amount, reason) => {
          await requestRefund(paymentId, amount, reason)
          setIsRefundModalOpen(false)
        }}
      />

      <Elements stripe={stripePromise}>
        <PaymentMethodModal
          isOpen={isPaymentMethodModalOpen}
          onClose={() => setIsPaymentMethodModalOpen(false)}
          onAdd={async (paymentMethodId) => {
            if (user?.id) {
              await addPaymentMethod(user.id, paymentMethodId)
              setIsPaymentMethodModalOpen(false)
            }
          }}
        />
      </Elements>

      <PackagePurchaseModal
        isOpen={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
        package={selectedPackage}
        paymentMethods={paymentMethods}
        onPurchase={async (packageId, paymentMethodId) => {
          if (user?.id) {
            await purchasePackage(user.id, packageId, paymentMethodId)
            setSelectedPackage(null)
          }
        }}
        isProcessing={isProcessingPayment}
      />

      <SubscriptionModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        paymentMethods={paymentMethods}
        onSubscribe={async (planId, paymentMethodId) => {
          if (user?.id) {
            await subscribeToplan(user.id, planId, paymentMethodId)
            setSelectedPlan(null)
          }
        }}
        isProcessing={isProcessingPayment}
      />

      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onRefund={() => {
          setIsRefundModalOpen(true)
          setSelectedTransaction(null)
        }}
      />
    </div>
  )
}

// Transaction Item Component
interface TransactionItemProps {
  transaction: Transaction
  showBalance: boolean
  onClick: () => void
  detailed?: boolean
}

function TransactionItem({ transaction, showBalance, onClick, detailed = false }: TransactionItemProps) {
  const config = transactionConfig[transaction.type]
  const Icon = config.icon
  const statusBadgeConfig = statusConfig[transaction.status]
  const StatusIcon = statusBadgeConfig.icon

  return (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={cn("p-2 rounded-full", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div>
          <p className="font-medium">{transaction.description}</p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{transaction.createdAt.toLocaleDateString()}</span>
            {detailed && (
              <>
                <span>•</span>
                <span>ID: {transaction.id}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("font-medium", config.color)}>
          {transaction.type === 'debit' || transaction.type === 'withdrawal' ? '-' : '+'}
          {showBalance ? formatCurrency(transaction.amount) : '••••••'}
        </p>
        <div className="flex items-center justify-end space-x-1">
          <StatusIcon className="h-3 w-3" />
          <Badge variant="secondary" className="text-xs">
            {transaction.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Package Card Component
interface PackageCardProps {
  package: PaymentPackage
  onSelect: () => void
  disabled: boolean
}

function PackageCard({ package: pkg, onSelect, disabled }: PackageCardProps) {
  const originalPrice = pkg.discount ? pkg.price / (1 - pkg.discount / 100) : pkg.price
  const savings = originalPrice - pkg.price

  return (
    <Card className={cn("relative", pkg.isPopular && "border-primary")}>
      {pkg.isPopular && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {pkg.name}
          {pkg.discount && (
            <Badge variant="secondary">
              {pkg.discount}% OFF
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">
            {formatCurrency(pkg.price)}
          </div>
          {pkg.discount && (
            <div className="text-sm text-muted-foreground line-through">
              {formatCurrency(originalPrice)}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Credits:</span>
            <span className="font-medium">{pkg.credits.toLocaleString()}</span>
          </div>
          {pkg.validityDays && (
            <div className="flex justify-between">
              <span>Valid for:</span>
              <span className="font-medium">{pkg.validityDays} days</span>
            </div>
          )}
          {pkg.discount && (
            <div className="flex justify-between text-green-600">
              <span>You save:</span>
              <span className="font-medium">{formatCurrency(savings)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onSelect}
          disabled={disabled}
        >
          <Gift className="h-4 w-4 mr-2" />
          Purchase Package
        </Button>
      </CardFooter>
    </Card>
  )
}

// Subscription Card Component
interface SubscriptionCardProps {
  plan: SubscriptionPlan
  onSelect: () => void
  disabled: boolean
}

function SubscriptionCard({ plan, onSelect, disabled }: SubscriptionCardProps) {
  const monthlyPrice = plan.interval === 'yearly' ? plan.price / 12 : plan.price

  return (
    <Card className={cn("relative", plan.isPopular && "border-primary")}>
      {plan.isPopular && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>
          {plan.interval === 'yearly' ? 'Billed annually' : 'Billed monthly'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">
            {formatCurrency(plan.price)}
          </div>
          <div className="text-sm text-muted-foreground">
            per {plan.interval}
          </div>
          {plan.interval === 'yearly' && (
            <div className="text-sm text-green-600">
              {formatCurrency(monthlyPrice)}/month
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Credits/month:</span>
            <span className="font-medium">{plan.creditsIncluded.toLocaleString()}</span>
          </div>
          {plan.trialDays && (
            <div className="flex justify-between">
              <span>Free trial:</span>
              <span className="font-medium">{plan.trialDays} days</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onSelect}
          disabled={disabled}
        >
          <Crown className="h-4 w-4 mr-2" />
          Subscribe Now
        </Button>
      </CardFooter>
    </Card>
  )
}

// Payment Method Card Component
interface PaymentMethodCardProps {
  method: PaymentMethod
  onSetDefault: () => void
  onRemove: () => void
}

function PaymentMethodCard({ method, onSetDefault, onRemove }: PaymentMethodCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-muted">
          {method.type === 'card' ? (
            <CreditCard className="h-4 w-4" />
          ) : (
            <Building className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {method.type === 'card' 
              ? `${method.card?.brand?.toUpperCase()} •••• ${method.card?.last4}`
              : `${method.bank_account?.bank_name} •••• ${method.bank_account?.last4}`
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {method.type === 'card' 
              ? `Expires ${method.card?.exp_month}/${method.card?.exp_year}`
              : method.bank_account?.account_type
            }
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {method.is_default && (
          <Badge variant="secondary">Default</Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!method.is_default && (
              <DropdownMenuItem onClick={onSetDefault}>
                Set as Default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onRemove}
              className="text-destructive"
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Modal Components (simplified for brevity)
function TopUpModal({ isOpen, onClose, paymentMethods, onTopUp, isProcessing }: any) {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && selectedMethod) {
      await onTopUp(parseInt(amount) * 100, selectedMethod) // Convert to cents
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            Add credits to your wallet
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
            />
          </div>
          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method: PaymentMethod) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.type === 'card' 
                      ? `${method.card?.brand?.toUpperCase()} •••• ${method.card?.last4}`
                      : `${method.bank_account?.bank_name} •••• ${method.bank_account?.last4}`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!amount || !selectedMethod || isProcessing}
              loading={isProcessing}
            >
              Top Up
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function WithdrawModal({ isOpen, onClose, availableBalance, onWithdraw, isProcessing }: any) {
  const [amount, setAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && bankAccount) {
      await onWithdraw(parseInt(amount) * 100, bankAccount) // Convert to cents
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw funds to your bank account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="withdraw-amount">Amount (USD)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              max={availableBalance / 100}
              step="0.01"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Available: {formatCurrency(availableBalance)}
            </p>
          </div>
          <div>
            <Label htmlFor="bank-account">Bank Account</Label>
            <Input
              id="bank-account"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Account ending in 1234"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!amount || !bankAccount || isProcessing}
              loading={isProcessing}
            >
              Withdraw
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RefundModal({ isOpen, onClose, transaction, onRefund }: any) {
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (transaction && reason) {
      await onRefund(transaction.id, transaction.amount, reason)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
          <DialogDescription>
            Request a refund for this transaction
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                Amount: {formatCurrency(transaction.amount)}
              </p>
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason for refund</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you're requesting a refund..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!reason}>
                Request Refund
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PaymentMethodModal({ isOpen, onClose, onAdd }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (error) {
      console.error(error)
    } else {
      await onAdd(paymentMethod.id)
    }
    
    setIsProcessing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method to your account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!stripe || isProcessing}
              loading={isProcessing}
            >
              Add Payment Method
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PackagePurchaseModal({ isOpen, onClose, package: pkg, paymentMethods, onPurchase, isProcessing }: any) {
  const [selectedMethod, setSelectedMethod] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pkg && selectedMethod) {
      await onPurchase(pkg.id, selectedMethod)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Package</DialogTitle>
          <DialogDescription>
            Complete your package purchase
          </DialogDescription>
        </DialogHeader>
        {pkg && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium">{pkg.name}</h3>
              <p className="text-sm text-muted-foreground">{pkg.description}</p>
              <div className="mt-2 space-y-1">
                <p>Credits: {pkg.credits.toLocaleString()}</p>
                <p className="font-medium">Price: {formatCurrency(pkg.price)}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="package-payment-method">Payment Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method: PaymentMethod) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.type === 'card' 
                        ? `${method.card?.brand?.toUpperCase()} •••• ${method.card?.last4}`
                        : `${method.bank_account?.bank_name} •••• ${method.bank_account?.last4}`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedMethod || isProcessing}
                loading={isProcessing}
              >
                Purchase Package
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubscriptionModal({ isOpen, onClose, plan, paymentMethods, onSubscribe, isProcessing }: any) {
  const [selectedMethod, setSelectedMethod] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (plan && selectedMethod) {
      await onSubscribe(plan.id, selectedMethod)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to Plan</DialogTitle>
          <DialogDescription>
            Complete your subscription
          </DialogDescription>
        </DialogHeader>
        {plan && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium">{plan.name}</h3>
              <div className="mt-2 space-y-1">
                <p>Credits per month: {plan.creditsIncluded.toLocaleString()}</p>
                <p>Billing: {plan.interval}</p>
                <p className="font-medium">Price: {formatCurrency(plan.price)} per {plan.interval}</p>
                {plan.trialDays && (
                  <p className="text-green-600">Free trial: {plan.trialDays} days</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="subscription-payment-method">Payment Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method: PaymentMethod) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.type === 'card' 
                        ? `${method.card?.brand?.toUpperCase()} •••• ${method.card?.last4}`
                        : `${method.bank_account?.bank_name} •••• ${method.bank_account?.last4}`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedMethod || isProcessing}
                loading={isProcessing}
              >
                Subscribe Now
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TransactionDetailModal({ isOpen, onClose, transaction, onRefund }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        {transaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Transaction ID</Label>
                <p className="font-mono text-sm">{transaction.id}</p>
              </div>
              <div>
                <Label>Type</Label>
                <p className="capitalize">{transaction.type}</p>
              </div>
              <div>
                <Label>Amount</Label>
                <p className="font-medium">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="secondary">{transaction.status}</Badge>
              </div>
              <div>
                <Label>Date</Label>
                <p>{transaction.createdAt.toLocaleString()}</p>
              </div>
              <div>
                <Label>Balance After</Label>
                <p>{formatCurrency(transaction.balanceAfter)}</p>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <p>{transaction.description}</p>
            </div>
            {transaction.status === 'completed' && transaction.type !== 'refund' && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={onRefund}>
                  Request Refund
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
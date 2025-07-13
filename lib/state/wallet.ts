import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { paymentAPI, PaymentMethod, formatCurrency } from '../api/payments'

// Wallet interfaces
export interface WalletBalance {
  balance: number
  currency: string
  totalEarnings: number
  totalSpent: number
  pendingAmount: number
  lastTransactionAt?: Date
}

export interface Transaction {
  id: number
  walletId: number
  userId: number
  type: 'credit' | 'debit' | 'refund' | 'earning' | 'withdrawal' | 'top-up'
  amount: number
  currency: string
  description: string
  referenceId?: string
  referenceType?: string
  balanceAfter: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  processedAt?: Date
  metadata?: Record<string, any>
}

export interface PendingPayment {
  id: string
  type: 'session' | 'package' | 'subscription' | 'top-up'
  amount: number
  currency: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentIntentId?: string
  sessionId?: number
  createdAt: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}

export interface RefundRequest {
  id: string
  paymentId: number
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requestedAt: Date
  processedAt?: Date
  adminNotes?: string
}

export interface PaymentPackage {
  id: string
  name: string
  credits: number
  price: number
  currency: string
  discount?: number
  isPopular?: boolean
  description: string
  validityDays?: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  creditsIncluded: number
  isPopular?: boolean
  trialDays?: number
}

// Wallet state interface
interface WalletState {
  // Core wallet data
  wallet: WalletBalance | null
  transactions: Transaction[]
  pendingPayments: PendingPayment[]
  refundRequests: RefundRequest[]
  paymentMethods: PaymentMethod[]
  
  // UI state
  isLoading: boolean
  isProcessingPayment: boolean
  isLoadingTransactions: boolean
  error: string | null
  
  // Pagination and filtering
  transactionPage: number
  transactionLimit: number
  transactionFilter: Transaction['type'] | 'all'
  hasMoreTransactions: boolean
  
  // Payment packages and subscriptions
  availablePackages: PaymentPackage[]
  availableSubscriptions: SubscriptionPlan[]
  
  // Optimistic updates tracking
  optimisticTransactions: Transaction[]
  optimisticBalance: number | null
  
  // Actions - Wallet Management
  initializeWallet: (userId: number) => Promise<void>
  refreshWallet: (userId: number) => Promise<void>
  
  // Actions - Transactions
  loadTransactions: (userId: number, page?: number, reset?: boolean) => Promise<void>
  loadMoreTransactions: (userId: number) => Promise<void>
  setTransactionFilter: (filter: Transaction['type'] | 'all') => void
  
  // Actions - Payments
  processPayment: (payment: Omit<PendingPayment, 'id' | 'createdAt' | 'status'>) => Promise<string>
  confirmPayment: (paymentIntentId: string, paymentMethodId: string, userId: number) => Promise<void>
  cancelPayment: (paymentId: string) => void
  
  // Actions - Top-up and Withdrawal
  topUpWallet: (userId: number, amount: number, paymentMethodId: string) => Promise<void>
  requestWithdrawal: (userId: number, amount: number, bankAccountId: string) => Promise<void>
  
  // Actions - Refunds
  requestRefund: (paymentId: number, amount: number, reason: string) => Promise<void>
  cancelRefundRequest: (requestId: string) => void
  
  // Actions - Payment Methods
  loadPaymentMethods: (userId: number) => Promise<void>
  addPaymentMethod: (userId: number, paymentMethodId: string) => Promise<void>
  removePaymentMethod: (userId: number, paymentMethodId: string) => Promise<void>
  setDefaultPaymentMethod: (userId: number, paymentMethodId: string) => Promise<void>
  
  // Actions - Packages and Subscriptions
  loadPaymentPackages: () => Promise<void>
  loadSubscriptionPlans: () => Promise<void>
  purchasePackage: (userId: number, packageId: string, paymentMethodId: string) => Promise<void>
  subscribeToplan: (userId: number, planId: string, paymentMethodId: string) => Promise<void>
  
  // Utility actions
  clearError: () => void
  setLoading: (loading: boolean) => void
  
  // Optimistic update helpers
  addOptimisticTransaction: (transaction: Omit<Transaction, 'id'>) => void
  removeOptimisticTransaction: (tempId: string) => void
  updateOptimisticBalance: (amount: number) => void
  clearOptimisticUpdates: () => void
  
  // Computed getters
  getFormattedBalance: () => string
  getFormattedAmount: (amount: number, currency?: string) => string
  getPendingAmount: () => number
  getTransactionsByType: (type: Transaction['type']) => Transaction[]
  getRecentTransactions: (limit?: number) => Transaction[]
  canWithdraw: (amount: number) => boolean
  getAvailableBalance: () => number
}

// Mock payment packages
const mockPaymentPackages: PaymentPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 500,
    price: 999, // $9.99
    currency: 'usd',
    description: 'Perfect for occasional tutoring sessions',
    validityDays: 90
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 1200,
    price: 1999, // $19.99
    currency: 'usd',
    discount: 17, // 17% discount
    isPopular: true,
    description: 'Most popular choice for regular learners',
    validityDays: 180
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 2500,
    price: 3999, // $39.99
    currency: 'usd',
    discount: 20, // 20% discount
    description: 'Best value for intensive learning',
    validityDays: 365
  },
  {
    id: 'unlimited',
    name: 'Unlimited Pack',
    credits: 10000,
    price: 9999, // $99.99
    currency: 'usd',
    discount: 37, // 37% discount
    description: 'Unlimited learning potential',
    validityDays: 365
  }
]

// Mock subscription plans
const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Monthly',
    price: 999, // $9.99
    currency: 'usd',
    interval: 'monthly',
    creditsIncluded: 300,
    features: ['300 credits per month', 'Basic support', 'Mobile app access'],
    trialDays: 7
  },
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    price: 1999, // $19.99
    currency: 'usd',
    interval: 'monthly',
    creditsIncluded: 750,
    features: ['750 credits per month', 'Priority support', 'Advanced analytics', 'Mobile app access'],
    isPopular: true,
    trialDays: 14
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    price: 19999, // $199.99 (save $40)
    currency: 'usd',
    interval: 'yearly',
    creditsIncluded: 750,
    features: ['750 credits per month', 'Priority support', 'Advanced analytics', 'Mobile app access', '2 months free'],
    trialDays: 30
  },
  {
    id: 'pro-yearly',
    name: 'Pro Yearly',
    price: 49999, // $499.99
    currency: 'usd',
    interval: 'yearly',
    creditsIncluded: 2000,
    features: ['2000 credits per month', 'Dedicated support', 'Advanced analytics', 'API access', 'Custom integrations'],
    trialDays: 30
  }
]

// Create the wallet store
export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        wallet: null,
        transactions: [],
        pendingPayments: [],
        refundRequests: [],
        paymentMethods: [],
        
        // UI state
        isLoading: false,
        isProcessingPayment: false,
        isLoadingTransactions: false,
        error: null,
        
        // Pagination and filtering
        transactionPage: 1,
        transactionLimit: 20,
        transactionFilter: 'all',
        hasMoreTransactions: true,
        
        // Payment packages and subscriptions
        availablePackages: mockPaymentPackages,
        availableSubscriptions: mockSubscriptionPlans,
        
        // Optimistic updates
        optimisticTransactions: [],
        optimisticBalance: null,
        
        // Wallet Management Actions
        initializeWallet: async (userId: number) => {
          set({ isLoading: true, error: null })
          
          try {
            let wallet = await paymentAPI.getWallet(userId)
            
            if (!wallet) {
              wallet = await paymentAPI.createWallet(userId)
            }
            
            set({ 
              wallet: {
                balance: wallet.balance,
                currency: wallet.currency,
                totalEarnings: wallet.totalEarnings || 0,
                totalSpent: wallet.totalSpent || 0,
                pendingAmount: wallet.pendingAmount || 0,
                lastTransactionAt: wallet.lastTransactionAt
              },
              isLoading: false 
            })
            
            // Load initial transactions
            await get().loadTransactions(userId, 1, true)
            
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize wallet',
              isLoading: false 
            })
          }
        },
        
        refreshWallet: async (userId: number) => {
          try {
            const wallet = await paymentAPI.getWallet(userId)
            
            if (wallet) {
              set({ 
                wallet: {
                  balance: wallet.balance,
                  currency: wallet.currency,
                  totalEarnings: wallet.totalEarnings || 0,
                  totalSpent: wallet.totalSpent || 0,
                  pendingAmount: wallet.pendingAmount || 0,
                  lastTransactionAt: wallet.lastTransactionAt
                },
                optimisticBalance: null // Clear optimistic balance on refresh
              })
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to refresh wallet' })
          }
        },
        
        // Transaction Actions
        loadTransactions: async (userId: number, page = 1, reset = false) => {
          set({ isLoadingTransactions: true, error: null })
          
          try {
            const { transactionFilter, transactionLimit } = get()
            const filter = transactionFilter === 'all' ? undefined : transactionFilter
            
            const newTransactions = await paymentAPI.getTransactionHistory(
              userId, 
              transactionLimit,
              filter
            )
            
            set(state => ({
              transactions: reset ? newTransactions : [...state.transactions, ...newTransactions],
              transactionPage: page,
              hasMoreTransactions: newTransactions.length === transactionLimit,
              isLoadingTransactions: false
            }))
            
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load transactions',
              isLoadingTransactions: false 
            })
          }
        },
        
        loadMoreTransactions: async (userId: number) => {
          const { transactionPage, hasMoreTransactions, isLoadingTransactions } = get()
          
          if (!hasMoreTransactions || isLoadingTransactions) return
          
          await get().loadTransactions(userId, transactionPage + 1, false)
        },
        
        setTransactionFilter: (filter: Transaction['type'] | 'all') => {
          set({ transactionFilter: filter, transactionPage: 1 })
        },
        
        // Payment Processing Actions
        processPayment: async (payment: Omit<PendingPayment, 'id' | 'createdAt' | 'status'>) => {
          const paymentId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          const pendingPayment: PendingPayment = {
            ...payment,
            id: paymentId,
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
          }
          
          set(state => ({
            pendingPayments: [...state.pendingPayments, pendingPayment]
          }))
          
          try {
            const paymentIntent = await paymentAPI.createPaymentIntent({
              userId: payment.sessionId || 0, // This should be passed properly
              amount: payment.amount,
              currency: payment.currency,
              type: payment.type as any,
              description: payment.description,
              sessionId: payment.sessionId,
              metadata: payment.metadata
            })
            
            // Update pending payment with payment intent ID
            set(state => ({
              pendingPayments: state.pendingPayments.map(p =>
                p.id === paymentId 
                  ? { ...p, paymentIntentId: paymentIntent.id, status: 'processing' }
                  : p
              )
            }))
            
            return paymentIntent.id
            
          } catch (error) {
            // Mark payment as failed
            set(state => ({
              pendingPayments: state.pendingPayments.map(p =>
                p.id === paymentId 
                  ? { ...p, status: 'failed' }
                  : p
              ),
              error: error instanceof Error ? error.message : 'Payment processing failed'
            }))
            throw error
          }
        },
        
        confirmPayment: async (paymentIntentId: string, paymentMethodId: string, userId: number) => {
          set({ isProcessingPayment: true, error: null })
          
          try {
            // Add optimistic transaction
            const pendingPayment = get().pendingPayments.find(p => p.paymentIntentId === paymentIntentId)
            
            if (pendingPayment) {
              get().addOptimisticTransaction({
                walletId: 0, // Will be set by API
                userId,
                type: pendingPayment.type === 'top-up' ? 'credit' : 'debit',
                amount: pendingPayment.amount,
                currency: pendingPayment.currency,
                description: pendingPayment.description,
                status: 'pending',
                balanceAfter: 0, // Will be calculated
                createdAt: new Date()
              })
              
              // Update optimistic balance
              const balanceChange = pendingPayment.type === 'top-up' ? pendingPayment.amount : -pendingPayment.amount
              get().updateOptimisticBalance(balanceChange)
            }
            
            await paymentAPI.confirmPayment({
              paymentIntentId,
              paymentMethodId,
              userId
            })
            
            // Remove from pending payments
            set(state => ({
              pendingPayments: state.pendingPayments.filter(p => p.paymentIntentId !== paymentIntentId),
              isProcessingPayment: false
            }))
            
            // Refresh wallet and transactions
            await get().refreshWallet(userId)
            await get().loadTransactions(userId, 1, true)
            
            // Clear optimistic updates
            get().clearOptimisticUpdates()
            
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Payment confirmation failed',
              isProcessingPayment: false 
            })
            
            // Clear optimistic updates on error
            get().clearOptimisticUpdates()
            throw error
          }
        },
        
        cancelPayment: (paymentId: string) => {
          set(state => ({
            pendingPayments: state.pendingPayments.filter(p => p.id !== paymentId)
          }))
        },
        
        // Top-up and Withdrawal Actions
        topUpWallet: async (userId: number, amount: number, paymentMethodId: string) => {
          try {
            const paymentIntentId = await get().processPayment({
              type: 'top-up',
              amount,
              currency: 'usd',
              description: `Wallet top-up: ${formatCurrency(amount)}`,
              metadata: { type: 'wallet_topup' }
            })
            
            await get().confirmPayment(paymentIntentId, paymentMethodId, userId)
            
          } catch (error) {
            throw error
          }
        },
        
        requestWithdrawal: async (userId: number, amount: number, bankAccountId: string) => {
          set({ isProcessingPayment: true, error: null })
          
          try {
            // Add optimistic transaction
            get().addOptimisticTransaction({
              walletId: 0,
              userId,
              type: 'withdrawal',
              amount,
              currency: 'usd',
              description: `Withdrawal to account ending in ${bankAccountId.slice(-4)}`,
              status: 'pending',
              balanceAfter: 0,
              createdAt: new Date()
            })
            
            // Update optimistic balance
            get().updateOptimisticBalance(-amount)
            
            await paymentAPI.withdrawFromWallet({
              userId,
              amount,
              currency: 'usd',
              bankAccountId
            })
            
            set({ isProcessingPayment: false })
            
            // Refresh wallet and transactions
            await get().refreshWallet(userId)
            await get().loadTransactions(userId, 1, true)
            
            // Clear optimistic updates
            get().clearOptimisticUpdates()
            
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Withdrawal failed',
              isProcessingPayment: false 
            })
            
            // Clear optimistic updates on error
            get().clearOptimisticUpdates()
            throw error
          }
        },
        
        // Refund Actions
        requestRefund: async (paymentId: number, amount: number, reason: string) => {
          const requestId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          const refundRequest: RefundRequest = {
            id: requestId,
            paymentId,
            amount,
            reason,
            status: 'pending',
            requestedAt: new Date()
          }
          
          set(state => ({
            refundRequests: [...state.refundRequests, refundRequest]
          }))
          
          try {
            await paymentAPI.processRefund({
              paymentId,
              amount,
              reason
            })
            
            // Update refund request status
            set(state => ({
              refundRequests: state.refundRequests.map(r =>
                r.id === requestId 
                  ? { ...r, status: 'processed', processedAt: new Date() }
                  : r
              )
            }))
            
          } catch (error) {
            // Update refund request status to rejected
            set(state => ({
              refundRequests: state.refundRequests.map(r =>
                r.id === requestId 
                  ? { ...r, status: 'rejected', processedAt: new Date() }
                  : r
              ),
              error: error instanceof Error ? error.message : 'Refund request failed'
            }))
            throw error
          }
        },
        
        cancelRefundRequest: (requestId: string) => {
          set(state => ({
            refundRequests: state.refundRequests.filter(r => r.id !== requestId)
          }))
        },
        
        // Payment Methods Actions
        loadPaymentMethods: async (userId: number) => {
          try {
            const paymentMethods = await paymentAPI.getPaymentMethods(userId)
            set({ paymentMethods })
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load payment methods' })
          }
        },
        
        addPaymentMethod: async (userId: number, paymentMethodId: string) => {
          try {
            const newPaymentMethod = await paymentAPI.addPaymentMethod(userId, paymentMethodId)
            set(state => ({
              paymentMethods: [...state.paymentMethods, newPaymentMethod]
            }))
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to add payment method' })
            throw error
          }
        },
        
        removePaymentMethod: async (userId: number, paymentMethodId: string) => {
          try {
            await paymentAPI.removePaymentMethod(userId, paymentMethodId)
            set(state => ({
              paymentMethods: state.paymentMethods.filter(pm => pm.id !== paymentMethodId)
            }))
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to remove payment method' })
            throw error
          }
        },
        
        setDefaultPaymentMethod: async (userId: number, paymentMethodId: string) => {
          try {
            await paymentAPI.setDefaultPaymentMethod(userId, paymentMethodId)
            set(state => ({
              paymentMethods: state.paymentMethods.map(pm => ({
                ...pm,
                is_default: pm.id === paymentMethodId
              }))
            }))
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to set default payment method' })
            throw error
          }
        },
        
        // Package and Subscription Actions
        loadPaymentPackages: async () => {
          // In a real app, this would fetch from API
          set({ availablePackages: mockPaymentPackages })
        },
        
        loadSubscriptionPlans: async () => {
          // In a real app, this would fetch from API
          set({ availableSubscriptions: mockSubscriptionPlans })
        },
        
        purchasePackage: async (userId: number, packageId: string, paymentMethodId: string) => {
          const packageData = get().availablePackages.find(p => p.id === packageId)
          
          if (!packageData) {
            throw new Error('Package not found')
          }
          
          try {
            const paymentIntentId = await get().processPayment({
              type: 'package',
              amount: packageData.price,
              currency: packageData.currency,
              description: `Package: ${packageData.name}`,
              metadata: { 
                packageId,
                credits: packageData.credits,
                validityDays: packageData.validityDays
              }
            })
            
            await get().confirmPayment(paymentIntentId, paymentMethodId, userId)
            
          } catch (error) {
            throw error
          }
        },
        
        subscribeToplan: async (userId: number, planId: string, paymentMethodId: string) => {
          const planData = get().availableSubscriptions.find(p => p.id === planId)
          
          if (!planData) {
            throw new Error('Subscription plan not found')
          }
          
          try {
            await paymentAPI.createSubscription(userId, planId, paymentMethodId)
            
            // Refresh wallet after subscription
            await get().refreshWallet(userId)
            await get().loadTransactions(userId, 1, true)
            
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Subscription failed' })
            throw error
          }
        },
        
        // Utility Actions
        clearError: () => set({ error: null }),
        
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        
        // Optimistic Update Helpers
        addOptimisticTransaction: (transaction: Omit<Transaction, 'id'>) => {
          const optimisticTransaction: Transaction = {
            ...transaction,
            id: Date.now(), // Temporary ID
            status: 'pending'
          }
          
          set(state => ({
            optimisticTransactions: [...state.optimisticTransactions, optimisticTransaction]
          }))
        },
        
        removeOptimisticTransaction: (tempId: string) => {
          set(state => ({
            optimisticTransactions: state.optimisticTransactions.filter(t => t.id.toString() !== tempId)
          }))
        },
        
        updateOptimisticBalance: (amount: number) => {
          const { wallet } = get()
          if (wallet) {
            set({ optimisticBalance: wallet.balance + amount })
          }
        },
        
        clearOptimisticUpdates: () => {
          set({ optimisticTransactions: [], optimisticBalance: null })
        },
        
        // Computed Getters
        getFormattedBalance: () => {
          const { wallet, optimisticBalance } = get()
          const balance = optimisticBalance !== null ? optimisticBalance : wallet?.balance || 0
          return formatCurrency(balance, wallet?.currency)
        },
        
        getFormattedAmount: (amount: number, currency?: string) => {
          const { wallet } = get()
          return formatCurrency(amount, currency || wallet?.currency)
        },
        
        getPendingAmount: () => {
          const { pendingPayments } = get()
          return pendingPayments
            .filter(p => p.status === 'pending' || p.status === 'processing')
            .reduce((sum, p) => sum + p.amount, 0)
        },
        
        getTransactionsByType: (type: Transaction['type']) => {
          const { transactions, optimisticTransactions } = get()
          const allTransactions = [...transactions, ...optimisticTransactions]
          return allTransactions.filter(t => t.type === type)
        },
        
        getRecentTransactions: (limit = 5) => {
          const { transactions, optimisticTransactions } = get()
          const allTransactions = [...optimisticTransactions, ...transactions]
          return allTransactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
        },
        
        canWithdraw: (amount: number) => {
          const { wallet, optimisticBalance } = get()
          const availableBalance = optimisticBalance !== null ? optimisticBalance : wallet?.balance || 0
          return availableBalance >= amount && amount > 0
        },
        
        getAvailableBalance: () => {
          const { wallet, optimisticBalance } = get()
          const balance = optimisticBalance !== null ? optimisticBalance : wallet?.balance || 0
          const pendingAmount = get().getPendingAmount()
          return Math.max(0, balance - pendingAmount)
        }
      }),
      {
        name: 'wallet-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          wallet: state.wallet,
          transactions: state.transactions.slice(0, 50), // Only persist recent transactions
          paymentMethods: state.paymentMethods,
          refundRequests: state.refundRequests,
          transactionFilter: state.transactionFilter
        }),
        onRehydrateStorage: () => (state) => {
          // Clear optimistic updates on rehydration
          if (state) {
            state.optimisticTransactions = []
            state.optimisticBalance = null
            state.isLoading = false
            state.isProcessingPayment = false
            state.isLoadingTransactions = false
            state.error = null
          }
        }
      }
    ),
    {
      name: 'wallet-store'
    }
  )
)

// Auto-cleanup expired pending payments
setInterval(() => {
  const state = useWalletStore.getState()
  const now = new Date()
  
  const expiredPayments = state.pendingPayments.filter(p => 
    p.expiresAt && p.expiresAt < now && p.status === 'pending'
  )
  
  if (expiredPayments.length > 0) {
    useWalletStore.setState(state => ({
      pendingPayments: state.pendingPayments.filter(p => 
        !p.expiresAt || p.expiresAt >= now || p.status !== 'pending'
      )
    }))
  }
}, 60000) // Check every minute

// Export types for use in components
export type { 
  WalletState, 
  WalletBalance, 
  Transaction, 
  PendingPayment, 
  RefundRequest, 
  PaymentPackage, 
  SubscriptionPlan 
}
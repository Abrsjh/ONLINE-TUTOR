import { db, Payment, Wallet, Transaction, User } from '../db/index';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key';
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Payment types and interfaces
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentRequest {
  userId: number;
  amount: number;
  currency: string;
  type: Payment['type'];
  description: string;
  sessionId?: number;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentRequest {
  paymentIntentId: string;
  paymentMethodId: string;
  userId: number;
}

export interface RefundRequest {
  paymentId: number;
  amount?: number; // partial refund if specified
  reason: string;
}

export interface WalletTopUpRequest {
  userId: number;
  amount: number;
  currency: string;
  paymentMethodId: string;
}

export interface WithdrawRequest {
  userId: number;
  amount: number;
  currency: string;
  bankAccountId: string;
}

export interface InvoiceData {
  paymentId: number;
  userId: number;
  items: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
    account_type: string;
  };
  is_default: boolean;
}

// Mock Stripe API responses for development
const mockStripeResponses = {
  createPaymentIntent: (amount: number, currency: string): PaymentIntent => ({
    id: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    currency,
    status: 'requires_payment_method',
    client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
    metadata: {}
  }),

  confirmPayment: (paymentIntentId: string): PaymentIntent => ({
    id: paymentIntentId,
    amount: 5000, // Mock amount
    currency: 'usd',
    status: 'succeeded',
    client_secret: `${paymentIntentId}_secret`,
    metadata: {}
  }),

  createRefund: (paymentIntentId: string, amount?: number) => ({
    id: `re_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    payment_intent: paymentIntentId,
    amount: amount || 5000,
    currency: 'usd',
    status: 'succeeded',
    reason: 'requested_by_customer'
  })
};

// Payment API class
export class PaymentAPI {
  private static instance: PaymentAPI;
  private stripe: Stripe | null = null;

  private constructor() {
    this.initializeStripe();
  }

  public static getInstance(): PaymentAPI {
    if (!PaymentAPI.instance) {
      PaymentAPI.instance = new PaymentAPI();
    }
    return PaymentAPI.instance;
  }

  private async initializeStripe(): Promise<void> {
    try {
      this.stripe = await getStripe();
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  // Wallet Management
  async getWallet(userId: number): Promise<Wallet | null> {
    try {
      const wallet = await db.getWalletByUser(userId);
      return wallet || null;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw new Error('Failed to fetch wallet');
    }
  }

  async createWallet(userId: number, currency: string = 'usd'): Promise<Wallet> {
    try {
      const existingWallet = await db.getWalletByUser(userId);
      if (existingWallet) {
        throw new Error('Wallet already exists for this user');
      }

      const walletData: Omit<Wallet, 'id'> = {
        userId,
        balance: 0,
        currency,
        totalEarnings: 0,
        totalSpent: 0,
        pendingAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const walletId = await db.wallets.add(walletData);
      return { ...walletData, id: walletId };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  async updateWalletBalance(userId: number, amount: number, type: Transaction['type'], description: string, referenceId?: string, referenceType?: string): Promise<void> {
    try {
      await db.transaction('rw', [db.wallets, db.transactions], async () => {
        let wallet = await db.getWalletByUser(userId);
        
        if (!wallet) {
          wallet = await this.createWallet(userId);
        }

        const newBalance = wallet.balance + amount;
        
        if (newBalance < 0 && type === 'debit') {
          throw new Error('Insufficient funds');
        }

        // Update wallet
        await db.wallets.update(wallet.id!, {
          balance: newBalance,
          lastTransactionAt: new Date(),
          updatedAt: new Date(),
          ...(type === 'earning' && { totalEarnings: (wallet.totalEarnings || 0) + amount }),
          ...(type === 'debit' && { totalSpent: (wallet.totalSpent || 0) + Math.abs(amount) })
        });

        // Create transaction record
        const transactionData: Omit<Transaction, 'id'> = {
          walletId: wallet.id!,
          userId,
          type,
          amount: Math.abs(amount),
          currency: wallet.currency,
          description,
          referenceId,
          referenceType,
          balanceAfter: newBalance,
          createdAt: new Date()
        };

        await db.transactions.add(transactionData);
      });
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  async getTransactionHistory(userId: number, limit?: number, type?: Transaction['type']): Promise<Transaction[]> {
    try {
      let transactions = await db.getTransactionHistory(userId, limit);
      
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw new Error('Failed to fetch transaction history');
    }
  }

  // Payment Processing
  async createPaymentIntent(request: CreatePaymentRequest): Promise<PaymentIntent> {
    try {
      // In a real implementation, this would call Stripe's API
      // For now, we'll use mock data and store the payment record
      const paymentIntent = mockStripeResponses.createPaymentIntent(request.amount, request.currency);

      const paymentData: Omit<Payment, 'id'> = {
        userId: request.userId,
        sessionId: request.sessionId,
        type: request.type,
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        paymentMethod: 'card',
        stripePaymentIntentId: paymentIntent.id,
        description: request.description,
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.payments.add(paymentData);

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPayment(request: ProcessPaymentRequest): Promise<Payment> {
    try {
      // Mock Stripe payment confirmation
      const confirmedPayment = mockStripeResponses.confirmPayment(request.paymentIntentId);

      // Update payment record in database
      const payment = await db.payments.where('stripePaymentIntentId').equals(request.paymentIntentId).first();
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      const updatedPayment: Partial<Payment> = {
        status: confirmedPayment.status === 'succeeded' ? 'completed' : 'failed',
        processedAt: new Date(),
        updatedAt: new Date()
      };

      await db.payments.update(payment.id!, updatedPayment);

      // If payment succeeded, update wallet balance
      if (confirmedPayment.status === 'succeeded') {
        if (payment.type === 'session' || payment.type === 'package' || payment.type === 'subscription') {
          // Debit from student's wallet or add to tutor's wallet
          await this.updateWalletBalance(
            payment.userId,
            payment.type === 'session' ? -payment.amount : payment.amount,
            payment.type === 'session' ? 'debit' : 'credit',
            payment.description,
            payment.id!.toString(),
            'payment'
          );
        }
      }

      return { ...payment, ...updatedPayment };
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  async processRefund(request: RefundRequest): Promise<Payment> {
    try {
      const payment = await db.payments.get(request.paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      const refundAmount = request.amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed original payment amount');
      }

      // Mock Stripe refund
      const stripeRefund = mockStripeResponses.createRefund(payment.stripePaymentIntentId!, refundAmount);

      // Update payment record
      const updatedPayment: Partial<Payment> = {
        status: 'refunded',
        refundedAt: new Date(),
        refundAmount,
        updatedAt: new Date()
      };

      await db.payments.update(payment.id!, updatedPayment);

      // Create refund transaction
      await this.updateWalletBalance(
        payment.userId,
        refundAmount,
        'refund',
        `Refund for ${payment.description}`,
        payment.id!.toString(),
        'refund'
      );

      // Create separate refund payment record
      const refundPaymentData: Omit<Payment, 'id'> = {
        userId: payment.userId,
        sessionId: payment.sessionId,
        type: 'refund',
        amount: refundAmount,
        currency: payment.currency,
        status: 'completed',
        paymentMethod: payment.paymentMethod,
        stripePaymentIntentId: stripeRefund.id,
        description: `Refund: ${request.reason}`,
        metadata: { originalPaymentId: payment.id, reason: request.reason },
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.payments.add(refundPaymentData);

      return { ...payment, ...updatedPayment };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Wallet Top-up and Withdrawal
  async topUpWallet(request: WalletTopUpRequest): Promise<Payment> {
    try {
      const paymentIntent = await this.createPaymentIntent({
        userId: request.userId,
        amount: request.amount,
        currency: request.currency,
        type: 'package',
        description: `Wallet top-up: ${request.amount / 100} ${request.currency.toUpperCase()}`
      });

      const confirmedPayment = await this.confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: request.paymentMethodId,
        userId: request.userId
      });

      // Add credits to wallet
      await this.updateWalletBalance(
        request.userId,
        request.amount,
        'credit',
        'Wallet top-up',
        confirmedPayment.id!.toString(),
        'top-up'
      );

      return confirmedPayment;
    } catch (error) {
      console.error('Error topping up wallet:', error);
      throw error;
    }
  }

  async withdrawFromWallet(request: WithdrawRequest): Promise<Transaction> {
    try {
      const wallet = await db.getWalletByUser(request.userId);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < request.amount) {
        throw new Error('Insufficient funds for withdrawal');
      }

      // In a real implementation, this would initiate a bank transfer via Stripe
      // For now, we'll simulate the withdrawal
      await this.updateWalletBalance(
        request.userId,
        -request.amount,
        'withdrawal',
        `Withdrawal to bank account ending in ${request.bankAccountId.slice(-4)}`,
        request.bankAccountId,
        'withdrawal'
      );

      const transactions = await db.getTransactionHistory(request.userId, 1);
      return transactions[0];
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  }

  // Payment Methods Management
  async getPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    try {
      // Mock payment methods - in real implementation, fetch from Stripe
      return [
        {
          id: 'pm_mock_card_1',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          },
          is_default: true
        },
        {
          id: 'pm_mock_card_2',
          type: 'card',
          card: {
            brand: 'mastercard',
            last4: '5555',
            exp_month: 8,
            exp_year: 2026
          },
          is_default: false
        }
      ];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error('Failed to fetch payment methods');
    }
  }

  async addPaymentMethod(userId: number, paymentMethodId: string): Promise<PaymentMethod> {
    try {
      // Mock adding payment method - in real implementation, attach to Stripe customer
      const newPaymentMethod: PaymentMethod = {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '1234',
          exp_month: 12,
          exp_year: 2025
        },
        is_default: false
      };

      return newPaymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }

  async removePaymentMethod(userId: number, paymentMethodId: string): Promise<void> {
    try {
      // Mock removing payment method - in real implementation, detach from Stripe customer
      console.log(`Removing payment method ${paymentMethodId} for user ${userId}`);
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error('Failed to remove payment method');
    }
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: string): Promise<void> {
    try {
      // Mock setting default payment method - in real implementation, update Stripe customer
      console.log(`Setting payment method ${paymentMethodId} as default for user ${userId}`);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  // Invoice Generation
  async generateInvoice(data: InvoiceData): Promise<string> {
    try {
      const payment = await db.payments.get(data.paymentId);
      const user = await db.users.get(data.userId);

      if (!payment || !user) {
        throw new Error('Payment or user not found');
      }

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = data.taxRate ? subtotal * (data.taxRate / 100) : 0;
      const discountAmount = data.discountAmount || 0;
      const total = subtotal + taxAmount - discountAmount;

      // Generate invoice HTML
      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice #${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .invoice-details { margin-bottom: 30px; }
            .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f5f5f5; }
            .totals { text-align: right; }
            .total-row { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TutorPlatform Invoice</h1>
            <h2>Invoice #${payment.id}</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Payment Date:</strong> ${payment.processedAt?.toLocaleDateString() || 'Pending'}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>

          <div class="billing-info">
            <div>
              <h3>Bill To:</h3>
              <p>${user.firstName} ${user.lastName}</p>
              <p>${user.email}</p>
            </div>
            <div>
              <h3>From:</h3>
              <p>TutorPlatform Inc.</p>
              <p>123 Education Street</p>
              <p>Learning City, LC 12345</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${(item.unitPrice / 100).toFixed(2)}</td>
                  <td>$${(item.total / 100).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <p>Subtotal: $${(subtotal / 100).toFixed(2)}</p>
            ${data.taxRate ? `<p>Tax (${data.taxRate}%): $${(taxAmount / 100).toFixed(2)}</p>` : ''}
            ${discountAmount > 0 ? `<p>Discount: -$${(discountAmount / 100).toFixed(2)}</p>` : ''}
            <p class="total-row">Total: $${(total / 100).toFixed(2)}</p>
          </div>

          <div style="margin-top: 40px; font-size: 0.9em; color: #666;">
            <p>Thank you for using TutorPlatform!</p>
            <p>For questions about this invoice, please contact support@tutorplatform.com</p>
          </div>
        </body>
        </html>
      `;

      return invoiceHtml;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error('Failed to generate invoice');
    }
  }

  // Analytics and Reporting
  async getPaymentAnalytics(userId: number, startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    paymentsByType: Record<string, number>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  }> {
    try {
      const payments = await db.payments
        .where('userId')
        .equals(userId)
        .and(payment => 
          payment.createdAt >= startDate && 
          payment.createdAt <= endDate && 
          payment.status === 'completed'
        )
        .toArray();

      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalTransactions = payments.length;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      const paymentsByType = payments.reduce((acc, payment) => {
        acc[payment.type] = (acc[payment.type] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);

      // Group by month
      const monthlyRevenue = payments.reduce((acc, payment) => {
        const month = payment.createdAt.toISOString().slice(0, 7); // YYYY-MM
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.revenue += payment.amount;
        } else {
          acc.push({ month, revenue: payment.amount });
        }
        return acc;
      }, [] as Array<{ month: string; revenue: number }>);

      return {
        totalRevenue,
        totalTransactions,
        averageTransactionValue,
        paymentsByType,
        monthlyRevenue
      };
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw new Error('Failed to fetch payment analytics');
    }
  }

  // Subscription Management
  async createSubscription(userId: number, planId: string, paymentMethodId: string): Promise<Payment> {
    try {
      // Mock subscription creation
      const subscriptionAmount = this.getSubscriptionAmount(planId);
      
      const payment = await this.createPaymentIntent({
        userId,
        amount: subscriptionAmount,
        currency: 'usd',
        type: 'subscription',
        description: `Subscription: ${planId}`,
        metadata: { planId, isRecurring: 'true' }
      });

      return await this.confirmPayment({
        paymentIntentId: payment.id,
        paymentMethodId,
        userId
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  private getSubscriptionAmount(planId: string): number {
    const plans: Record<string, number> = {
      'basic': 999, // $9.99
      'premium': 1999, // $19.99
      'pro': 4999 // $49.99
    };
    return plans[planId] || 999;
  }

  // Dispute Management
  async handleDispute(paymentId: number, reason: string): Promise<void> {
    try {
      const payment = await db.payments.get(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status to disputed
      await db.payments.update(paymentId, {
        status: 'failed', // In real implementation, you'd have a 'disputed' status
        metadata: { 
          ...payment.metadata, 
          disputeReason: reason,
          disputedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      });

      // Create notification for admin
      await db.notifications.add({
        userId: 1, // Admin user ID
        type: 'system',
        title: 'Payment Dispute',
        message: `Payment #${paymentId} has been disputed: ${reason}`,
        data: { paymentId, reason },
        isRead: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error handling dispute:', error);
      throw new Error('Failed to handle dispute');
    }
  }
}

// Export singleton instance
export const paymentAPI = PaymentAPI.getInstance();

// Export utility functions
export const formatCurrency = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount / 100);
};

export const calculatePlatformFee = (amount: number, feePercentage: number = 5): number => {
  return Math.round(amount * (feePercentage / 100));
};

export const validatePaymentAmount = (amount: number, currency: string = 'usd'): boolean => {
  const minimumAmounts: Record<string, number> = {
    'usd': 50, // $0.50
    'eur': 50, // €0.50
    'gbp': 30  // £0.30
  };
  
  return amount >= (minimumAmounts[currency.toLowerCase()] || 50);
};

// Export types
export type {
  PaymentIntent,
  CreatePaymentRequest,
  ProcessPaymentRequest,
  RefundRequest,
  WalletTopUpRequest,
  WithdrawRequest,
  InvoiceData,
  InvoiceItem,
  PaymentMethod
};
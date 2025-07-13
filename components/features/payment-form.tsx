"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  Wallet,
  Building2,
  Shield,
  AlertCircle,
  CheckCircle,
  Lock,
  User,
  Mail,
  MapPin,
} from "lucide-react"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Payment form validation schema
const paymentFormSchema = z.object({
  paymentMethod: z.enum(["card", "wallet", "bank"], {
    required_error: "Please select a payment method",
  }),
  savePaymentMethod: z.boolean().default(false),
  billingAddress: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

// Payment method options
const paymentMethods = [
  {
    id: "card" as const,
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
    popular: true,
  },
  {
    id: "wallet" as const,
    name: "Digital Wallet",
    description: "Apple Pay, Google Pay, PayPal",
    icon: Wallet,
    popular: false,
  },
  {
    id: "bank" as const,
    name: "Bank Transfer",
    description: "Direct bank account transfer",
    icon: Building2,
    popular: false,
  },
]

// Country options for billing address
const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
]

export interface PaymentFormProps {
  amount: number
  currency?: string
  description?: string
  clientSecret?: string
  onSuccess?: (paymentIntent: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
  loading?: boolean
  className?: string
  showBillingAddress?: boolean
  allowSavePaymentMethod?: boolean
  metadata?: Record<string, string>
}

// Main Payment Form Component
const PaymentFormContent: React.FC<PaymentFormProps> = ({
  amount,
  currency = "usd",
  description,
  onSuccess,
  onError,
  onCancel,
  loading: externalLoading = false,
  className,
  showBillingAddress = true,
  allowSavePaymentMethod = true,
  metadata = {},
}) => {
  const stripe = useStripe()
  const elements = useElements()
  
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "card",
      savePaymentMethod: false,
      billingAddress: {
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      },
      terms: false,
    },
    mode: "onChange",
  })

  const selectedPaymentMethod = watch("paymentMethod")
  const isLoading = processing || externalLoading

  // Format amount for display
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  // Handle card element changes
  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null)
    setCardComplete(event.complete)
  }

  // Handle form submission
  const onSubmit = async (data: PaymentFormData) => {
    if (!stripe || !elements) {
      setPaymentError("Stripe has not loaded yet. Please try again.")
      return
    }

    setProcessing(true)
    setPaymentError(null)

    try {
      let result

      if (data.paymentMethod === "card") {
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          throw new Error("Card element not found")
        }

        // Create payment method
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: `${data.billingAddress.firstName} ${data.billingAddress.lastName}`,
            email: data.billingAddress.email,
            address: {
              line1: data.billingAddress.address,
              city: data.billingAddress.city,
              state: data.billingAddress.state,
              postal_code: data.billingAddress.postalCode,
              country: data.billingAddress.country,
            },
          },
        })

        if (paymentMethodError) {
          throw new Error(paymentMethodError.message)
        }

        // Confirm payment (this would typically use a client secret from your backend)
        result = await stripe.confirmCardPayment("pi_test_client_secret", {
          payment_method: paymentMethod.id,
        })
      } else {
        // Handle other payment methods (wallet, bank transfer)
        // This would typically involve different Stripe APIs
        throw new Error(`${data.paymentMethod} payment method not implemented yet`)
      }

      if (result.error) {
        throw new Error(result.error.message)
      }

      setPaymentSuccess(true)
      onSuccess?.(result.paymentIntent)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setPaymentError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "hsl(var(--foreground))",
        fontFamily: "system-ui, sans-serif",
        "::placeholder": {
          color: "hsl(var(--muted-foreground))",
        },
        iconColor: "hsl(var(--muted-foreground))",
      },
      invalid: {
        color: "hsl(var(--destructive))",
        iconColor: "hsl(var(--destructive))",
      },
    },
    hidePostalCode: !showBillingAddress,
  }

  if (paymentSuccess) {
    return (
      <div className={cn("space-y-6 text-center", className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your payment of {formatAmount(amount, currency)} has been processed successfully.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
      {/* Payment Summary */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Payment Summary</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatAmount(amount, currency)}</div>
            <div className="text-xs text-muted-foreground uppercase">{currency}</div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Payment Method
        </h3>
        
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <div className="grid gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = field.value === method.id
                
                return (
                  <label
                    key={method.id}
                    className={cn(
                      "relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="radio"
                      value={method.id}
                      checked={isSelected}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{method.name}</span>
                        {method.popular && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-primary" : "border-muted-foreground"
                      )}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        />
        {errors.paymentMethod && (
          <p className="text-sm text-destructive flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      {/* Card Details */}
      {selectedPaymentMethod === "card" && (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Card Details
          </h4>
          
          <div className="rounded-lg border p-4 bg-background">
            <CardElement
              options={cardElementOptions}
              onChange={handleCardChange}
            />
          </div>
          
          {cardError && (
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {cardError}
            </p>
          )}

          {allowSavePaymentMethod && (
            <Controller
              name="savePaymentMethod"
              control={control}
              render={({ field }) => (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Save this payment method for future use</span>
                </label>
              )}
            />
          )}
        </div>
      )}

      {/* Billing Address */}
      {showBillingAddress && (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Billing Address
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="billingAddress.firstName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="First Name"
                  placeholder="John"
                  error={errors.billingAddress?.firstName?.message}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
              )}
            />
            
            <Controller
              name="billingAddress.lastName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.billingAddress?.lastName?.message}
                  required
                />
              )}
            />
          </div>

          <Controller
            name="billingAddress.email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                label="Email Address"
                placeholder="john.doe@example.com"
                error={errors.billingAddress?.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
            )}
          />

          <Controller
            name="billingAddress.address"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Street Address"
                placeholder="123 Main Street"
                error={errors.billingAddress?.address?.message}
                required
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="billingAddress.city"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="City"
                  placeholder="New York"
                  error={errors.billingAddress?.city?.message}
                  required
                />
              )}
            />
            
            <Controller
              name="billingAddress.state"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="State/Province"
                  placeholder="NY"
                  error={errors.billingAddress?.state?.message}
                  required
                />
              )}
            />
            
            <Controller
              name="billingAddress.postalCode"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Postal Code"
                  placeholder="10001"
                  error={errors.billingAddress?.postalCode?.message}
                  required
                />
              )}
            />
          </div>

          <Controller
            name="billingAddress.country"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Country <span className="text-destructive">*</span>
                </label>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.billingAddress?.country && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.billingAddress.country.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* Terms and Conditions */}
      <Controller
        name="terms"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="mt-1 rounded border-input"
              />
              <span className="text-sm">
                I agree to the{" "}
                <a href="/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.terms && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.terms.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Error Display */}
      {paymentError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Payment Error</span>
          </div>
          <p className="text-sm text-destructive mt-1">{paymentError}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm">
            Your payment information is encrypted and secure. We use industry-standard SSL encryption.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="sm:w-auto"
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          loading={isLoading}
          loadingText="Processing Payment..."
          disabled={
            !stripe ||
            !isValid ||
            (selectedPaymentMethod === "card" && (!cardComplete || !!cardError)) ||
            isLoading
          }
          className="flex-1 sm:flex-none"
        >
          <Lock className="h-4 w-4 mr-2" />
          Pay {formatAmount(amount, currency)}
        </Button>
      </div>
    </form>
  )
}

// Wrapper component with Stripe Elements provider
export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const stripeOptions: StripeElementsOptions = {
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "hsl(var(--primary))",
        colorBackground: "hsl(var(--background))",
        colorText: "hsl(var(--foreground))",
        colorDanger: "hsl(var(--destructive))",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "6px",
      },
    },
    locale: "en",
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <PaymentFormContent {...props} />
    </Elements>
  )
}

export default PaymentForm
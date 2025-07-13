"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, AlertCircle, CheckCircle, Search, X } from "lucide-react"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-3 py-2 text-sm",
        lg: "h-11 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  loading?: boolean
  containerClassName?: string
  labelClassName?: string
  helperTextClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = "text",
      label,
      description,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      loading = false,
      containerClassName,
      labelClassName,
      helperTextClassName,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Determine the current variant based on validation states
    const currentVariant = error ? "error" : success ? "success" : warning ? "warning" : variant

    // Determine if we should show the clear button
    const showClearButton = clearable && value && !disabled && !loading

    // Handle password visibility toggle
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    // Handle clear button click
    const handleClear = () => {
      if (onClear) {
        onClear()
      }
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }

    // Determine the input type
    const inputType = type === "password" && showPassword ? "text" : type

    // Generate unique IDs for accessibility
    const inputId = React.useId()
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const successId = success ? `${inputId}-success` : undefined
    const warningId = warning ? `${inputId}-warning` : undefined

    // Combine all helper text IDs for aria-describedby
    const describedBy = [descriptionId, errorId, successId, warningId]
      .filter(Boolean)
      .join(" ") || undefined

    // Determine helper text and icon
    const helperText = error || success || warning || description
    const helperIcon = error ? (
      <AlertCircle className="h-4 w-4 text-destructive" />
    ) : success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : warning ? (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    ) : null

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              labelClassName
            )}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            ref={React.useMemo(() => {
              return (node: HTMLInputElement | null) => {
                inputRef.current = node
                if (typeof ref === "function") {
                  ref(node)
                } else if (ref) {
                  ref.current = node
                }
              }
            }, [ref])}
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              {
                "pl-10": leftIcon,
                "pr-10": rightIcon || type === "password" || showClearButton || loading,
                "pr-16": (type === "password" && showClearButton) || (loading && showClearButton),
              }
            )}
            disabled={disabled || loading}
            value={value}
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : "false"}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Loading Spinner */}
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent" />
            )}

            {/* Clear Button */}
            {showClearButton && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted"
                aria-label="Clear input"
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Password Toggle */}
            {type === "password" && !loading && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !loading && (
              <div className="text-muted-foreground">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper Text */}
        {helperText && (
          <div
            className={cn(
              "flex items-start space-x-2 text-sm",
              {
                "text-destructive": error,
                "text-green-600": success,
                "text-yellow-600": warning,
                "text-muted-foreground": !error && !success && !warning,
              },
              helperTextClassName
            )}
            id={errorId || successId || warningId || descriptionId}
            role={error ? "alert" : undefined}
            aria-live={error ? "polite" : undefined}
          >
            {helperIcon && <div className="mt-0.5 flex-shrink-0">{helperIcon}</div>}
            <span>{helperText}</span>
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (value: string) => void
  searchDelay?: number
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, searchDelay = 300, ...props }, ref) => {
    const [searchValue, setSearchValue] = React.useState(props.value || "")
    const searchTimeoutRef = React.useRef<NodeJS.Timeout>()

    React.useEffect(() => {
      if (onSearch && searchValue !== props.value) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
        
        searchTimeoutRef.current = setTimeout(() => {
          onSearch(searchValue as string)
        }, searchDelay)
      }

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current)
        }
      }
    }, [searchValue, onSearch, searchDelay, props.value])

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        placeholder="Search..."
        {...props}
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value)
          props.onChange?.(e)
        }}
        onClear={() => {
          setSearchValue("")
          props.onClear?.()
        }}
        clearable
      />
    )
  }
)

SearchInput.displayName = "SearchInput"

// Textarea Component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    Omit<VariantProps<typeof inputVariants>, "size"> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  containerClassName?: string
  labelClassName?: string
  helperTextClassName?: string
  resize?: "none" | "vertical" | "horizontal" | "both"
  maxLength?: number
  showCharCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      label,
      description,
      error,
      success,
      warning,
      containerClassName,
      labelClassName,
      helperTextClassName,
      resize = "vertical",
      maxLength,
      showCharCount = false,
      value,
      ...props
    },
    ref
  ) => {
    const currentVariant = error ? "error" : success ? "success" : warning ? "warning" : variant
    const charCount = typeof value === "string" ? value.length : 0

    // Generate unique IDs for accessibility
    const textareaId = React.useId()
    const descriptionId = description ? `${textareaId}-description` : undefined
    const errorId = error ? `${textareaId}-error` : undefined
    const successId = success ? `${textareaId}-success` : undefined
    const warningId = warning ? `${textareaId}-warning` : undefined

    // Combine all helper text IDs for aria-describedby
    const describedBy = [descriptionId, errorId, successId, warningId]
      .filter(Boolean)
      .join(" ") || undefined

    // Determine helper text and icon
    const helperText = error || success || warning || description
    const helperIcon = error ? (
      <AlertCircle className="h-4 w-4 text-destructive" />
    ) : success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : warning ? (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    ) : null

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                labelClassName
              )}
            >
              {label}
              {props.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {showCharCount && maxLength && (
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  charCount > maxLength && "text-destructive"
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            inputVariants({ variant: currentVariant, className }),
            "min-h-[80px] resize-none",
            {
              "resize-vertical": resize === "vertical",
              "resize-horizontal": resize === "horizontal",
              "resize": resize === "both",
            }
          )}
          value={value}
          maxLength={maxLength}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : "false"}
          {...props}
        />

        {/* Helper Text */}
        {helperText && (
          <div
            className={cn(
              "flex items-start space-x-2 text-sm",
              {
                "text-destructive": error,
                "text-green-600": success,
                "text-yellow-600": warning,
                "text-muted-foreground": !error && !success && !warning,
              },
              helperTextClassName
            )}
            id={errorId || successId || warningId || descriptionId}
            role={error ? "alert" : undefined}
            aria-live={error ? "polite" : undefined}
          >
            {helperIcon && <div className="mt-0.5 flex-shrink-0">{helperIcon}</div>}
            <span>{helperText}</span>
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Input, SearchInput, Textarea, inputVariants }
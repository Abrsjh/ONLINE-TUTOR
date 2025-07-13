import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "border-border shadow-md hover:shadow-lg",
        outlined: "border-2 border-border bg-transparent",
        filled: "border-transparent bg-muted",
        interactive: "border-border hover:border-primary/50 hover:shadow-md cursor-pointer",
        success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
        error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
        info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
      },
      size: {
        sm: "p-3",
        default: "p-6",
        lg: "p-8"
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        glow: "hover:ring-2 hover:ring-primary/20",
        scale: "hover:scale-[1.02]",
        border: "hover:border-primary/50"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "none"
    }
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "div"
    
    if (asChild) {
      return <React.Fragment {...props} />
    }

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, size, hover, className }))}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "compact" | "centered"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      {
        "p-6 pb-0": variant === "default",
        "p-4 pb-0": variant === "compact",
        "p-6 pb-0 text-center items-center": variant === "centered"
      },
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
    size?: "sm" | "default" | "lg"
  }
>(({ className, as: Comp = "h3", size = "default", ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight",
      {
        "text-sm": size === "sm",
        "text-lg": size === "default",
        "text-xl": size === "lg"
      },
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "sm" | "default"
  }
>(({ className, size = "default", ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-muted-foreground",
      {
        "text-xs": size === "sm",
        "text-sm": size === "default"
      },
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "compact" | "flush"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      {
        "p-6 pt-0": variant === "default",
        "p-4 pt-0": variant === "compact",
        "pt-0": variant === "flush"
      },
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "compact" | "centered" | "split"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      {
        "p-6 pt-0": variant === "default",
        "p-4 pt-0": variant === "compact",
        "p-6 pt-0 justify-center": variant === "centered",
        "p-6 pt-0 justify-between": variant === "split"
      },
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized card components for common use cases
const CardImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src: string
    alt: string
    aspectRatio?: "square" | "video" | "auto"
  }
>(({ className, src, alt, aspectRatio = "auto", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative overflow-hidden rounded-t-lg",
      {
        "aspect-square": aspectRatio === "square",
        "aspect-video": aspectRatio === "video"
      },
      className
    )}
    {...props}
  >
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
    />
  </div>
))
CardImage.displayName = "CardImage"

const CardBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "secondary" | "success" | "warning" | "error"
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  }
>(({ className, variant = "default", position = "top-right", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute z-10 rounded-full px-2 py-1 text-xs font-medium",
      {
        "bg-primary text-primary-foreground": variant === "default",
        "bg-secondary text-secondary-foreground": variant === "secondary",
        "bg-green-500 text-white": variant === "success",
        "bg-yellow-500 text-white": variant === "warning",
        "bg-red-500 text-white": variant === "error"
      },
      {
        "top-2 left-2": position === "top-left",
        "top-2 right-2": position === "top-right",
        "bottom-2 left-2": position === "bottom-left",
        "bottom-2 right-2": position === "bottom-right"
      },
      className
    )}
    {...props}
  />
))
CardBadge.displayName = "CardBadge"

const CardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    lines?: number
    showImage?: boolean
    showFooter?: boolean
  }
>(({ className, lines = 3, showImage = false, showFooter = false, ...props }, ref) => (
  <Card ref={ref} className={cn("animate-pulse", className)} {...props}>
    {showImage && (
      <div className="h-48 bg-muted rounded-t-lg" />
    )}
    <CardHeader>
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 bg-muted rounded",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </CardContent>
    {showFooter && (
      <CardFooter>
        <div className="h-8 bg-muted rounded w-20" />
      </CardFooter>
    )}
  </Card>
))
CardSkeleton.displayName = "CardSkeleton"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  CardBadge,
  CardSkeleton,
  cardVariants
}
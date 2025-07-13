"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const modalVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-[95vw] max-h-[95vh]",
        auto: "max-w-fit",
      },
      variant: {
        default: "border-border",
        destructive: "border-destructive/50 bg-destructive/5",
        success: "border-green-500/50 bg-green-50 dark:bg-green-950/20",
        warning: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20",
        info: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

const Modal = DialogPrimitive.Root

const ModalTrigger = DialogPrimitive.Trigger

const ModalPortal = DialogPrimitive.Portal

const ModalClose = DialogPrimitive.Close

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof modalVariants> & {
      showCloseButton?: boolean
      closeButtonClassName?: string
      overlayClassName?: string
    }
>(({ 
  className, 
  children, 
  size, 
  variant, 
  showCloseButton = true,
  closeButtonClassName,
  overlayClassName,
  ...props 
}, ref) => (
  <ModalPortal>
    <ModalOverlay className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(modalVariants({ size, variant }), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close 
          className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
            closeButtonClassName
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
))
ModalContent.displayName = DialogPrimitive.Content.displayName

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
))
ModalHeader.displayName = "ModalHeader"

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
))
ModalFooter.displayName = "ModalFooter"

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
ModalTitle.displayName = DialogPrimitive.Title.displayName

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ModalDescription.displayName = DialogPrimitive.Description.displayName

// Compound component for common modal patterns
interface ConfirmModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
  children?: React.ReactNode
}

const ConfirmModal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ConfirmModalProps
>(({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
  children,
}, ref) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
    } catch (error) {
      console.error("Error in confirm action:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent 
        ref={ref}
        size="sm" 
        variant={variant === "destructive" ? "destructive" : "default"}
      >
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </ModalHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        <ModalFooter>
          <ModalClose asChild>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              {cancelText}
            </button>
          </ModalClose>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || loading}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {(isLoading || loading) && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmText}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})
ConfirmModal.displayName = "ConfirmModal"

// Alert Modal for simple notifications
interface AlertModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  buttonText?: string
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  children?: React.ReactNode
}

const AlertModal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AlertModalProps
>(({
  open,
  onOpenChange,
  title,
  description,
  buttonText = "OK",
  variant = "default",
  children,
}, ref) => {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent ref={ref} size="sm" variant={variant}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </ModalHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        <ModalFooter>
          <ModalClose asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
                variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : variant === "success"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : variant === "warning"
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : variant === "info"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {buttonText}
            </button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})
AlertModal.displayName = "AlertModal"

// Custom hook for modal state management
export const useModal = (defaultOpen: boolean = false) => {
  const [open, setOpen] = React.useState(defaultOpen)

  const openModal = React.useCallback(() => setOpen(true), [])
  const closeModal = React.useCallback(() => setOpen(false), [])
  const toggleModal = React.useCallback(() => setOpen(prev => !prev), [])

  return {
    open,
    setOpen,
    openModal,
    closeModal,
    toggleModal,
  }
}

// Custom hook for confirm modal
export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<ConfirmModalProps, 'open' | 'onOpenChange'>>({
    title: '',
    onConfirm: () => {},
  })

  const confirm = React.useCallback((newConfig: Omit<ConfirmModalProps, 'open' | 'onOpenChange'>) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...newConfig,
        onConfirm: async () => {
          try {
            await newConfig.onConfirm()
            setIsOpen(false)
            resolve(true)
          } catch (error) {
            console.error('Confirm action failed:', error)
            resolve(false)
          }
        },
        onCancel: () => {
          setIsOpen(false)
          resolve(false)
          newConfig.onCancel?.()
        },
      })
      setIsOpen(true)
    })
  }, [])

  const ConfirmModalComponent = React.useCallback(() => (
    <ConfirmModal
      {...config}
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  ), [config, isOpen])

  return {
    confirm,
    ConfirmModal: ConfirmModalComponent,
  }
}

// Custom hook for alert modal
export const useAlertModal = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<AlertModalProps, 'open' | 'onOpenChange'>>({
    title: '',
  })

  const alert = React.useCallback((newConfig: Omit<AlertModalProps, 'open' | 'onOpenChange'>) => {
    return new Promise<void>((resolve) => {
      setConfig(newConfig)
      setIsOpen(true)
      
      // Auto-resolve when modal closes
      const originalOnOpenChange = newConfig.onOpenChange
      const handleOpenChange = (open: boolean) => {
        if (!open) {
          resolve()
        }
        originalOnOpenChange?.(open)
      }
      
      setConfig(prev => ({ ...prev, onOpenChange: handleOpenChange }))
    })
  }, [])

  const AlertModalComponent = React.useCallback(() => (
    <AlertModal
      {...config}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        config.onOpenChange?.(open)
      }}
    />
  ), [config, isOpen])

  return {
    alert,
    AlertModal: AlertModalComponent,
  }
}

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ConfirmModal,
  AlertModal,
  modalVariants,
}
import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, MotionProps } from "framer-motion"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow"
    size?: "default" | "sm" | "lg" | "icon"
}

// Wrapping motion.button
const MotionButton = motion.button;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            // @ts-ignore - ref compatibility
            <MotionButton
                ref={ref}
                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40":
                            variant === "default",
                        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20":
                            variant === "destructive",
                        "border border-white/10 bg-white/5 hover:bg-white/10 hover:text-accent-foreground backdrop-blur-sm":
                            variant === "outline",
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80":
                            variant === "secondary",
                        "hover:bg-white/5 hover:text-accent-foreground": variant === "ghost",
                        "text-primary underline-offset-4 hover:underline":
                            variant === "link",
                        "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]":
                            variant === "glow",
                        "h-10 px-4 py-2": size === "default",
                        "h-9 rounded-md px-3": size === "sm",
                        "h-11 rounded-md px-8": size === "lg",
                        "h-10 w-10 rounded-full": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }

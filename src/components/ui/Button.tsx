import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ElementType;
  as?: any; // NUEVO: Permite polimorfismo (usar como span, div, etc)
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  className = "",
  disabled,
  as: Component = "button", // Por defecto es un button
  ...props
}: ButtonProps) => {
  
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] shadow-md shadow-brand/20 focus:ring-brand",
    secondary: "bg-white text-[var(--color-ink)] border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    outline: "border-2 border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)]/5",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-[var(--color-ink)]",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Component>
  );
};
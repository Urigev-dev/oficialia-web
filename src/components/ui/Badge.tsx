import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export const Badge = ({ children, variant = "default", className = "" }: BadgeProps) => {
  const styles = {
    default: "bg-[var(--color-brand)]/10 text-[var(--color-brand)] border-[var(--color-brand)]/20",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "brand" | "warning" | "danger" | "neutral" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "brand",
  size = "md",
  ...props
}) => {
  const baseStyles = "inline-flex items-center font-semibold rounded-full";

  const variantStyles = {
    brand: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    neutral: "bg-stone-100 text-stone-700 border border-stone-200",
    outline: "bg-transparent text-stone-600 border border-stone-300",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 leading-tight",
    md: "text-xs px-2.5 py-1 leading-tight",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

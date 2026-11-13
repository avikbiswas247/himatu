"use client";

import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-sans text-black uppercase tracking-[0.15em] text-sm font-bold transition-colors active:bg-black/10 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-black text-white hover:bg-black active:bg-black/90",
    outline:
      "border border-black bg-transparent hover:bg-black hover:text-white",
    text: "hover:bg-black/5",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={[base, variants[variant], sizes[size], className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      {...props}
    />
  );
}

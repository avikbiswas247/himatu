"use client";

import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        "block w-full rounded-none border-0 border-b border-black/30 bg-transparent px-4 py-3 text-black font-sans text-sm leading-tight outline-none focus:border-b-2 focus:border-black transition-colors placeholder:text-black/40",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

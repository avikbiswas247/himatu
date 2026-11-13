"use client";

import * as React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={[
        "block text-xs font-bold uppercase tracking-widest text-black mb-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

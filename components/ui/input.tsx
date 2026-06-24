import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

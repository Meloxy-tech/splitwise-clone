import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-muted mb-1.5">{label}</span>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-card bg-surfaceRaised border border-border text-white placeholder:text-muted/60 focus:border-moss transition-colors"
      />
      {error && <span className="block text-owe text-xs mt-1.5">{error}</span>}
    </label>
  );
}

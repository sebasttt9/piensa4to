import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-white/90 mb-3 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-gradient-to-br from-white/8 to-white/4 border border-white/20 text-white placeholder-white/50',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-white/40 focus:shadow-[0_0_20px_rgba(167,139,250,0.2)]',
          'transition-all duration-300 backdrop-blur-sm',
          error && 'border-red-500/50 focus:ring-red-500/50 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-400 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-xs text-white/60">{helperText}</p>
      )}
    </div>
  );
}

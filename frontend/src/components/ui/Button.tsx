import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:
      'bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 text-white hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-purple-400',
    secondary:
      'bg-gradient-to-br from-white/15 to-white/10 text-white border border-white/20 hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:border-white/40 hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-white/40',
    ghost:
      'text-white/80 hover:bg-white/10 hover:text-white hover:shadow-lg hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-white/40',
    danger:
      'bg-gradient-to-br from-red-500/40 to-red-600/30 text-red-200 border border-red-500/40 hover:shadow-[0_15px_40px_rgba(239,68,68,0.2)] hover:border-red-400 hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-red-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

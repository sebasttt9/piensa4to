import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-gradient-to-br from-white/8 to-white/4 border border-white/15 backdrop-blur-xl shadow-lg hover:shadow-[0_20px_50px_rgba(167,139,250,0.2)] hover:border-white/25 hover:translate-y-[-2px]',
    elevated: 'bg-gradient-to-br from-white/12 via-white/8 to-white/4 border border-white/20 backdrop-blur-2xl shadow-2xl shadow-purple-900/30 hover:shadow-[0_30px_60px_rgba(99,102,241,0.4)] hover:translate-y-[-4px]',
    outlined: 'bg-gradient-to-br from-white/6 to-transparent border-2 border-white/20 backdrop-blur-lg hover:border-white/40 hover:bg-white/10 hover:shadow-lg',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300 ease-out',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('mb-4 flex items-start justify-between', className)} {...props} />;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-bold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent', className)} {...props} />
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-white/70', className)} {...props} />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('space-y-4', className)} {...props} />;
}

import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-transparent border border-white/15 hover:border-white/25',
    elevated: 'bg-transparent border border-white/20 hover:border-white/35',
    outlined: 'bg-transparent border-2 border-white/20 hover:border-white/35',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-colors duration-300 ease-out',
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

import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, icon, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92D20] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-[#D92D20] text-white hover:bg-[#B42318] shadow-sm shadow-red-200/50 active:bg-[#9B1C1D]',
      secondary:
        'bg-[#F9FAFB] text-[#171717] hover:bg-[#F2F4F7] border border-[#EAECF0] shadow-xs',
      success:
        'bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm shadow-green-200/50',
      outline:
        'border border-[#EAECF0] bg-white text-[#171717] hover:bg-[#F9FAFB] hover:border-[#D0D5DD]',
      ghost:
        'text-[#667085] hover:text-[#171717] hover:bg-[#F9FAFB]',
      danger:
        'bg-red-50 text-[#D92D20] border border-red-200 hover:bg-red-100',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2', // ~44px touch target
      lg: 'text-base px-6 py-3 min-h-[50px] gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

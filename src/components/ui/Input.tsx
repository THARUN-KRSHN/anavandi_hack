import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, id, ...props }, ref) => {
    const generatedId = id || React.useId();

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={generatedId} className="text-sm font-medium text-[#171717]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-[#667085] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={cn(
              'w-full bg-white border border-[#EAECF0] text-[#171717] placeholder-[#98A2B3] text-sm rounded-xl px-3.5 py-2.5 min-h-[44px] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:border-[#D92D20]',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs font-medium text-[#D92D20]">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-[#667085]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const generatedId = id || React.useId();

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={generatedId} className="text-sm font-medium text-[#171717]">
            {label}
          </label>
        )}
        <select
          id={generatedId}
          ref={ref}
          className={cn(
            'w-full bg-white border border-[#EAECF0] text-[#171717] text-sm rounded-xl px-3.5 py-2.5 min-h-[44px] transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:border-[#D92D20]',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs font-medium text-[#D92D20]">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 focus:ring-indigo-500/40',
  secondary:
    'bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 shadow-sm focus:ring-slate-500/40',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm shadow-red-500/20 focus:ring-red-500/40',
  ghost:
    'bg-transparent hover:bg-slate-700/50 active:bg-slate-700 text-slate-300 focus:ring-slate-500/40',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      disabled={isDisabled}
      {...rest}
    >
      {loading && (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      )}
      {children}
    </button>
  );
}

export default Button;

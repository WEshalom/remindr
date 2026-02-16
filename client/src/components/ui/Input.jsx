import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, type = 'text', className = '', ...rest },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon className="w-4.5 h-4.5 text-slate-500" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full bg-[#0f172a] border rounded-lg text-sm text-slate-100
            placeholder:text-slate-500
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : 'pl-3.5'}
            pr-3.5 py-2.5
            ${
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20'
            }
            ${className}
          `}
          {...rest}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export default Input;

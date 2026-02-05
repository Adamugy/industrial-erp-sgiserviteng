import React from 'react';

/**
 * Enhanced Badge component for status and priority display
 */
export const Badge: React.FC<{
    children: React.ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'priority-low' | 'priority-medium' | 'priority-high' | 'priority-urgent';
    className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => {
    const variants = {
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
        'priority-low': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500',
        'priority-medium': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
        'priority-high': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'priority-urgent': 'bg-red-500 text-white dark:bg-red-600',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

/**
 * Standard Card component
 */
export const Card: React.FC<{
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
    footer?: React.ReactNode;
}> = ({ children, title, subtitle, action, className = '', footer }) => {
    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm ${className}`}>
            {(title || action) && (
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>}
                        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-5">
                {children}
            </div>
            {footer && (
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    {footer}
                </div>
            )}
        </div>
    );
};

/**
 * Quick Stats Card
 */
export const StatsCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: string; positive: boolean };
    className?: string;
}> = ({ label, value, icon, trend, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 leading-none">
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value}</span>
                {trend && (
                    <span className={`text-[10px] font-semibold flex items-center ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * Standard Button wraps with common styles
 */
export const Button: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}> = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    size = 'md', 
    disabled = false,
    className = '',
    icon
}) => {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none',
        secondary: 'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600',
        outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
        ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40',
    };

    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

import { cx } from 'class-variance-authority';
import React from 'react';

export function Tabs({ children, className, ...props }: React.PropsWithChildren<{ className?: string } & React.HTMLProps<HTMLDivElement>>) {
    return (
        <div className={cx('flex space-x-8 border-b', className)} {...props}>
            {children}
        </div>
    );
}

export function Tab({
    current,
    label,
    onSelect,
    ...props
}: {
    current?: boolean;
    label: string;
    onSelect: () => void;
} & React.HTMLProps<HTMLButtonElement>) {
    return (
        <button
            className={cx(
                'cursor-pointer border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap',
                {
                    'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400': current,
                    'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:border-gray-400 dark:hover:text-gray-400':
                        !current,
                },
                props.className || '',
            )}
            role="tab"
            aria-selected={current}
            onClick={() => onSelect()}
            // @ts-expect-error not assignable
            type="button"
            {...props}
        >
            {label}
        </button>
    );
}

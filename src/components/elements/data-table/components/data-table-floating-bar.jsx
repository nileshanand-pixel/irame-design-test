import React from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * @typedef {Object} DataTableFloatingBarProps
 * @property {Object} table - The table instance from react-table.
 * @property {React.ReactNode} children - The children elements to be rendered inside the floating bar.
 * @property {string} [className] - Additional class names for the component.
 */

/**
 * DataTableFloatingBar component
 * @param {DataTableFloatingBarProps} props
 */
export function DataTableFloatingBar({ table, children, className, ...props }) {
	if (table.getFilteredSelectedRowModel().rows.length <= 0) return null;

	return (
		<div
			className={cn(
				'fixed bottom-10 start-0 end-0 mx-auto flex w-fit items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-white',
				className,
			)}
			{...props}
		>
			<Button
				aria-label="Clear selection"
				title="Clear"
				className="h-auto bg-transparent p-1 text-white hover:bg-zinc-700"
				onClick={() => table.toggleAllRowsSelected(false)}
			>
				<Cross2Icon className="size-3" aria-hidden="true" />
			</Button>
			<span className="text-xs">
				{table.getFilteredSelectedRowModel().rows.length} row(s) selected
			</span>
			{children}
		</div>
	);
}

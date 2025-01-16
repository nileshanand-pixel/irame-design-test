import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Make sure to import Skeleton from Shadcn

const RowLoader = ({ colsCount }) => {
	return (
		<div className="h-4 w-full flex gap-2">
			{Array.from({ length: colsCount }, (_, i) => (
				<Skeleton key={i} className="w-1/6 bg-purple-8 rounded-md" />
			))}
		</div>
	);
};

const TableLoader = ({ showHeader = true, rowsCount = 6, colsCount = 6 }) => {
	return (
		<div className="space-y-2">
			{showHeader && (
				<Skeleton className="mt-10 h-8 w-full bg-purple-8 rounded-md" />
			)}
			{Array.from({ length: rowsCount }, (_, i) => (
				<RowLoader key={i} colsCount={colsCount} />
			))}
		</div>
	);
};

export default TableLoader;

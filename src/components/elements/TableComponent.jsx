import React from 'react';
import { Table } from '../ui/table';
import { TableHeader } from '../ui/table';
import { TableHead } from '../ui/table';
import { TableRow } from '../ui/table';
import { TableBody } from '../ui/table';
import { TableCell } from '../ui/table';
import { cn } from '@/lib/utils';

const TableComponent = ({ data, columns }) => {
	if (!data || !data.length) {
		return null; // If data is not available, don't render anything
	}

	return (
		<div className="h-[45rem] overflow-auto">
			<Table>
				<TableHeader>
					<TableRow>
						{columns &&
							Array.isArray(columns) &&
							columns?.map((column, index) => (
								<TableHead
									key={index}
									className={cn('px-4 py-2  font-semibold')}
								>
									{column.charAt(0).toUpperCase() +
										column.slice(1)}
								</TableHead>
							))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data?.map((row, rowIndex) => (
						<TableRow key={rowIndex}>
							{columns &&
								Array.isArray(columns) &&
								columns.map((column, columnIndex) => (
									<TableCell
										key={columnIndex}
										className="px-4 py-2 border-t border-purple-8 max-w-[100px] truncate text-primary80"
									>
										{row[column]}
									</TableCell>
								))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};

export default TableComponent;

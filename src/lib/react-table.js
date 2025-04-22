import { reSplitAlphaNumeric, sortingFns } from '@tanstack/react-table';

const SortingFixFeature = {
	createColumn: (column, table) => {
		column.getAutoSortingFn = () => {
			const flatRows = table.getFilteredRowModel()?.flatRows ?? [];
			const firstRows = flatRows.slice(0, 10);

			let isString = false;

			for (const row of firstRows) {
				if (!row || typeof row.getValue !== 'function') continue;

				const value = row.getValue(column.id);

				if (value == null) continue; // skip null or undefined

				if (Object.prototype.toString.call(value) === '[object Date]') {
					return sortingFns.datetime;
				}

				if (typeof value === 'string') {
					isString = true;

					if (value.split(reSplitAlphaNumeric).length > 1) {
						return sortingFns.alphanumeric;
					}
				}
			}

			if (isString) {
				return sortingFns.text;
			}

			return sortingFns.basic;
		};
	},
};

export default SortingFixFeature;

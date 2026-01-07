import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { RxCrossCircled } from 'react-icons/rx';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import upperFirst from 'lodash.upperfirst';

const DashboardDropdown = ({
	value,
	onChange,
	dashboards = [],
	isLoading = false,
	placeholder = 'Select a dashboard',
	disabled = false,
}) => {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const rootRef = useRef(null);

	// Filter dashboards based on search query
	const filtered = useMemo(() => {
		if (!query.trim()) return dashboards;
		return dashboards.filter((d) =>
			(d.title || '').toLowerCase().includes(query.trim().toLowerCase()),
		);
	}, [dashboards, query]);

	// Get selected dashboard name
	const selectedDashboardName = useMemo(() => {
		if (!value) return '';
		const dashboard = dashboards.find((d) => (d.dashboard_id || d.id) === value);
		return dashboard?.title || '';
	}, [value, dashboards]);

	// Close dropdown when clicking outside
	useEffect(() => {
		function onDocMouseDown(e) {
			if (rootRef.current && !rootRef.current.contains(e.target)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', onDocMouseDown);
		return () => document.removeEventListener('mousedown', onDocMouseDown);
	}, []);

	const handleSelect = (dashboardId) => {
		if (value === dashboardId) {
			onChange(null);
		} else {
			onChange(dashboardId);
		}
		setOpen(false);
		setQuery('');
	};

	return (
		<div className="relative" ref={rootRef}>
			<button
				type="button"
				aria-expanded={open}
				onClick={() => {
					if (disabled) return;
					setOpen((s) => !s);
				}}
				className={cn(
					'justify-between items-center flex h-11 w-full rounded-lg border',
					disabled
						? 'bg-gray-50 text-primary60 cursor-not-allowed'
						: 'bg-white hover:bg-gray-50',
					'px-4 py-2 text-sm border-[#E2E8F0]',
				)}
			>
				<span
					className={cn(
						'truncate',
						!value
							? 'text-gray-400'
							: disabled
								? 'text-primary60'
								: 'text-[#26064A]',
					)}
				>
					{upperFirst(selectedDashboardName) || placeholder}
				</span>
				<div className="flex items-center gap-2">
					{value && !disabled && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onChange(null);
							}}
							className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-8 hover:bg-purple-16 hover:scale-110 transition-all duration-200 text-primary80 hover:text-primary"
							title="Remove selection"
						>
							<RxCrossCircled className="w-4 h-4" />
						</button>
					)}
					<ChevronsUpDown
						className={cn(
							'h-4 w-4',
							!value
								? 'text-gray-400'
								: disabled
									? 'text-primary60'
									: 'text-[#26064A]',
						)}
					/>
				</div>
			</button>

			{open && !disabled && (
				<div className="absolute py-2 left-0 right-0 mt-2 z-50 w-full bg-white rounded-md border shadow-lg">
					<input
						type="text"
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Escape') setOpen(false);
						}}
						placeholder="Search dashboard..."
						className="pl-4 w-full py-2 text-xs text-primary60 outline-none border-b"
					/>

					{isLoading ? (
						<p className="text-center text-xs text-gray-400 py-2">
							Loading dashboards...
						</p>
					) : (
						<ul className="max-h-56 overflow-y-auto gap-2 flex flex-col">
							{filtered.length > 0 ? (
								filtered.map((dashboard) => {
									const dashboardId =
										dashboard.id || dashboard.dashboard_id;
									const isSelected = value === dashboardId;
									const dashboardName =
										dashboard.title || 'Untitled Dashboard';

									return (
										<li
											key={dashboardId}
											onMouseDown={(e) => {
												e.preventDefault();
												handleSelect(dashboardId);
											}}
											className={cn(
												'px-4 py-2 border-b border-[#6A12CD0A] cursor-pointer hover:bg-purple-4 text-sm text-primary100 flex flex-col gap-0.5 rounded-md',
												isSelected &&
													'text-primary100 bg-purple-4',
											)}
										>
											<div className="flex items-center gap-2">
												<div
													className={cn(
														'size-4 rounded-full flex items-center justify-center',
														isSelected
															? 'border-[0.25rem] border-[#6A12CD]'
															: 'border-[0.15rem] border-gray-300',
													)}
												/>
												<span className="truncate flex-1">
													{upperFirst(dashboardName)}
												</span>
												{isSelected && (
													<Check className="h-4 w-4 text-[#6A12CD] flex-shrink-0" />
												)}
											</div>
										</li>
									);
								})
							) : (
								<li className="px-3 py-2 mr-4 text-sm text-primary60 text-center">
									No dashboards found
								</li>
							)}
						</ul>
					)}
				</div>
			)}
		</div>
	);
};

export default DashboardDropdown;

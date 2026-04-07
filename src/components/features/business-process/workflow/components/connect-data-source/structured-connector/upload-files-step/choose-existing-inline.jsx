import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataSources } from '@/hooks/useDataSources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChooseExistingInline({ onChooseExisting, selectedDataSources }) {
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [selected, setSelected] = useState([]);

	useEffect(() => {
		setSelected(selectedDataSources || []);
	}, [selectedDataSources]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { dataSources, isLoading, Sentinel, isFetchingNextPage } = useDataSources({
		enabled: true,
		search: debouncedSearch || undefined,
	});

	const filtered = (dataSources || []).sort((a, b) => {
		if (a.status === 'active' && b.status !== 'active') return -1;
		if (a.status !== 'active' && b.status === 'active') return 1;
		return 0;
	});

	const toggleSelect = (ds) => {
		setSelected((prev) =>
			prev.some((s) => s.datasource_id === ds.datasource_id)
				? prev.filter((s) => s.datasource_id !== ds.datasource_id)
				: [...prev, ds],
		);
	};

	const handleConfirm = () => {
		if (onChooseExisting) onChooseExisting(selected);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="relative">
				<span className="material-symbols-outlined text-primary40 absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none">
					search
				</span>
				<Input
					placeholder="Search data source.."
					className="w-full pl-10 py-2 placeholder:text-primary40 placeholder:font-medium border border-gray-300 rounded-full"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="max-h-64 overflow-y-auto show-scrollbar">
				{isLoading ? (
					<div className="grid grid-cols-2 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg"
							>
								<Skeleton className="h-8 w-8 rounded" />
								<div className="flex-1">
									<Skeleton className="h-4 w-32 mb-2" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
						))}
					</div>
				) : filtered.length === 0 ? (
					<div className="text-center py-8 text-primary80">
						No data sources found
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 gap-4">
							{filtered.map((ds) => {
								const isProcessing = ds.status !== 'active';
								const isSelected = selected.some(
									(s) => s.datasource_id === ds.datasource_id,
								);
								return (
									<div
										key={ds.datasource_id}
										className={`border hover:bg-purple-4 rounded-lg py-2 px-4 flex items-center gap-3 cursor-pointer transition-all ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''} ${isSelected ? 'border-purple-100 bg-purple-4' : 'border-gray-200'}`}
										onClick={() =>
											!isProcessing && toggleSelect(ds)
										}
									>
										<div className="flex-shrink-0">
											<span className="material-symbols-outlined text-purple-100 text-lg">
												database
											</span>
										</div>
										<div className="flex-1 truncate flex justify-between">
											<div className="min-w-0">
												<div className="text-sm font-medium truncate mb-0.5">
													{ds.name}
												</div>
												<div className="text-xs text-primary80">
													Last synced:{' '}
													{ds.updated_at
														? new Date(
																ds.updated_at,
															).toLocaleString()
														: 'N/A'}
												</div>
											</div>
											{isSelected && (
												<div className="flex-shrink-0">
													<div className="size-6 bg-purple-100 rounded-sm flex items-center justify-center">
														<span className="material-symbols-outlined text-3xl text-white">
															check_small
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
						<Sentinel />
						{isFetchingNextPage && (
							<p className="text-sm text-center text-gray-400 py-2">
								Loading more...
							</p>
						)}
					</>
				)}
			</div>

			<div className="flex justify-end">
				<Button
					onClick={handleConfirm}
					disabled={
						selected.length === 0 &&
						(selectedDataSources || []).length === 0
					}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getDataSources } from '@/components/features/configuration/service/configuration.service';
import { Button } from '@/components/ui/button';

export function ChooseExistingModal({
	open,
	setOpen,
	onChooseExisting,
	selectedDataSources,
}) {
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState([]);

	useEffect(() => {
		if (open) {
			setSelected(selectedDataSources || []);
		}
	}, [open, selectedDataSources]);

	const { data: dataSources, isLoading } = useQuery({
		queryKey: ['data-sources'],
		queryFn: getDataSources,
		enabled: open,
	});

	// Exclude data sources with PDF files and apply search
	const filtered = (dataSources || [])
		.filter((item) => {
			const hasPDF = item.processed_files?.files?.some(
				(file) => file.type === 'pdf',
			);
			return !hasPDF;
		})
		.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

	const toggleSelect = (ds) => {
		setSelected((prev) =>
			prev.some((s) => s.datasource_id === ds.datasource_id)
				? prev.filter((s) => s.datasource_id !== ds.datasource_id)
				: [...prev, ds],
		);
	};

	const handleConfirm = () => {
		if (onChooseExisting) onChooseExisting(selected);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-[50%] text-primary80 border p-0 flex flex-col sm:max-h-[80vh] h-[90vh] rounded-lg overflow-hidden gap-0">
				<div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white">
					<h2 className="text-xl font-semibold text-primary100">
						Select From Existing Data Source
					</h2>
				</div>

				<div className="p-6 border-b border-gray-200">
					<div className="relative">
						{/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
						<span className="material-symbols-outlined text-primary40 absolute left-2 top-[33%] transform -translate-y-1/2  size-3">
							search
						</span>
						<Input
							placeholder="Search data source.."
							className="w-full pl-10 py-2  placeholder:text-primary40 placeholder:font-medium  border border-gray-300 rounded-full"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto show-scrollbar p-6">
					{isLoading ? (
						<div className="grid grid-cols-2 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
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
						<div className=" text-center py-8">
							No such data source found
						</div>
					) : (
						<div className="grid grid-cols-2 gap-4">
							{filtered.map((ds) => {
								const isProcessing =
									!ds.processed_files?.files ||
									ds.processed_files.files.length === 0;
								const isSelected = selected.some(
									(s) => s.datasource_id === ds.datasource_id,
								);

								return (
									<div
										key={ds.datasource_id}
										className={`border hover:bg-purple-4 rounded-lg py-2 px-4 flex items-center gap-3 cursor-pointer transition-all  ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
										onClick={() =>
											!isProcessing && toggleSelect(ds)
										}
									>
										<div className="flex-shrink-0">
											<span className="material-symbols-outlined text-purple-100 text-2xl">
												database
											</span>
										</div>

										<div className="flex-1 truncate flex justify-between">
											<div className="min-w-0">
												<div className="font-medium truncate mb-1">
													{ds.name}
												</div>
												<div className="text-sm ">
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
														{/* <Check className="size-4 font-semibold text-white" /> */}
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
					)}
				</div>

				<div className="py-4 px-8 border-t mt-6 border-gray-200 bg-[#F3F4F680] flex justify-end">
					<Button onClick={handleConfirm} disabled={selected.length === 0}>
						Continue
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getDataSources } from '@/components/features/configuration/service/configuration.service';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
		.filter((item) => item.name.toLowerCase().startsWith(search.toLowerCase()));

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
			<DialogContent className="max-w-3xl p-0 overflow-hidden">
				<div className="flex flex-col h-[600px]">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">
							Select From Existing Data Source
						</h2>
					</div>
					<div className="p-6 border-b border-gray-200">
						<Input
							placeholder="Search"
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="flex-1 overflow-y-auto p-6">
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center gap-4 p-3">
									<Skeleton className="h-5 w-5 rounded-full" />
									<Skeleton className="h-4 w-32" />
								</div>
							))
						) : filtered.length === 0 ? (
							<div className="text-gray-400 text-center">
								No such data source found
							</div>
						) : (
							<ul className="space-y-3">
								{filtered.map((ds) => {
									const isProcessing =
										!ds.processed_files?.files ||
										ds.processed_files.files.length === 0;
									return (
										<li
											key={ds.datasource_id}
											className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${selected.some((s) => s.datasource_id === ds.datasource_id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'} ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
											onClick={() =>
												!isProcessing && toggleSelect(ds)
											}
										>
											<div>
												<div className="font-medium">
													{ds.name}
												</div>
												<div className="text-xs text-gray-500">
													Last synced:{' '}
													{ds.last_synced || '-'}
												</div>
												<div className="text-xs text-gray-400 mt-1">
													Files:{' '}
													{(
														ds.processed_files?.files ||
														[]
													)
														.map((f) => f.name)
														.join(', ')}
												</div>
											</div>
											<input
												type="checkbox"
												checked={selected.some(
													(s) =>
														s.datasource_id ===
														ds.datasource_id,
												)}
												readOnly
												className="w-4 h-4 accent-purple-600"
												disabled={isProcessing}
											/>
										</li>
									);
								})}
							</ul>
						)}
					</div>
					<div className="p-6 border-t border-gray-200 flex justify-end">
						<button
							className="bg-[#6A12CD] text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
							onClick={handleConfirm}
							disabled={selected.length === 0}
						>
							Continue
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import DividerWithText from '@/components/elements/DividerWithText';

export function DataSourceSelector({ open, onOpenChange }) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedDataSourceId, setSelectedDataSourceId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [mockData, setMockData] = useState([]);

	// Simulated API call
	useEffect(() => {
		const fetchData = async () => {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 10000));

			// Mock data - replace with actual API call
			setMockData([
				{ id: '1', name: 'Q1 Sales data' },
				{ id: '2', name: 'Q2 Marketing data' },
				{ id: '3', name: '2023 Customer analytics' },
				{ id: '4', name: 'Q1 Sales data' },
				{ id: '5', name: 'Q2 Marketing data' },
				{ id: '6', name: '2023 Customer analytics' },
				{ id: '7', name: 'Q1 Sales data' },
				{ id: '8', name: 'Q2 Marketing data' },
				{ id: '9', name: '2023 Customer analytics' },
			]);
			setIsLoading(false);
		};

		fetchData();
	}, []);

	const filteredData = mockData.filter((item) =>
		item.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-screen-sm rounded-lg p-4 text-primary80">
				<DialogHeader className="">
					<div className="flex gap-4 items-center">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/datasource_modal_header_icon.svg"
							alt="icon"
						/>
						<div className="flex flex-col">
							<h2 className="text-lg font-semibold text-black/90">
								Choose Data Source
							</h2>
							<p className="text-sm text-black/60">
								You can always change it later from the data source
								page
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="flex w-full items-center bg-white border rounded-lg h-11 pl-4 pr-6 transition-width duration-300">
					<i className="bi-search text-primary40 me-2"></i>
					<Input
						placeholder="Search"
						className={cn(
							'border-none rounded-sm px-0 text-black font-medium bg-white',
						)}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				{/* Data List Area */}
				<div className="max-h-72 overflow-y-auto border-2 rounded-lg">
					{isLoading ? (
						// Loading Skeletons
						Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center gap-4 p-3">
								<Skeleton className="h-5 w-5 rounded-full" />
								<Skeleton className="h-4 w-32" />
							</div>
						))
					) : filteredData.length === 0 ? (
						// No results state
						<div className="h-32 flex items-center justify-center text-muted-foreground">
							No such data source found
						</div>
					) : (
						// Data source list
						filteredData.map((item) => (
							<label
								key={item.id}
								className="flex items-center justify-between gap-6 p-3 rounded-md hover:bg-accent cursor-pointer border-b"
							>
								<div className="flex text-primary80 items-center justify-between gap-2">
									<span className="material-symbols-outlined text-2xl">
										database
									</span>
									<span className="font-medium">{item.name}</span>
								</div>
								<input
									type="radio"
									name="data-source"
									className="h-4 w-4 text-primary border-gray-300"
									checked={selectedDataSourceId === item.id}
									onChange={() => setSelectedDataSourceId(item.id)}
								/>
							</label>
						))
					)}
				</div>

				<DividerWithText className="-my-2" text="Or" />

				{/* Upload Data Source (Placeholder) */}
				<Button
					variant="outline"
					onClick={() => alert('implement upload')}
					className="text-sm text-purple-100 hover:text-purple-80 font-medium border-purple-100 border  hover:bg-gray-100 flex items-center"
				>
					<span className="material-symbols-outlined text-xl rounded-md p-1">
						Upload
					</span>
					<span>Upload Data Source</span>
				</Button>

				{/* Footer Buttons */}
				<div className="flex justify-between gap-3 pt-2">
					<Button
						className="w-1/2"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={!selectedDataSourceId}
						className="w-1/2"
						onClick={() => {
							// Handle continue action here
							console.log('Selected ID:', selectedDataSourceId);
							onOpenChange(false);
						}}
					>
						Continue
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

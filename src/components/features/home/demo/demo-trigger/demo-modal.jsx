import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import stars from '@/assets/icons/stars.svg';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEMOS = [
	{
		label: 'Upload Dataset',
		title: "Let's take a quick tour to upload dataset",
		description:
			'Learn how to quickly upload and connect your data sources. Get started with importing CSV files, Excel sheets, and other datasets to begin analyzing with IRA.',
		supademoUrl:
			'https://app.supademo.com/embed/cmfze3hv85wwa10k8hvlxzijt?embed_v=2&utm_source=embed', // Replace with your actual Supademo embed URL
	},
];

export default function DemoModal({ open, onOpenChange }) {
	const [activeDemoData, setActiveDemoData] = useState(DEMOS[0]);
	const [isFullDemoOpen, setIsFullDemoOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[60vw] flex p-0 gap-0 overflow-hidden">
				<div className="w-[30%] border-r-1 border-r-[#EBEBEB] p-6">
					<div className="flex items-center gap-4 mb-7">
						<img src={stars} className="size-5" />
						<span className="font-semibold text-[#000000CC]">
							Let's take a quick tour to get started!
						</span>
					</div>

					<div className="flex flex-col gap-2">
						{DEMOS.map((demo) => {
							const isActive = demo.label === activeDemoData.label;
							return (
								<div
									key={demo.label}
									className={cn(
										'flex items-center gap-4 py-2 px-3 rounded-lg cursor-pointer',
										isActive ? 'bg-[#F2F4F7]' : 'bg-transparent',
									)}
									onClick={() => setActiveDemoData(demo)}
								>
									<span>{demo.label}</span>
								</div>
							);
						})}
					</div>
				</div>

				<div className="w-[70%]">
					<div className="border-b-1 border-b-[#EBEBEB] relative overflow-hidden bg-gray-50 p-8">
						{activeDemoData.supademoUrl && (
							<iframe
								src={activeDemoData.supademoUrl}
								frameBorder="0"
								allow="clipboard-write"
								allowFullScreen
								className="h-[40vh] w-full"
								title={activeDemoData.label}
							/>
						)}
					</div>
					<div className="p-6">
						<div className="text-[#000000CC] font-semibold mb-2">
							{activeDemoData.title}
						</div>
						<div className="text-[#00000099] text-xs font-medium mb-[1.375rem]">
							{activeDemoData.description}
						</div>
						<Button size="sm" onClick={() => setIsFullDemoOpen(true)}>
							View Full Demo
						</Button>
					</div>
				</div>
			</DialogContent>

			{/* Full Demo Modal */}
			<Dialog open={isFullDemoOpen} onOpenChange={setIsFullDemoOpen}>
				<DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh]">
					<div className="w-full h-full">
						{activeDemoData.supademoUrl && (
							<iframe
								src={activeDemoData.supademoUrl}
								frameBorder="0"
								allow="clipboard-write"
								allowFullScreen
								className="w-full h-full rounded-lg"
								title={`${activeDemoData.label} - Full Demo`}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</Dialog>
	);
}

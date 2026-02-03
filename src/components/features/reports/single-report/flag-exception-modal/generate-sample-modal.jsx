import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import generateSampleActiveIcon from '@/assets/icons/generate-sample-active.svg';
import { useMutation } from '@tanstack/react-query';
import { generateSampleData } from '../../service/reports.service';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import InputText from '@/components/elements/InputText';

const GenerateSampleModal = ({
	open,
	onClose,
	reportId,
	cardId,
	samplesData,
	setSelectedSampleId,
}) => {
	const [sampleName, setSampleName] = useState(() => {
		return `Sample Data ${samplesData?.samples?.length + 1}`;
	});
	const [percentage, setPercentage] = useState(80);

	useEffect(() => {
		if (open) {
			setSampleName(`Sample Data ${samplesData?.samples?.length + 1}`);
			setPercentage(80);
		}
	}, [open, samplesData]);
	// Mutation for generating sample data
	const generateSampleMutation = useMutation({
		mutationFn: ({ percentageCount, filters }) =>
			generateSampleData({
				reportId,
				cardId,
				percentageCount,
				filters,
				sampleName,
			}),
		onSuccess: (data) => {
			// Invalidate queries to refetch data
			queryClient.invalidateQueries(['report-card-cases', reportId, cardId]);
			queryClient.invalidateQueries([
				'report-card-sample-check',
				reportId,
				cardId,
			]);
			toast.success('Sample data generation initiated successfully');
			setSelectedSampleId(data?.sample_id);
			onClose();
		},
		onError: (error) => {
			console.error('Error generating sample:', error);
			toast.error(
				error?.response?.data?.message ||
					'Failed to generate sample. Please try again.',
			);
		},
	});

	const handleGenerateSample = () => {
		if (!sampleName.trim()) {
			toast.error('Sample name is required');
			return;
		}
		if (percentage === 0) {
			toast.error("Percentage can't be 0%");
			return;
		}
		generateSampleMutation.mutate({
			percentageCount: percentage,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl gap-0" hideClose={true}>
				<div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-full bg-[#F9F6FD] flex items-center justify-center">
							<div className="bg-[#6A12CD14] rounded-full size-8 flex items-center justify-center">
								<img
									src={generateSampleActiveIcon}
									alt="generate sample"
									className="size-4"
								/>
							</div>
						</div>
						<h2 className="text-xl font-semibold text-[#26064ACC]">
							Generate Sample
						</h2>
					</div>
					<button
						onClick={() => onClose()}
						className="p-1 hover:bg-gray-100 rounded transition-colors"
					>
						<X className="w-5 h-5 text-[#6B7280]" />
					</button>
				</div>

				<div className="flex flex-col gap-5 py-4">
					{/* File Name */}
					<div>
						<InputText
							required={true}
							placeholder="Enter sample name here"
							label="File Name"
							value={sampleName}
							setValue={(e) => setSampleName(e)}
							labelClassName="text-sm font-medium text-[#6B7280] mb-2 block"
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-[#6B7280] mb-2 block">
							<span>Percentage</span>
							<span className="text-red-400 ms-1">*</span>
						</label>

						<div className="relative mb-4">
							<Input
								type="text"
								value={percentage}
								onChange={(e) =>
									setPercentage(
										Math.min(
											100,
											Math.max(
												0,
												parseInt(e.target.value) || 0,
											),
										),
									)
								}
								className="pr-10"
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">
								%
							</span>
						</div>

						<div className="relative w-full">
							<input
								type="range"
								min="0"
								max="100"
								value={percentage}
								onChange={(e) =>
									setPercentage(parseInt(e.target.value))
								}
								className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6A12CE]"
								style={{
									background: `linear-gradient(to right, #6A12CE 0%, #6A12CE ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
								}}
							/>
						</div>
					</div>
				</div>

				{/* Footer Buttons */}
				<div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
					<Button
						variant="outline"
						onClick={() => onClose()}
						className="text-[#26064ACC] border-[#E5E7EB]"
					>
						Cancel
					</Button>
					<Button
						onClick={handleGenerateSample}
						className="bg-[#6A12CE] hover:bg-[#5A0EBE] text-white"
						disabled={generateSampleMutation.isPending}
					>
						{generateSampleMutation.isPending ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default GenerateSampleModal;

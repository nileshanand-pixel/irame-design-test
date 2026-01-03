import { useCallback, useState } from 'react';
import ChooseQuerySessionModal from './ChooseQuerySessionModal';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ADD_QUERY_CTA_SIZES = {
	LARGE: 'large',
	SMALL: 'small',
};

export default function AddQueryCta({ size = ADD_QUERY_CTA_SIZES.SMALL }) {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleAddQuery = useCallback(() => {
		setIsModalOpen(true);
	}, []);

	return (
		<>
			<Button
				onClick={handleAddQuery}
				className={cn(
					'gap-1',
					size == ADD_QUERY_CTA_SIZES.LARGE &&
						'px-10 py-6 text-lg font-normal',
				)}
			>
				Add Query
				{size == ADD_QUERY_CTA_SIZES.SMALL && (
					<ArrowUpRight className="size-4" color="#fff" />
				)}
			</Button>
			<ChooseQuerySessionModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
			/>
		</>
	);
}

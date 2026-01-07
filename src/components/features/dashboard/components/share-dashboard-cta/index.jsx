import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import ShareDashboardModal from './ShareDashboardModal';
import { LuShare2 } from 'react-icons/lu';

export default function ShareDashboardCTA() {
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);

	const handleShareClick = useCallback(() => {
		setIsShareModalOpen(true);
	}, []);

	return (
		<>
			<Button
				onClick={handleShareClick}
				variant="outline"
				className="border-[rgba(38, 6, 74, 0.10)] border cursor-pointer bg-white hover:bg-purple-50 text-primary80 flex items-center gap-2"
			>
				<LuShare2 className="w-3.5 h-3.5 text-primary80" />
				<span className="text-sm font-medium text-primary80">Share</span>
			</Button>

			<ShareDashboardModal
				open={isShareModalOpen}
				onOpenChange={setIsShareModalOpen}
			/>
		</>
	);
}

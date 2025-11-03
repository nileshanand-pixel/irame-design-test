import { Button } from '@/components/ui/button';
import { useState } from 'react';
import DemoModal from './demo-modal';

export default function DemoTrigger() {
	const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

	return (
		<>
			<Button
				className="w-full font-medium rounded-lg text-sm px-5 py-2.5 mt-4 text-center flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
				onClick={() => setIsDemoModalOpen(true)}
				disabled
			>
				Get Started
				<span className="text-xs font-medium py-0.5 px-2 rounded-md bg-white/20">
					Coming Soon
				</span>
			</Button>
			<DemoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
		</>
	);
}

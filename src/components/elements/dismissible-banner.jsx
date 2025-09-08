import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLocalStorage, setLocalStorage } from '@/utils/local-storage';

export default function DismissibleBanner({
	id,
	title,
	description,
	badge = (
		<Badge
			variant="secondary"
			className="bg-[#FF7300] text-white font-medium px-4 py-0.5 rounded-3xl text-xs"
		>
			BETA
		</Badge>
	),
}) {
	const storageKey = `banner-${id}`;
	const [isVisible, setIsVisible] = useState(false);
	const [isAnimated, setIsAnimated] = useState(false);

	useEffect(() => {
		const dismissed = getLocalStorage(storageKey);
		if (!dismissed) {
			setIsVisible(true);
			const timer = setTimeout(() => {
				setIsAnimated(true);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [storageKey]);

	const handleClose = () => {
		setIsAnimated(false);
		setTimeout(() => {
			setIsVisible(false);
			setLocalStorage(storageKey, 'true');
		}, 300);
	};

	if (!isVisible) return null;

	return (
		<div className="w-full">
			<div
				className={`relative rounded-lg px-6 py-4 transition-all duration-500 ease-out transform ${
					isAnimated
						? 'opacity-100 translate-y-0 scale-100'
						: 'opacity-0 -translate-y-4 scale-95'
				}`}
				style={{
					background: 'rgba(156, 68, 255, 1)',
					boxShadow: '0rem 0.25rem 0.4375rem rgba(0,0,0,0.25)',
				}}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex-shrink-0">
							<Sparkles className="w-6 h-6 text-white" />
						</div>
						<div className="flex flex-col gap-2">
							<div className="flex items-center gap-3">
								<h2 className="text-white font-semibold text-sm">
									{title}
								</h2>
								{badge}
							</div>
							<p className="text-white text-xs">{description}</p>
						</div>
					</div>
					<Button
						variant="transparent"
						size="iconSm"
						onClick={handleClose}
						className="-mt-6 -mr-2 flex-shrink-0 text-white  h-6 w-6"
					>
						<X className="w-6 h-6" />
						<span className="sr-only">Close banner</span>
					</Button>
				</div>
			</div>
		</div>
	);
}

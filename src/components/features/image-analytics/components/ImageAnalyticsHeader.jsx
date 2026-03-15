import { ImageIcon } from 'lucide-react';

const ImageAnalyticsHeader = () => {
	return (
		<div className="bg-purple-100 px-6 py-4">
			<div className="flex items-center gap-3">
				<ImageIcon className="w-5 h-5 text-white/90" />
				<div>
					<h1 className="text-lg font-semibold text-white uppercase tracking-wide">
						Image Analytics
					</h1>
					<p className="text-xs text-white/60 mt-0.5">
						AI-powered image chat, comparison, and compliance auditing
					</p>
				</div>
			</div>
		</div>
	);
};

export default ImageAnalyticsHeader;

import { ShieldCheck } from 'lucide-react';

const ForensicsHeader = () => {
	return (
		<div className="bg-purple-100 px-6 py-4">
			<div className="flex items-center gap-3">
				<ShieldCheck className="w-5 h-5 text-white/90" />
				<div>
					<h1 className="text-lg font-semibold text-white uppercase tracking-wide">
						Document Forensics
					</h1>
					<p className="text-xs text-white/60 mt-0.5">
						Analyze documents for forgery, tampering, and AI generation
					</p>
				</div>
			</div>
		</div>
	);
};

export default ForensicsHeader;

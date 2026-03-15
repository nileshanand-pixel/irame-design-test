import { FileText } from 'lucide-react';

const RACMHeader = () => {
	return (
		<div className="bg-purple-100 px-6 py-4">
			<div className="flex items-center gap-3">
				<FileText className="w-5 h-5 text-white/90" />
				<div>
					<h1 className="text-lg font-semibold text-white uppercase tracking-wide">
						RACM Generator
					</h1>
					<p className="text-xs text-white/60 mt-0.5">
						Generate Risk Assessment and Control Matrices from SOP
						documents
					</p>
				</div>
			</div>
		</div>
	);
};

export default RACMHeader;

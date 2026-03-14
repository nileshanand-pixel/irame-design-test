import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const RACMHeader = () => {
	const navigate = useNavigate();

	return (
		<div className="mb-4">
			<button
				onClick={() => navigate('/app/ai-concierge')}
				className="inline-flex items-center gap-1 text-sm text-primary40 hover:text-purple-100 transition-colors mb-2"
			>
				<ChevronLeft className="size-4" />
				Back to AI Concierge
			</button>
			<h1 className="text-2xl font-semibold text-primary80">RACM Generator</h1>
			<p className="text-sm text-primary40 mt-1">
				Generate Risk Assessment and Control Matrices from SOP documents
			</p>
		</div>
	);
};

export default RACMHeader;

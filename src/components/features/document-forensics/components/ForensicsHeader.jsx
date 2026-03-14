import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const ForensicsHeader = () => {
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
			<h1 className="text-2xl font-semibold text-primary80">
				Document Forensics
			</h1>
			<p className="text-sm text-primary40 mt-1">
				Analyze documents for forgery, tampering, and AI generation — get
				forensic reports with risk scores and evidence chains
			</p>
		</div>
	);
};

export default ForensicsHeader;

import { TbMicrophone } from 'react-icons/tb';

const SpeechAuditorHeader = () => (
	<div className="px-6 pt-5 pb-3">
		<div className="flex items-center gap-3">
			<div className="w-9 h-9 rounded-xl bg-purple-4 flex items-center justify-center">
				<TbMicrophone className="w-5 h-5 text-purple-100" />
			</div>
			<div>
				<h2 className="text-lg font-semibold text-primary80">
					Speech Auditor
				</h2>
				<p className="text-xs text-primary40">
					AI-powered call recording analysis with transcription, sentiment,
					and audit reports
				</p>
			</div>
		</div>
	</div>
);

export default SpeechAuditorHeader;

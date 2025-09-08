import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Enum for phases
const PHASE = {
	LOADING: 'loading',
	SUCCESS: 'success',
	COMPLETE: 'complete',
};

// Default texts and tips
const DEFAULTS = {
	SUCCESS_DURATION: 5000,
	LOADING_TEXT: 'Your datasource is getting ready...',
	SUCCESS_TEXT:
		'Datasource is ready! Start asking questions to get actionable insights.',
	TIPS: [
		'Use @ to mention document names for improved accuracy',
		{
			title: 'Try asking:',
			examples:
				'"Summarize this document", "Extract key details", Compare these documents"....',
		},
	],
};

export const DatasourceProcessingLoader = ({
	isLoading = true,
	successDuration = DEFAULTS.SUCCESS_DURATION,
	loadingText = DEFAULTS.LOADING_TEXT,
	successText = DEFAULTS.SUCCESS_TEXT,
	tips = DEFAULTS.TIPS,
	onComplete = () => {},
}) => {
	const [phase, setPhase] = useState();

	// Handle phase transitions based on isLoading and successDuration
	useEffect(() => {
		if (!isLoading && phase === PHASE.LOADING) {
			setPhase(PHASE.SUCCESS);
		}
	}, [isLoading, phase]);

	useEffect(() => {
		if (phase === PHASE.SUCCESS) {
			const successTimer = setTimeout(() => {
				setPhase(PHASE.COMPLETE);
				onComplete();
			}, successDuration);

			return () => clearTimeout(successTimer);
		}
	}, [phase, successDuration, onComplete]);

	useEffect(() => {
		if (isLoading) {
			setPhase(PHASE.LOADING);
		}
	}, [isLoading]);

	return (
		<div className="flex flex-col justify-center p-4 mt-2 text-primary80">
			<div className="space-y-4 max-w-2xl mx-auto animate-in fade-in duration-500">
				{phase === PHASE.LOADING && (
					<>
						<div className="relative flex justify-center">
							<div className="w-6 h-6 border-[0.1875rem] border-purple-200 rounded-full animate-spin border-t-purple-500"></div>
						</div>
						<div className="text-sm font-medium  text-center">
							{loadingText}
						</div>
					</>
				)}
				<Card className="w-full border-purple-200 shadow-md">
					<CardContent className="p-6">
						<h3 className="text-sm font-semibold text-primary80 mb-4">
							Tips for better results:
						</h3>
						<div className="space-y-4 text-sm">
							{tips.map((tip, index) => (
								<div
									key={index}
									className="flex items-start space-x-3"
								>
									<div className="w-1.5 h-1.5 bg-primary60 rounded-full mt-2 flex-shrink-0"></div>
									<div className="text-primary100">
										{typeof tip === 'string' ? (
											<span>{tip}</span>
										) : (
											<div>
												<div className="font-normal mb-1">
													{tip.title}
												</div>
												<div className="text-primary60 italic">
													{tip.examples}
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
				{phase === PHASE.SUCCESS && (
					<div className=" flex space-x-2 text-base animate-in fade-in slide-in-from-bottom-4 duration-700 ">
						<div className="flex-shrink-0">
							<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500 delay-200">
								<Check className="w-5 h-5 text-white" />
							</div>
						</div>
						<div className="font-medium text-primary80">
							{successText}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

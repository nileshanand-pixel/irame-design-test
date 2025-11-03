import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThumbsDown } from 'lucide-react';
import { submitFeedback } from '@/api/feedback/feedback.service';

export function FeedbackModal({
	isOpen,
	onClose,
	entityId,
	entityType = 'query',
	feedbackMap,
	setFeedbackMap,
}) {
	const [feedback, setFeedback] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) setFeedback('');
	}, [isOpen]);

	const handleSend = async () => {
		if (!entityId) return;

		setLoading(true);
		try {
			await submitFeedback({
				entityId,
				entityType,
				feedback: 'negative',
				comment: feedback || 'No comment',
			});

			setFeedbackMap((prev) => ({
				...prev,
				[entityId]: 'Negative',
			}));

			onClose();
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-xl rounded-xl p-4 gap-6">
				<DialogHeader className="flex flex-row justify-between items-center border-b pt-3 pb-5">
					<DialogTitle className="text-base text-primary80 font-semibold flex gap-4 items-center">
						<div className="relative flex items-center justify-center w-14 h-14">
							<div className="absolute inset-0 rounded-full bg-purple-8" />
							<div className="absolute w-10 h-10 rounded-full bg-purple-16 opacity-60" />
							<ThumbsDown className="relative w-5 h-5 text-primary" />
						</div>
						Help us improve
					</DialogTitle>
					<DialogDescription />
				</DialogHeader>

				<div>
					<p className="text-sm font-normal">Can you tell us more?</p>

					<div className="w-full mt-2.5">
						<textarea
							placeholder="Add Feedback"
							className="w-full p-3 resize-none text-xs border rounded-md"
							rows={5}
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
						/>

						<div className="flex justify-end mt-2">
							<Button
								className="bg-primary text-white h-8 px-4 text-xs"
								onClick={handleSend}
								disabled={
									loading || feedbackMap[entityId] === 'Negative'
								}
							>
								{loading ? 'Sending...' : 'Send'}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import keyIcon from '@/assets/icons/key.svg';
import { useNavigate } from 'react-router-dom';

export default function ResetSuccessModal({ isOpen, onClose }) {
	const handleContinueClick = () => {
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent hideClose onInteractOutside={(e) => e.preventDefault()}>
				<div className="flex flex-col items-center justify-center pt-6 px-4 text-center">
					{/* Icon */}
					<div className="bg-[#ECFDF3] p-3 rounded-full flex items-center justify-center mb-5">
						<div className="flex items-center justify-center bg-[#D1FADF] p-3 rounded-full">
							<img src={keyIcon} alt="key" className="size-6" />
						</div>
					</div>

					{/* Title */}
					<DialogTitle className="mb-2 text-[1.125rem] font-semibold text-[#000000E5]">
						Your Password has been reset!
					</DialogTitle>

					{/* Description */}
					<DialogDescription className="mb-8 text-sm text-[#00000099]">
						Log in to your account with new password
					</DialogDescription>

					{/* Continue Button */}
					<Button
						onClick={handleContinueClick}
						className="w-full text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-base px-5 py-3"
					>
						Continue
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

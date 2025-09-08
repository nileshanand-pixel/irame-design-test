import React from 'react';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/Hint';
import PromptingRole from '../PromptingRole';
import CircularLoader from '@/components/elements/loading/CircularLoader';

const InputToolbar = ({
	disabled,
	isEnhancing,
	showStream,
	disablePromptEnhancer,
	onEnhancePrompt,
	onSend,
	mode,
	promptLength,
	onMentionClick,
	filesLoading,
}) => {
	return (
		<div className="flex justify-between">
			<div className="flex px-2 items-center">
				{isEnhancing ? (
					<div className="text-xs flex gap-1 items-center text-purple-80">
						<CircularLoader size="sm" />
						Enhancing Prompt
					</div>
				) : (
					<>
						<Hint label="Enhance Prompt">
							<Button
								onClick={onEnhancePrompt}
								variant="transparent"
								size="iconSm"
								className={`${
									disablePromptEnhancer &&
									'cursor-not-allowed opacity-40'
								}`}
								disabled={disablePromptEnhancer}
							>
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/generate_ai.svg"
									className="size-6"
									style={{ strokeWidth: '2' }}
									alt="enhance icon"
								/>
							</Button>
						</Hint>

						{mode === 'single' && !filesLoading && (
							<Hint label="Mention files">
								<Button
									onClick={onMentionClick}
									variant="transparent"
									size="iconSm"
									disabled={disabled}
									className="ml-2 -mt-1 text-base text-primary80"
								>
									@
								</Button>
							</Hint>
						)}
					</>
				)}
				{!disablePromptEnhancer && <PromptingRole />}
			</div>

			{!isEnhancing && !showStream && !disabled && (
				<div className="flex gap-4 items-center justify-between">
					{mode === 'single' && promptLength > 0 && (
						<span className="text-muted-foreground font-bold text-xs">
							Use Control + Enter to send
						</span>
					)}
					<div
						className="flex items-end gap-2 cursor-pointer"
						onClick={onSend}
					>
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/send.svg"
							alt="Send"
							className="size-6"
						/>
					</div>
				</div>
			)}

			{disabled && (
				<div className="flex gap-2 items-end ml-auto cursor-not-allowed">
					<i className="bi bi-arrow-repeat animate-spin text-purple-40 text-xl"></i>
				</div>
			)}
		</div>
	);
};

export default InputToolbar;

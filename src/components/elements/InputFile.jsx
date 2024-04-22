import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import PropTypes from 'prop-types';

const InputFile = ({
	labelClassName,
	className,
	label,
	required,
	tooltip,
	error,
	value,
	setValue,
	errorText,
	description,
	containerSize,
	acceptableFiles,
	variant,
}) => {
	const inputRef = useRef();
	const [fileLink, setFileLink] = useState(null);
	return (
		<div className="w-full">
			<Label className={clsx('flex items-center mb-2', labelClassName)}>
				{label}
				{tooltip && (
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger className="ms-2">
								<i className="bi-info-circle-fill block text-muted-foreground text-xs cursor-pointer"></i>
							</TooltipTrigger>
							<TooltipContent>
								<div className="text-sm font-normal max-w-[400px]">
									{tooltip}
								</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
				{required && <span className="text-red-400 ms-1">*</span>}
			</Label>
			<div className="flex mt-2 w-full">
				<div className="w-full">
					<Button
						variant={variant}
						onClick={(e) => {
							e.preventDefault();
							inputRef.current.click();
						}}
						className={className}
					>
						Upload Image
					</Button>
					<div>
						<p className="text-muted-foreground text-xs mt-3">
							{description}
						</p>
					</div>
				</div>
			</div>
			<input
				type="file"
				className="absolute top-0 w-0 -z-1 opacity-0"
				ref={inputRef}
				onChange={(e) => {
					const file = e.target.files;
					setValue(file);
					setFileLink(URL.createObjectURL(inputRef.current.files[0]));
				}}
				accept={acceptableFiles ? acceptableFiles : '*'}
			/>
			{error && errorText && (
				<p className={cn('text-xs  text-destructive mt-1')}>{errorText}</p>
			)}
		</div>
	);
};

export default InputFile;

InputFile.propTypes = {
	className: PropTypes.string,
	containerSize: PropTypes.string,
	description: PropTypes.string,
	error: PropTypes.bool,
	errorText: PropTypes.string,
	label: PropTypes.string,
	labelClassName: PropTypes.string,
	placeholder: PropTypes.string,
	required: PropTypes.bool,
	tooltip: PropTypes.string,
	value: PropTypes.any,
	setValue: PropTypes.func,
	acceptableFiles: PropTypes.string,
	variant: PropTypes.string,
};

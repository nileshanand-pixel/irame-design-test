import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const InputText = ({
	labelClassName,
	className,
	placeholder,
	label,
	required,
	tooltip,
	error,
	value,
	setValue,
	errorText,
	subLabel,
	subLabelClassName,
	inputMainClass,
}) => {
	return (
		<div className={className}>
			{label && (
				<Label className={clsx('flex items-center mb-2', labelClassName)}>
					<div className="flex flex-col">
						<div className="flex">
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
							{required && (
								<span className="text-red-400 ms-1">*</span>
							)}
						</div>
						{subLabel ? (
							<p
								className={clsx(
									'text-xs text-muted-foreground',
									subLabelClassName,
								)}
							>
								{subLabel}
							</p>
						) : null}
					</div>
				</Label>
			)}
			<Input
				placeholder={placeholder}
				autoCorrect="off"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className={clsx(
					inputMainClass ? inputMainClass : '',
					error ? 'border-destructive' : '',
				)}
			/>
			{error && errorText && (
				<p className={'text-xs  text-destructive mt-1'}>{errorText}</p>
			)}
		</div>
	);
};

export default InputText;

InputText.propTypes = {
	className: PropTypes.string,
	error: PropTypes.bool,
	errorText: PropTypes.string,
	label: PropTypes.string,
	labelClassName: PropTypes.string,
	placeholder: PropTypes.string,
	required: PropTypes.bool,
	setValue: PropTypes.func,
	subLabel: PropTypes.string,
	subLabelClassName: PropTypes.string,
	tooltip: PropTypes.string,
	value: PropTypes.string,
	inputMainClass: PropTypes.string,
};

import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { BellRing } from 'lucide-react';
import { logError } from '@/lib/logger';

const SetThresholdAlertModal = ({ open, onOpenChange }) => {
	const [thresholdValue, setThresholdValue] = useState('10');
	const [condition, setCondition] = useState('below');
	const [emailNotification, setEmailNotification] = useState(true);
	const [emailAddress, setEmailAddress] = useState('');

	const handleCreateAlert = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-lg px-6 py-4">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-[#FAF5FF] border border-[#6A12CD] flex items-center justify-center">
								<BellRing className="w-5 h-5 text-[#6A12CD]" />
							</div>
							<DialogTitle className="text-base font-medium text-[#26064A]">
								Set Threshold Alert
							</DialogTitle>
						</div>
					</div>
				</DialogHeader>

				{/* Border below Set Threshold Alert */}
				<div className="border-t border-[rgba(106,18,205,0.10)] !px-0"></div>

				<div className="space-y-6 mt-4">
					{/* Description */}
					<p className="text-sm font-normal text-primary80">
						Configure alerts for Revenue vs Expenses
					</p>

					{/* Threshold Value */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-[#26064A]">
							Threshold Value
						</label>
						<Input
							type="number"
							value={thresholdValue}
							onChange={(e) => setThresholdValue(e.target.value)}
							placeholder="10"
							className="border-gray-200 placeholder:text-[rgba(38,6,74,0.2)]"
						/>
						<p className="text-sm font-normal text-primary80">
							The metric value that will trigger the alert
						</p>
					</div>

					{/* Condition */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-[#26064A]">
							Condition
						</label>
						<Select value={condition} onValueChange={setCondition}>
							<SelectTrigger className="border-gray-200">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="below">
									Below Threshold
								</SelectItem>
								<SelectItem value="above">
									Above Threshold
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Email Notification */}
					<div className="space-y-3">
						<div className="flex items-center justify-between border-t border-[rgba(106,18,205,0.10)]">
							<div className="space-y-1">
								<label className="text-sm font-medium text-[#26064A]">
									Email Notification
								</label>
								<p className="text-sm font-normal text-primary80">
									Receive email alerts when threshold conditions
									are met
								</p>
							</div>
							<Switch
								checked={emailNotification}
								onCheckedChange={setEmailNotification}
								className="data-[state=checked]:bg-[#6A12CD]"
							/>
						</div>

						{emailNotification && (
							<div className="space-y-2">
								<label className="text-sm font-medium text-[#26064A]">
									Email Address
								</label>
								<Input
									type="email"
									value={emailAddress}
									onChange={(e) => setEmailAddress(e.target.value)}
									placeholder="Enter email address"
									className="border-gray-200 placeholder:text-[rgba(38,6,74,0.2)]"
								/>
								<p className="text-xs text-gray-500">
									Notifications will be sent to this email address
								</p>
							</div>
						)}
					</div>
					<div className="flex justify-end pt-4 border-t border-[rgba(106,18,205,0.10)]">
						<Button
							onClick={handleCreateAlert}
							className="bg-[#6A12CD] hover:bg-[#6912CC] text-white px-6"
						>
							Create Alert
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SetThresholdAlertModal;

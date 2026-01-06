import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useActivityLogDetails } from '@/hooks/use-activity-log-details';
import { Loader2 } from 'lucide-react';
import EventInformation from './components/EventInformation';
import ActorSection from './components/ActorSection';
import TargetSection from './components/TargetSection';
import ChangeTrackingSection from './components/ChangeTrackingSection';
import AdditionalDetailsAccordion from './components/AdditionalDetailsAccordion';

export default function LogDetailsDrawer({ open, setOpen, logId }) {
	const { data, isLoading, error } = useActivityLogDetails(logId, {
		enabled: open && !!logId,
	});

	if (isLoading) {
		return (
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="right"
					className="p-0 max-w-[30rem]"
					classBtnClass="!size-4"
				>
					<div className="flex items-center justify-center h-full">
						<Loader2 className="h-8 w-8 animate-spin text-[#6A12CD]" />
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	if (error) {
		return (
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="right"
					className="p-0 max-w-[30rem]"
					classBtnClass="!size-4"
				>
					<div className="flex items-center justify-center h-full p-6">
						<div className="text-center">
							<p className="text-red-500 text-sm mb-2">
								Failed to load activity details
							</p>
							<p className="text-gray-500 text-xs">
								{error.message || 'An error occurred'}
							</p>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	const log = data?.data;

	if (!log) {
		return null;
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="p-0 max-w-[30rem] h-[100vh]"
				classBtnClass="!size-4"
			>
				<div className="h-full w-full flex flex-col">
					<SheetHeader className="p-6 pb-4 border-b border-[#6A12CD1A] flex-shrink-0">
						<SheetTitle className="text-base text-[#26064A] font-semibold">
							Activity Details
						</SheetTitle>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto p-6 space-y-4">
						<EventInformation log={log} />
						<ActorSection log={log} />
						{log.target && <TargetSection log={log} />}
						{(log.before_state || log.after_state) && (
							<ChangeTrackingSection log={log} />
						)}
						<AdditionalDetailsAccordion log={log} />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

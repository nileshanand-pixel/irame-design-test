import workflowActiveIcon from '@/assets/icons/workflow-active.svg';

export default function BuildWorkflowTabContent() {
	return (
		<div className="py-12 flex flex-col gap-2 items-center h-[13.90rem] my-2">
			<div className="bg-[#8B33AE0A] rounded-xl p-1 size-10 flex justify-center items-center">
				<div className="p-1 bg-[#8B33AE14] rounded-xl size-8 flex justify-center items-center">
					<img src={workflowActiveIcon} className="size-5" />
				</div>
			</div>

			<div className="text-[#000000] font-semibold">
				Build your Custom Workflows
			</div>

			<div className="text-[#00000099] text-sm">
				Build workflows that match your process, automate audits, streamline
				operations, and stay in control
			</div>

			<span className="text-[#26064A] text-xs font-medium py-1 px-2 rounded-2xl bg-[#6A12CD14] flex items-center justify-center">
				Coming Soon
			</span>
		</div>
	);
}

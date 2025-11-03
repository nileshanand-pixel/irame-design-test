import Banner from './banner';
import Dashboard from './dashboard';
import WorkflowLibrary from './workflow-library';
import Demo from './demo';

export default function Home() {
	return (
		<div className="w-full overflow-auto h-full space-y-10 py-4 px-8 max-w-[106.25rem] mx-auto">
			<Banner />

			<Dashboard />

			<div>
				<div className="text-sm text-[#00000066] font-semibold mb-4">
					Start from Scratch
				</div>

				<div className="flex gap-3">
					<WorkflowLibrary />

					<Demo />
				</div>
			</div>
		</div>
	);
}

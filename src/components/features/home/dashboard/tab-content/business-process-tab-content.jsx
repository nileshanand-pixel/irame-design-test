import CustomCarousel from '@/components/elements/custom-carousel';
import Card from '../../workflow-library/card';
import businessProcessActiveIcon from '@/assets/icons/business-process-active.svg';

export default function BusinessProcessTabContent() {
	// Sample data for the cards
	const businessProcessData = [
		{
			description:
				'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful',
			badges: [
				{
					label: 'Badge 01',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
				{
					label: 'Badge 02',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
			],
		},
		{
			description:
				'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful',
			badges: [
				{
					label: 'Badge 01',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
				{
					label: 'Badge 02',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
			],
		},
		{
			description:
				'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful',
			badges: [
				{
					label: 'Badge 01',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
				{
					label: 'Badge 02',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
			],
		},
		{
			description:
				'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful',
			badges: [
				{
					label: 'Badge 01',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
				{
					label: 'Badge 02',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
			],
		},
		{
			description:
				'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful',
			badges: [
				{
					label: 'Badge 01',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
				{
					label: 'Badge 02',
					color: '#5925DC',
					bgColor: '#F4F3FF',
				},
			],
		},
	];

	return (
		<div className="py-4 px-6 bg-[#6A12CD05] rounded-2xl border border-[#00000014]">
			<div className="mb-5">
				<div className="flex items-center gap-2">
					<span className="text-[#000000CC] font-semibold">
						Recent Business Processes
					</span>
					<span className="text-[#344054] text-[0.75rem] font-medium">
						Latest Business Processes Updates: 6
					</span>
				</div>
			</div>

			<CustomCarousel
				items={businessProcessData}
				renderItem={(item) => (
					<Card
						icon={businessProcessActiveIcon}
						heading={item.heading}
						description={item.description}
						badges={item.badges}
					/>
				)}
			/>
		</div>
	);
}

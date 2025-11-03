import rocket from '@/assets/icons/rocket.svg';
import demo from '@/assets/icons/demo.svg';
import DemoTrigger from './demo-trigger';

export default function Demo() {
	return (
		<div className="w-[calc(30%-0.75rem)] rounded-2xl border border-[#00000014] p-6 flex flex-col justify-between">
			<div className="flex gap-4">
				<div className="bg-[#8B33AE0A] rounded-xl p-1 size-10 flex justify-center items-center">
					<div className="p-1 bg-[#8B33AE14] rounded-xl size-8 flex justify-center items-center">
						<img src={rocket} className="size-5" />
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="text-[#000000CC] text-lg font-semibold">
						Get Started With Irame
					</div>
					<div className="text-[#00000099] text-sm font-medium">
						We’ll guide you through the necessary steps to get things up
						and running
					</div>
				</div>
			</div>

			<img src={demo} className="w-[45%] block mx-auto" />

			<DemoTrigger />
		</div>
	);
}

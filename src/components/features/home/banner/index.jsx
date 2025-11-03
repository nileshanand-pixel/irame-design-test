import { Button } from '@/components/ui/button';
import chatIcon from '@/assets/icons/chat-message-icon.svg';
import sendIcon from '@/assets/icons/send-icon.svg';
import useLocalStorage from '@/hooks/useLocalStorage';
import bannerBg from '@/assets/banner-bg.svg';
import { useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';

export default function Banner() {
	const [value] = useLocalStorage('userDetails');
	const dispatch = useDispatch();

	return (
		<div
			className="relative px-12 py-8 border border-[#26064A0A] rounded-[1.25rem] bg-cover bg-center bg-no-repeat overflow-hidden"
			style={{
				background:
					'linear-gradient(0deg, rgba(106, 18, 205, 0.02) 0%, rgba(106, 18, 205, 0.02) 100%), #FFF',
			}}
		>
			<div className="flex flex-col gap-6">
				<div>
					<div className="font-semibold text-[2rem] bg-gradient-to-l from-[#6A12CD66] to-[#6A12CDCC] bg-clip-text text-transparent">
						Hello,{' '}
						{value?.user_name
							?.split(' ')
							.map(
								(word) =>
									word.charAt(0).toUpperCase() +
									word.slice(1).toLowerCase(),
							)
							.join(' ')}
					</div>
					<div className="text-[#26064A4D] font-medium text-2xl">
						Ready to automate your next audit?
					</div>
				</div>

				<div className="">
					<Button
						variant="default"
						className="py-6 px-6 text-white bg-primary hover:bg-purple-80/80 font-medium rounded-lg text-sm text-center flex gap-2 items-center group"
						onClick={() =>
							dispatch(
								updateUtilProp([
									{
										key: 'isDatasourceSelectionModalOpen',
										value: true,
									},
								]),
							)
						}
					>
						<img src={chatIcon} className="size-5" />
						<span>Start new Chat</span>

						<img
							src={sendIcon}
							className="size-5 hidden group-hover:block"
						/>
					</Button>
				</div>
			</div>
			<div
				className="w-1/2 absolute right-0 top-0 h-full"
				style={{ backgroundImage: `url(${bannerBg})` }}
			/>
		</div>
	);
}

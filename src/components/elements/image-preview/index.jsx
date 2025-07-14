import { Dialog, DialogContent } from '@/components/ui/dialog';
import useS3File from '@/hooks/useS3File';
import { XCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import CircularLoader from '../loading/CircularLoader';

export default function ImagePreview({
	file,
	url,
	canCancel = false,
	handleCancel,
	showProgress = false,
	progress = 100,
}) {
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const { createS3File, isCreatingS3File } = useS3File();
	const [signedUrl, setSignedUrl] = useState('');
	const [failCount, setFailCount] = useState(0);

	const handleError = async () => {
		if (failCount < 3) {
			setFailCount((prev) => prev + 1);
			const newUrl = await createS3File(url);
			if (newUrl) {
				setFailCount(0);
				setSignedUrl(newUrl);
			}
		}
	};

	return (
		<div className="relative inline-flex">
			{isCreatingS3File ? (
				<div className="h-[100px] w-[150px] flex justify-center items-center gap-2 border rounded-md cursor-pointer text-sm">
					<CircularLoader size="sm" />
					<span>Loading...</span>
				</div>
			) : (
				<img
					src={signedUrl || url || URL.createObjectURL(file)}
					className="h-[100px] w-auto rounded-md cursor-pointer"
					onClick={() => setIsPreviewOpen((prev) => !prev)}
					onError={handleError}
				/>
			)}

			{canCancel && (
				<div
					className="absolute top-0 right-0 translate-x-[50%] translate-y-[-50%] cursor-pointer bg-[#fff] rounded-full z-[10]"
					onClick={() => handleCancel(file.name)}
				>
					<XCircle size={20} color="#26064A99" />
				</div>
			)}

			{showProgress && progress <= 99 ? (
				<div className="absolute bottom-0 left-0 h-[1px] w-full rounded-lg overflow-hidden">
					<div
						className="h-full bg-purple-100 rounded-lg"
						style={{
							width: `${progress}%`,
						}}
					></div>
				</div>
			) : null}

			<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
				<DialogContent className="min-w-[80vw] h-[80vh]">
					<div className="mt-[30px] w-full max-h-[calc(80vh-88px)]">
						{isCreatingS3File ? (
							<div className="w-full h-full flex justify-center items-center gap-2">
								<CircularLoader size="lg" />
								<span>Loading...</span>
							</div>
						) : (
							<img
								src={signedUrl || url || URL.createObjectURL(file)}
								className="w-full h-full object-contain"
								onError={handleError}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

import { getFileIcon } from '@/lib/utils';
import { ArrowSquareOut, BoxArrowDown } from '@phosphor-icons/react';
import { Hint } from '@/components/Hint';
import { Button } from '@/components/ui/button';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';

export default function SourceRow({ source }) {
	const { isDownloading, downloadS3File } = useS3File();

	return (
		<div
			key={source.file_id || source.id}
			className="border border-[#EAE8FA] rounded-lg py-2 px-4 flex items-center justify-between"
		>
			<div className="flex gap-2 w-4/5 items-center">
				<div className="p-1 shrink-0 rounded mr-2">
					<img
						src={getFileIcon(source.file_name)}
						className="size-8"
						alt="icon"
					/>
				</div>
				<span className="font-semibold truncate text-base">
					{source.file_name}
				</span>
			</div>
			<div className="flex items-center gap-4">
				<Hint label="Download">
					<Button
						variant="ghost"
						size="iconSm"
						onClick={() => {
							if (isDownloading) {
								return;
							}
							downloadS3File(source.url, source.file_name);
						}}
					>
						{isDownloading ? (
							<CircularLoader size="sm" />
						) : (
							<BoxArrowDown size={20} />
						)}
					</Button>
				</Hint>
				<Hint label="Open in new tab">
					<Button
						variant="ghost"
						size="iconSm"
						onClick={() => openFile(source.url)}
					>
						<ArrowSquareOut size={20} />
					</Button>
				</Hint>
			</div>
		</div>
	);
}

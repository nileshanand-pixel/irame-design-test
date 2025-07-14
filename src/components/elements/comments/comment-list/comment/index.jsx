import FilePreview from '@/components/elements/file-preview';
import ImagePreview from '@/components/elements/image-preview';
import UserProfileIcon from '@/components/elements/user-profile-icon';
import { formatRelativeTime } from '@/utils/date-utils';
import { isImageUrl } from '@/utils/file';
import capitalize from 'lodash.capitalize';
import { useMemo } from 'react';

export default function Comment({ commentData }) {
	const imageFilesData = useMemo(() => {
		if (!commentData?.files || commentData?.files?.length === 0) {
			return [];
		}
		return commentData?.files?.filter((file) => {
			return isImageUrl(file.file_url);
		});
	}, [commentData]);

	const otherFilesData = useMemo(() => {
		if (!commentData?.files || commentData?.files?.length === 0) {
			return [];
		}
		return commentData?.files?.filter((file) => {
			return !isImageUrl(file.file_url);
		});
	}, [commentData]);

	return (
		<div className="p-3 flex gap-3">
			<div>
				<UserProfileIcon
					userName={commentData?.user}
					userEmail={commentData?.email}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<div>
					<div className="text-sm font-semibold">
						{capitalize(commentData?.user)}
					</div>
					<div className="text-[#999999] text-xs font-medium mb-2">
						{formatRelativeTime(commentData?.created_at)}
					</div>
					<div className="text-sm text-primary100">
						{commentData?.text}
					</div>
				</div>
				{imageFilesData && imageFilesData.length !== 0 && (
					<div className="flex gap-3 flex-wrap">
						{imageFilesData.map((imageFileData) => (
							<ImagePreview
								url={imageFileData?.file_url}
								key={imageFileData?.file_id}
							/>
						))}
					</div>
				)}

				{otherFilesData && otherFilesData.length !== 0 && (
					<div className="flex gap-3 flex-wrap">
						{otherFilesData.map((otherFileData) => (
							<FilePreview
								key={otherFileData?.file_id}
								fileName={otherFileData?.file_name}
								fileUrl={otherFileData?.file_url}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

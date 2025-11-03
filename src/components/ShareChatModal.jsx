import { useEffect, useState, useMemo } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Share2 } from 'lucide-react';
import { getShareableUsers, shareChatSession } from '@/api/share.service';
import { toast } from '@/lib/toast';
import useAuth from '@/hooks/useAuth';

export function ShareChatModal({ open, onClose, sessionId }) {
	const [emails, setEmails] = useState('');
	const [users, setUsers] = useState([]);
	const [allUsers, setAllUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(false);
	const [error, setError] = useState('');
	const { userDetails } = useAuth();

	useEffect(() => {
		if (!open) return;

		const fetchSharableUsers = async () => {
			setIsFetching(true);
			try {
				const data = await getShareableUsers();
				setAllUsers(data);
			} catch (error) {
				console.error('Error fetching shareable users:', error);
			} finally {
				setIsFetching(false);
			}
		};

		fetchSharableUsers();
	}, [open]);

	const suggestions = useMemo(() => {
		if (!emails.trim() || users.length >= 3) return [];

		const lowerSearch = emails.toLowerCase();
		const filtered = allUsers.filter(
			(u) =>
				(u.name?.toLowerCase().includes(lowerSearch) ||
					u.email?.toLowerCase().includes(lowerSearch)) &&
				u.email !== userDetails?.email &&
				!users.find((selected) => selected.email === u.email),
		);
		const unique = Array.from(
			new Map(filtered.map((u) => [u.email, u])).values(),
		);

		return unique;
	}, [emails, allUsers, userDetails, users]);

	const handleAddUser = (user) => {
		if (users.length >= 3) {
			setError("Can't share more than three members at once.");
			setTimeout(() => setError(''), 3000);
			return;
		}
		if (!users.find((u) => u.email === user.email)) {
			setUsers([...users, user]);
		}
		setEmails('');
	};

	const handleInputChange = (e) => {
		if (users.length >= 3) {
			setError("Can't share more than three members at once.");
			setTimeout(() => setError(''), 3000);
			return;
		}
		setEmails(e.target.value);
		if (!e.target.value.trim()) {
			setError('');
		}
	};

	const handleRemove = (email) => {
		setUsers(users.filter((u) => u.email !== email));
		setError('');
	};

	const handleShare = async () => {
		if (!users.length) return;
		setLoading(true);
		try {
			await shareChatSession(sessionId, users);
			onClose();
			setUsers([]);
		} catch (err) {
			console.error('Error sharing chat:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-lg rounded-2xl p-0 pb-6 gap-0">
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle className="flex items-center gap-2 text-base text-primary80 font-semibold justify-between w-full">
						<div className="flex gap-3 items-center">
							<div className="relative flex items-center justify-center w-14 h-14">
								<div className="absolute inset-0 rounded-full bg-purple-8" />
								<div className="absolute w-10 h-10 rounded-full bg-purple-16 opacity-60" />
								<Share2 className="w-5 h-5 text-primary" />
							</div>
							<span className="text-lg text-primary80 font-bold">
								Share Chat
							</span>
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="relative px-6 pt-6 pb-2 h-full">
					<Input
						placeholder={
							isFetching ? 'Fetching users...' : 'Enter name or email'
						}
						value={emails}
						onChange={handleInputChange}
						className="px-4 py-2 text-gray-400"
						disabled={isFetching}
					/>

					{error && <p className="text-red-500 text-sm mt-1">{error}</p>}

					{suggestions.length > 0 && (
						<div className="absolute max-w-96 overflow-y-auto max-h-60 show-scrollbar scrollbar-thumb-only left-6 right-0 mt-1 bg-white border rounded-xl shadow-lg z-10">
							{suggestions.map((s) => (
								<div
									key={s.email}
									className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 rounded-xl"
									onClick={() => handleAddUser(s)}
								>
									<div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-semibold text-sm">
										{s.name[0].toUpperCase()}
									</div>
									<div className="flex flex-col">
										<span className="font-medium text-sm text-gray-700">
											{s.name}
										</span>
										<span className="text-xs text-gray-500 font-normal">
											{s.email}
										</span>
									</div>
								</div>
							))}
						</div>
					)}

					{users.length > 0 && (
						<div className="mt-5">
							<p className="text-sm text-gray-500 mb-2">
								This chat will be shared with {users.length} member
								{users.length === 1 ? '' : '(s)'}
							</p>

							<div
								className="
									flex flex-col gap-1 max-h-52 overflow-y-auto relative 
									show-scrollbar scrollbar-thumb-only bg-white
									[mask-image:linear-gradient(to_bottom,transparent_0%,black_5%,black_80%,transparent_100%)]
									[mask-repeat:no-repeat] [mask-size:100%_100%] pb-1
								"
							>
								{users.map((u) => (
									<div
										key={u.email}
										className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md"
									>
										<div className="flex items-center gap-2">
											<div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-sm">
												{u.name[0].toUpperCase()}
											</div>
											<span className="text-sm font-medium text-gray-900">
												{u.name}
											</span>
										</div>

										<X
											className="w-4 h-4 text-gray-500 cursor-pointer hover:text-destructive"
											onClick={() => handleRemove(u.email)}
										/>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{users.length > 0 && (
					<div className="flex justify-end gap-2 px-6 ">
						<Button
							variant="outline"
							className="h-8 px-4 text-xs"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button
							className="bg-primary text-white h-8 px-4 text-xs"
							onClick={handleShare}
							disabled={loading || users.length === 0}
						>
							{loading ? 'Sharing...' : 'Share'}
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

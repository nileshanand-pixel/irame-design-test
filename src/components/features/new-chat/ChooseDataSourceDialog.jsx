/* eslint-disable react/prop-types */
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { getDataSources } from '../configuration/service/configuration.service';
import Cookies from 'js-cookie';
import { tokenCookie } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import useLocalStorage from '@/hooks/useLocalStorage';

const ChooseDataSourceDialog = ({
	open,
	setOpen,
	setSelectedDataSource,
	selectedDataSource,
	handleNextStep,
}) => {
	const [dataSources, setDataSources] = useState([]);
	const [value, setValue] = useLocalStorage('dataSource');

	const navigate = useNavigate();

	const getCookieToken = () => {
		return Cookies.get('token');
	};
	const handleSelect = () => {
		if (!selectedDataSource) return;
		navigate(`/app/new-chat/?step=3&dataSourceId=${selectedDataSource}`);
		handleNextStep(3);
		setOpen(false);
	};
	useEffect(() => {
		const token = getCookieToken() || tokenCookie;
		if (token) {
			getDataSources(token).then((resp) => {
				setDataSources(Array.isArray(resp) ? resp : []);
			});
		}
	}, [getCookieToken()]);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[525px] ">
				<DialogHeader className="border-b pb-3">
					<DialogTitle>Choose Data Source</DialogTitle>
					<DialogDescription>
						You can always change it later from the data source page
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					{dataSources?.length ? (
						dataSources?.map((source) => (
							<div
								className="rounded-xl bg-purple-4 p-4 flex items-center gap-4"
								key={source.datasource_id}
							>
								<RadioGroup
									className="w-full"
									onClick={() => {
										setSelectedDataSource(source.datasource_id);
										setValue({
											...value,
											id: selectedDataSource,
											name: source.name,
										});
									}}
								>
									<div className="flex items-center justify-between space-x-2">
										<Label
											htmlFor={source.datasource_id}
											className="w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-7 cursor-pointer"
										>
											<i className="bi-database text-purple-100 me-2 text-base"></i>
											{source.name}
										</Label>
										<RadioGroupItem
											value={selectedDataSource}
											id={source.datasource_id}
										/>
									</div>
								</RadioGroup>
							</div>
							// </div>
						))
					) : (
						<p className="text-primary40 text-sm">
							No data sources found
						</p>
					)}
				</div>
				<DialogFooter className="w-full">
					<Button
						onClick={() => setOpen(false)}
						variant="outline"
						className="rounded-lg w-full"
					>
						Cancel
					</Button>
					<Button
						onClick={() => handleSelect()}
						className="rounded-lg w-full hover:bg-purple-100 hover:text-white hover:opacity-80"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ChooseDataSourceDialog;

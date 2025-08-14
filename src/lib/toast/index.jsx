import {
	toast as notify,
	ToastContainer as NotificationContainer,
} from 'react-toastify';
import errorSvg from './icons/error.svg';
import './toast.css';

export const ToastContainer = () => {
	return (
		<NotificationContainer
			stacked={true}
			position="bottom-right"
			hideProgressBar={true}
		/>
	);
};

const ToastComponent = ({ message, action }) => {
	return (
		<div className="flex gap-2 text-primary100 items-center">
			<div>{message}</div>
			{action}
		</div>
	);
};

export const toast = {
	success: (message, { action, ...config } = {}) => {
		return notify.success(<ToastComponent message={message} action={action} />, {
			icon: false,
			closeButton: false,
			...config,
		});
	},
	error: (message, { action, ...config } = {}) => {
		return notify.error(<ToastComponent message={message} action={action} />, {
			icon: <img src={errorSvg} className="errorIcon" />,
			closeButton: false,
			...config,
		});
	},
};

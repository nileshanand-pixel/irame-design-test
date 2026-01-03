import { useState, useEffect, useCallback, useMemo } from 'react';

const SEVERITY_MAP_TO_UI = {
	low: 'LOW',
	medium: 'MEDIUM',
	high: 'HIGH',
};

const ACTION_MAP_TO_API = {
	NEED_ACTION: 'need_action',
	BUSINESS_AS_USUAL: 'business_as_usual',
	SYSTEMATIC_EXCEPTION: 'systematic_exception',
	FALSE_POSITIVE: 'false_positive',
	APPROVED: 'approved',
};

const SEVERITY_MAP_TO_API = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
};

export function useFormState(caseData) {
	const [dueDate, setDueDate] = useState();
	const [action, setAction] = useState();
	const [severity, setSeverity] = useState();
	const [description, setDescription] = useState('');
	const [comment, setComment] = useState('');
	const [attachedFiles, setAttachedFiles] = useState([]);
	const [assignedUsers, setAssignedUsers] = useState([]);
	const [flagging, setFlagging] = useState('');
	const [initialState, setInitialState] = useState({});

	// Initialize form state from caseData
	useEffect(() => {
		if (caseData) {
			// Parse due date
			let newDueDate;
			if (caseData.dueDate) {
				newDueDate =
					typeof caseData.dueDate === 'string'
						? new Date(caseData.dueDate)
						: caseData.dueDate;
			}

			// Map severity
			const normalizedSeverity = caseData.severity
				? caseData.severity.toLowerCase()
				: '';
			const newSeverity = SEVERITY_MAP_TO_UI[normalizedSeverity] || 'MEDIUM';

			// Get description
			const newDescription = caseData.description || '';

			// Transform assigned users
			let newAssignedUsers = [];
			if (
				caseData.assigned &&
				Array.isArray(caseData.assigned) &&
				caseData.assigned.length > 0
			) {
				newAssignedUsers = caseData.assigned.map((user) => {
					if (typeof user === 'string') {
						return {
							id: user,
							name: user,
							email: `${user.toLowerCase()}@example.com`,
						};
					}
					return {
						id: user.user_id || user.id || Math.random(),
						name: user.name || user.username || 'Unknown',
						email:
							user.email ||
							`${(user.name || user.username || 'user').toLowerCase().replace(' ', '.')}@example.com`,
					};
				});
			}

			const newAction = caseData.action || 'NEED_ACTION';

			const newFlagging = caseData.flagging || '';

			setDueDate(newDueDate);
			setAction(newAction);
			setSeverity(newSeverity);
			setDescription(newDescription);
			setAssignedUsers(newAssignedUsers);
			setAttachedFiles([]);
			setComment('');
			setFlagging(newFlagging);

			setInitialState({
				dueDate: newDueDate,
				action: newAction,
				severity: newSeverity,
				description: newDescription,
				assignedUsers: newAssignedUsers,
				comment: '',
				attachedFiles: [],
				flagging: newFlagging,
			});
		}
	}, [caseData]);

	// Compute changes
	const hasChanges = useMemo(() => {
		const current = {
			dueDate: dueDate?.getTime(),
			action,
			severity,
			description,
			assignedUsers: JSON.stringify(assignedUsers),
			comment,
			attachedFiles: JSON.stringify(attachedFiles),
			flagging,
		};
		const initial = {
			dueDate: initialState.dueDate?.getTime(),
			action: initialState.action,
			severity: initialState.severity,
			description: initialState.description,
			assignedUsers: JSON.stringify(initialState.assignedUsers),
			comment: initialState.comment,
			attachedFiles: JSON.stringify(initialState.attachedFiles),
			flagging: initialState.flagging,
		};
		return JSON.stringify(current) !== JSON.stringify(initial);
	}, [
		dueDate,
		action,
		severity,
		description,
		assignedUsers,
		comment,
		attachedFiles,
		flagging,
		initialState,
	]);

	// Build updates object for API
	const getUpdates = useCallback(() => {
		const updates = {};

		if (action !== initialState.action) {
			updates.action_status =
				ACTION_MAP_TO_API[action] || action.toLowerCase();
		}

		if (severity !== initialState.severity) {
			updates.severity =
				SEVERITY_MAP_TO_API[severity] || severity.toLowerCase();
		}

		if (dueDate?.getTime() !== initialState.dueDate?.getTime()) {
			if (dueDate) {
				updates.due_date = dueDate.toISOString();
			}
		}

		if (description !== initialState.description) {
			updates.description = description;
		}

		const currentAssignedIds = assignedUsers.map((u) => u.user_id).sort();
		const initialAssignedIds = (initialState.assignedUsers || [])
			.map((u) => u.user_id)
			.sort();
		const assignedChanged =
			JSON.stringify(currentAssignedIds) !==
			JSON.stringify(initialAssignedIds);

		if (assignedChanged) {
			updates.assigned_to = assignedUsers.map((u) => u.user_id);
		}

		if (flagging !== initialState.flagging) {
			updates.flagging = flagging;
		}

		return updates;
	}, [
		action,
		severity,
		dueDate,
		description,
		assignedUsers,
		flagging,
		initialState,
	]);

	const updateInitialState = useCallback((newInitialOrUpdater) => {
		if (typeof newInitialOrUpdater === 'function') {
			setInitialState(newInitialOrUpdater);
		} else {
			setInitialState(newInitialOrUpdater);
		}
	}, []);

	return {
		dueDate,
		setDueDate,
		action,
		setAction,
		severity,
		setSeverity,
		description,
		setDescription,
		comment,
		setComment,
		attachedFiles,
		setAttachedFiles,
		assignedUsers,
		setAssignedUsers,
		flagging,
		setFlagging,
		initialState,
		hasChanges,
		getUpdates,
		updateInitialState,
	};
}

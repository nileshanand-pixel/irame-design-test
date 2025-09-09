import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { deleteTemplate, getTemplates } from '../../../service/new-chat.service';

export const useTemplates = () => {
	const [savedQueryReference, setSavedQueryReference] = useState({
		id: '',
		title: '',
	});
	const [showSaveEditTemplateModal, setShowSaveEditTemplateModal] =
		useState(false);
	const [editTemplateData, setEditTemplateData] = useState({
		name: '',
		id: '',
		isEditing: false,
	});

	// Query to fetch templates
	const templatesQuery = useQuery({
		queryKey: ['saved-queries'],
		queryFn: () => getTemplates(),
		enabled: true,
	});

	// Mutation to delete templates
	const deleteTemplateMutation = useMutation({
		mutationFn: async (templateId) => {
			await deleteTemplate(templateId);
		},
		onSuccess: () => {
			templatesQuery?.refetch();
			toast.success('Template deleted Successfully');
		},
		onError: (err) => {
			console.log('Error deleting Template', err);
			logError(err, { feature: 'chat', action: 'delete-template' });
			toast.error('Something went wrong while deleting template');
		},
	});

	const handleDeleteTemplate = (templateId) => {
		if (confirm('Are you sure that you want to delete this template?')) {
			deleteTemplateMutation.mutate(templateId);
		}
	};

	const resetEditTemplateData = () => {
		setEditTemplateData({
			id: '',
			isEditing: false,
			name: '',
		});
	};

	const handleEditTemplate = (templateId) => {
		const queriesToEditData = templatesQuery?.data?.saved_queries?.filter(
			(data) => data?.external_id === templateId,
		)?.[0];

		if (queriesToEditData) {
			const queriesToEdit = queriesToEditData?.data?.queries;

			if (queriesToEdit) {
				setEditTemplateData({
					isEditing: true,
					name: queriesToEditData?.name,
					id: queriesToEditData?.external_id,
				});
				setShowSaveEditTemplateModal(true);
				return {
					queries: queriesToEdit.map((data, index) => ({
						text: data?.text,
						id: index + 1,
					})),
					mode: queriesToEditData?.type,
				};
			}
		}
		return null;
	};

	const handleTemplateSelect = (templateId) => {
		const selectedTemplate = templatesQuery?.data?.saved_queries?.find(
			(data) => data?.external_id === templateId,
		);

		if (selectedTemplate) {
			setSavedQueryReference({
				id: templateId,
				title: selectedTemplate.name,
			});

			return {
				mode: selectedTemplate?.type,
				queries: selectedTemplate?.data?.queries?.map(
					(query, queryIndex) => ({
						text: query?.text,
						id: queryIndex + 1,
					}),
				),
			};
		}

		return null;
	};

	return {
		templates: templatesQuery?.data,
		isLoading: templatesQuery?.isLoading,
		templateActions: {
			handleDelete: handleDeleteTemplate,
			handleEdit: handleEditTemplate,
			handleSelect: handleTemplateSelect,
			refetch: templatesQuery?.refetch,
		},
		savedQueryReference,
		setSavedQueryReference,
		showSaveEditTemplateModal,
		setShowSaveEditTemplateModal,
		editTemplateData,
		setEditTemplateData,
		resetEditTemplateData,
	};
};

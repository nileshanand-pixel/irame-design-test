import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';


const WorkflowDetails = ({ workflowDetails, sidebarOpen, onViewHistory }) => {
    const detailFields = [
      { label: 'Name', value: workflowDetails?.name },
      { label: 'Tags', value: workflowDetails?.tags?.join(', ') },
      { label: 'Status', value: workflowDetails?.status },
      { label: 'Workflow ID', value: workflowDetails?.external_id },
      { 
        label: 'Description', 
        value: workflowDetails?.description,
        isTextarea: true 
      },
    ];
  
    return (
      <div className="mt-2 mb-10">
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-primary10">
          <h2 className="text-xl font-semibold">Run Workflow</h2>
          <div className="flex space-x-2">
            {!sidebarOpen && (
              <Button
                variant="outline"
                onClick={onViewHistory}
                className="text-sm font-semibold border hover:bg-purple-4/8 flex items-center"
              >
                <span>View History</span>
                <span className="material-symbols-outlined text-xl rounded-md p-1">history</span>
              </Button>
            )}
            <Button
              className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
              onClick={() => alert('implement update workflow')}
            >
              Update Workflow
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {detailFields.map((field, index) => (
            <div key={index} className={field.isTextarea ? 'col-span-2' : ''}>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </Label>
              {field.isTextarea ? (
                <textarea
                  value={field.value || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-purple-4/8 text-gray-500 focus:outline-none resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={field.value || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-purple-4/8 text-gray-500 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };


export default WorkflowDetails;
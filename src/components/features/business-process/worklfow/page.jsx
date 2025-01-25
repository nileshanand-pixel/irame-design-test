import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import SessionHistoryPanel from './SessionHistoryPanel';
import { DataSourceSelector } from './DataSourceSelector'; // Import your modal component

// ================================
// Fake Data & Constants
// ================================
const STEPS_DATA = [
  { id: 1, text: 'Evaluate overall marketing performance...' },
  { id: 2, text: 'Identify top-performing channels...' },
  { id: 3, text: 'Optimize campaign performance...' },
  { id: 4, text: 'Set goals for the next cycle.' },
];

const BREADCRUMB_ITEMS = (businessProcessId) => [
  { label: 'Business Process', path: '/app/business-process' },
  { label: 'Finance', path: `/app/business-process/${businessProcessId}` },
  { label: 'Budget vs Actual Monitoring' },
];

const WORKFLOW_DETAILS = {
  name: 'Budget vs. Actuals Monitoring',
  tags: ['tag01', 'tag 02'],
  frequency: 'Monthly',
  workflowId: 'BPU657',
  description: 'Workflow Description',
};

// ================================
// Top-Level Workflow Page
// ================================
export default function WorkflowPage() {
  const { businessProcessId } = useParams();
  const navigate = useNavigate();

  // Toggles the right sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-full w-full overflow-hidden text-primary80">
      {/* Breadcrumb */}
      <Breadcrumb items={BREADCRUMB_ITEMS(businessProcessId)} navigate={navigate} />

      <div
        className={`h-[calc(100vh-64px)] overflow-x-auto ${
          sidebarOpen ? 'md:w-full' : 'md:w-3/5 md:mx-auto'
        } transition-all ease-in-out duration-300`}
      >
        <div className="min-w-[900px] h-full">
          <PanelGroup direction="horizontal" className="w-full h-full">
            {/* LEFT PANEL */}
            <Panel defaultSize={60} minSize={40}>
              <div className="overflow-y-auto h-full bg-white relative p-4 flex flex-col min-h-full">
                <WorkflowDetails
                  sidebarOpen={sidebarOpen}
                  onViewHistory={() => setSidebarOpen(true)}
                />
                <DataSourceCard />
                <StepsList steps={STEPS_DATA} disabled />

                <div className="mt-auto sticky bottom-12 left-0 flex justify-center py-4">
                  <Button
                    className="rounded-lg hover:bg-purple-100 h-12 py-1 hover:text-white hover:opacity-80 w-3/4"
                    onClick={() => alert('implement run workflow')}
                  >
                    Run Workflow
                  </Button>
                </div>
              </div>
            </Panel>

            {/* RIGHT PANEL */}
            {sidebarOpen && (
              <>
                <PanelResizeHandle className="w-2 h-full cursor-col-resize bg-gray-200 hover:bg-gray-300" />
                <Panel defaultSize={30} minSize={15}>
                  <div className=" border-l border-gray-200 overflow-y-auto h-full flex flex-col">
                    <SessionHistoryPanel onClose={() => setSidebarOpen(false)} />
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}


// ================================
// Sub-Components
// ================================
const Breadcrumb = ({ items, navigate }) => (
  <div className="w-full px-5 py-3 border-t-2 border-b-2">
    <div className="flex items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.path ? (
            <h1
              onClick={() => navigate(item.path)}
              className="text-2xl font-semibold cursor-pointer"
            >
              {item.label}
            </h1>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && <span>/</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const StepsList = ({ steps, disabled }) => (
  <div className="space-y-4 flex flex-col gap-4 mt-4 mb-8">
    {steps.map((step, index) => (
      <Step key={step.id} step={step} index={index} disabled={disabled} />
    ))}
  </div>
);

const Step = ({ step, index, disabled }) => {
  const stepNumber = String(index + 1).padStart(2, '0');
  return (
    <div className="rounded-2xl bg-purple-4 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg">Step {stepNumber}:</div>
      </div>
      <textarea
        disabled={disabled}
        value={step.text}
        className={`w-full h-24 p-2 border rounded-lg text-primary60 resize-none ${
          disabled ? 'bg-transparent' : ''
        }`}
      />
    </div>
  );
};



const DataSourceCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="mb-8 text-primary80 border border-black/10 rounded-xl shadow-none">
        <CardHeader>
          <div className="flex justify-between border-b pb-3">
            <div>
              <CardTitle className="text-lg font-semibold">Data Source</CardTitle>
              <CardDescription className="text-sm text-primary60">
                Securely connect to a datasource
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
              onClick={() => setIsModalOpen(true)}
            >
              Connect Data Source
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-48 pb-4 border-b flex items-center justify-center rounded-md">
            <p className="text-gray-500 text-sm">Recommendations will come here</p>
          </div>
          <VariablesSection />
        </CardContent>
      </Card>

      <DataSourceSelector 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};


const VariablesSection = () => (
  <div>
    <h4 className="text-lg font-semibold text-primary80 mb-2">Variables</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array(4)
        .fill('')
        .map((_, index) => (
          <VariableSelect key={index} index={index} />
        ))}
    </div>
  </div>
);

const VariableSelect = ({ index }) => (
  <div className="flex flex-col">
    <Label className="block text-sm text-primary60 font-medium mb-1">
      Variable {index + 1}
    </Label>
    <select
      className="w-full p-3 border rounded-md bg-white focus:outline-none"
      defaultValue="7 Days"
    >
      <option>7 Days</option>
      <option>14 Days</option>
      <option>30 Days</option>
    </select>
  </div>
);

const WorkflowDetails = ({ sidebarOpen, onViewHistory }) => {
  const detailFields = [
    { label: 'Name', value: WORKFLOW_DETAILS.name },
    { label: 'Add Tags', value: WORKFLOW_DETAILS.tags.join(', ') },
    { label: 'Frequency of Checks', value: WORKFLOW_DETAILS.frequency },
    { label: 'Workflow ID', value: WORKFLOW_DETAILS.workflowId },
    {
      label: 'Add a description to this workflow',
      value: WORKFLOW_DETAILS.description,
      isTextarea: true,
    },
  ];

  return (
    <div className="mt-2 mb-10">
      <HeaderWithActions sidebarOpen={sidebarOpen} onViewHistory={onViewHistory} />
      <DetailsForm fields={detailFields} />
    </div>
  );
};

const HeaderWithActions = ({ sidebarOpen, onViewHistory }) => {
  return (
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
            <span className="material-symbols-outlined text-xl rounded-md p-1">
              history
            </span>
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
  );
};

const DetailsForm = ({ fields }) => (
  <div className="grid grid-cols-2 gap-4">
    {fields.map((field, index) => (
      <div key={index} className={field.isTextarea ? 'col-span-2' : ''}>
        <Label
          htmlFor={field.label.toLowerCase()}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {field.label}
        </Label>
        {field.isTextarea ? (
          <textarea
            id={field.label.toLowerCase()}
            value={field.value}
            disabled
            className="w-full px-3 py-2 border rounded-md bg-purple-4/8 text-gray-500 focus:outline-none resize-none"
          />
        ) : (
          <input
            type="text"
            id={field.label.toLowerCase()}
            value={field.value}
            disabled
            className="w-full px-3 py-2 border rounded-md bg-purple-4/8 text-gray-500 focus:outline-none"
          />
        )}
      </div>
    ))}
  </div>
);


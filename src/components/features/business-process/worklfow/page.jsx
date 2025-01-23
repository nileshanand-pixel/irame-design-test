import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

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
// React DnD: constants, hooks
// ================================
const ItemTypes = {
  RESIZE_HANDLE: 'RESIZE_HANDLE',
};

/**
 * This is the small draggable "handle" on the left edge
 * of the sidebar. We store the sidebar's starting width
 * in the item, so the drop target can continuously
 * compute new widths.
 */
function ResizeHandle({ sidebarWidthPct }) {
  // This component doesn’t do the actual resizing—just a “drag source.”
  // The drop target’s “hover” callback does the continuous updates.
  const [, dragRef] = useDrag(() => ({
    type: ItemTypes.RESIZE_HANDLE,
    item: { startWidthPct: sidebarWidthPct },
  }));

  return (
    <div
      ref={dragRef}
      className="w-2 h-full cursor-col-resize bg-gray-200 hover:bg-gray-300"
      style={{ touchAction: 'none' }} // helps on touch devices
    />
  );
}

/**
 * The top-level container that sets up the DnD context.
 * Inside it, we have the actual WorkflowPage layout, plus
 * the drop target that adjusts the sidebar size in `hover`.
 */
export default function WorkflowPageContainer() {
  return (
    <DndProvider backend={HTML5Backend}>
      <WorkflowPage />
    </DndProvider>
  );
}

// ================================
// Main Layout Component
// ================================
function WorkflowPage() {
  const { businessProcessId } = useParams();
  const navigate = useNavigate();

  // Is the right sidebar open?
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar width in *percent* (not px). Defaults to 25%.
  const [sidebarWidthPct, setSidebarWidthPct] = useState(25);

  /**
   * We'll define a drop target over the entire layout,
   * so that we can “hover” anywhere while dragging the handle
   * to continuously update the sidebar width.
   */
  const [, dropRef] = useDrop(() => ({
    accept: ItemTypes.RESIZE_HANDLE,
    hover: (dragItem, monitor) => {
      // The “difference from initial offset” is how far
      // the mouse has moved horizontally since drag started.
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      // The initial sidebar width percentage:
      const startWidth = dragItem.startWidthPct;

      // The main pointer movement in x:
      const moveX = delta.x; // positive => dragging to the right

      // We want to convert moveX to an approximate percentage shift.
      // The simplest approach: assume the container is the window’s width.
      const containerWidth = window.innerWidth;

      // new width is start + (movement in px / total width) * 100
      let newWidth = startWidth - (moveX / containerWidth) * 100;

      // clamp it so it’s not too small or too big
      if (newWidth < 15) newWidth = 15;
      if (newWidth > 50) newWidth = 50;

      setSidebarWidthPct(newWidth);
    },
  }));

  return (
    <div
      ref={dropRef}
      // Make this container "overflow-hidden" so each column can scroll independently
      className="h-full w-full overflow-hidden text-primary80"
    >
      <Breadcrumb items={BREADCRUMB_ITEMS(businessProcessId)} navigate={navigate} />

      {/**
       * We'll use CSS grid with 2 columns:
       * - If sidebarOpen = false,  left col is "auto" but we keep the original centered style.
       *   The right col is `0%` or hidden.
       * - If sidebarOpen = true,   left col is `(100% - sidebarWidthPct)%` and the right col is `sidebarWidthPct%`.
       *
       * We'll keep the left container "mx-auto w-3/5" if closed, or remove it if open
       * so that it can expand. However, you can adapt as desired.
       */}
      <div
        className="grid transition-all duration-300 ease-in-out h-[calc(100vh-64px)]" 
        style={{
          gridTemplateColumns: sidebarOpen
            ? `calc(${100 - sidebarWidthPct}% ) ${sidebarWidthPct}%`
            : '100% 0%',
        }}
      >
        {/** LEFT COLUMN: main content, with its own scroll. */}
        <div className="overflow-y-auto h-full bg-white relative">
          <div
            // conditionally center it if the sidebar is closed
            className={`p-4 flex flex-col min-h-full ${
              sidebarOpen ? '' : 'mx-auto w-3/5'
            }`}
          >
            {/* The entire main content */}
            <WorkflowDetails
              sidebarOpen={sidebarOpen}
              onViewHistory={() => setSidebarOpen(true)}
            />
            <DataSourceCard />
            <StepsList steps={STEPS_DATA} disabled />

            {/**
             * The "Run Workflow" CTA is pinned at the bottom *inside*
             * the scrollable container. We'll use `sticky` so that
             * it remains visible as you scroll to the bottom.
             */}
            <div className="mt-auto sticky bottom-12 left-0 flex justify-center py-4 ">
              <Button
                className="rounded-lg hover:bg-purple-100 h-12 py-1 hover:text-white hover:opacity-80 w-3/4"
                onClick={() => alert('implement run workflow')}
              >
                Run Workflow
              </Button>
            </div>
          </div>
        </div>

        {/** RIGHT COLUMN: session history (plus the resize handle) */}
        <div className="bg-gray-50 border-l border-gray-200 overflow-y-auto relative h-full flex">
          {/* The drag handle on the left edge of the sidebar. */}
          <ResizeHandle sidebarWidthPct={sidebarWidthPct} />

          {sidebarOpen && <SessionHistoryPanel onClose={() => setSidebarOpen(false)} />}
        </div>
      </div>
    </div>
  );
}

// ================================
// Sub-Components (same as before)
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

const DataSourceCard = () => (
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
          onClick={() => alert('We will have a modal')}
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
);

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

const SessionHistoryPanel = ({ onClose }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end border-b p-2">
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-black font-bold text-xl"
          aria-label="Close History"
        >
          ×
        </button>
      </div>
      <div className="p-4">
        <p className="text-gray-500">
          (Session History content is not required to implement.)
        </p>
      </div>
    </div>
  );
};

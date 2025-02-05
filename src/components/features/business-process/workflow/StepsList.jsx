import React from 'react';

const StepsList = ({ steps, disabled }) => {
    if (!steps || steps.length === 0) return null;
    
    return (
      <div className="space-y-4 flex flex-col gap-4 mt-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="rounded-2xl bg-purple-4 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-lg">Step {String(index + 1).padStart(2, '0')}:</div>
            </div>
            <textarea
              disabled={disabled}
              value={step.text}
              className="w-full h-24 p-2 border rounded-lg text-primary60 resize-none bg-transparent"
            />
          </div>
        ))}
      </div>
    );
  };

export default StepsList;
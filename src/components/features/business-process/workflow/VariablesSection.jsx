// WorkflowPage.jsx
import React from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


const VariablesSection = ({ variables }) => {
  if (!variables || Object.keys(variables).length === 0) return null;

  return (
    <div>
      <h4 className="text-lg font-semibold text-primary80 mb-2">Variables</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(variables).map(([key, variable]) => {
          if (!['int', 'string'].includes(variable.type)) return null;
          
          return (
            <div key={key} className="flex flex-col">
              <Label className="block text-sm text-primary60 font-medium mb-1">
                {variable.name}
              </Label>
              <Input
                type="text"
                defaultValue={variable.default_value}
                className="w-full p-3 border rounded-md bg-white focus:outline-none"
                placeholder={`Enter ${variable.type}`}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {variable.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VariablesSection;
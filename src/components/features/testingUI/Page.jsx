import React from 'react';
import { User, Zap, Star, Bell } from 'lucide-react';
import MultiSelect from '@/components/elements/MultiSelect';

const TestRoute = () => {
  // Mock data for options
  const options = [
    { label: 'User', value: 'user', icon: User },
    { label: 'Power', value: 'power', icon: Zap },
    { label: 'Star', value: 'star', icon: Star },
    { label: 'Notification', value: 'notification', icon: Bell },
  ];

  // Handler for value changes
  const handleValueChange = (selectedValues) => {
    console.log('Selected values:', selectedValues);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">MultiSelect Test</h1>
      <MultiSelect
        options={options}
        onValueChange={handleValueChange}
        defaultValue={['user']}
        placeholder="Select options"
        modalPopover = {true}
        animation={0.5}
        maxCount={3}
      />
      <p className="mt-4 text-sm text-gray-600">
        Check the console to see the selected values when you interact with the MultiSelect.
      </p>
    </div>
  );
};

export default TestRoute;
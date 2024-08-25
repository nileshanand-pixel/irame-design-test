import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';


function AccessDropdown({ options, selectedValue, onChange }) {
  return (
    <Select value={selectedValue} onValueChange={onChange} className="border-none">
      <SelectTrigger className="text-[#26064A] text-xs font-medium leading-4 h-8 mt-2 gap-2 ml-2 w-fit border-none ">
        <SelectValue placeholder={selectedValue} />
      </SelectTrigger>
      <SelectContent className="p-0 m-0">
        <SelectGroup className="text-[#26064A]">
          {options.map((option) => (
            <div key={option.value}>
            {option?.value?.toLowerCase() === 'remove' && <hr/>}
            <SelectItem  value={option.value} disabled={option.disabled} className="hover:bg-[rgba(106,18,205,0.08)]" >
              {option.label}
            </SelectItem>
            </div>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default AccessDropdown;

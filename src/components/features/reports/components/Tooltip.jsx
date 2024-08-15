import React from 'react';

const Tooltip = ({ children, content }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-[#101828] text-white text-xs rounded-md px-3 py-1 whitespace-nowrap shadow-lg">
          {content}
        </div>
        <div className="w-2 h-2 bg-[#101828] absolute left-1/2 transform -translate-x-1/2 -translate-y-1 rotate-45"></div>
      </div>
    </div>
  );
};

export default Tooltip;

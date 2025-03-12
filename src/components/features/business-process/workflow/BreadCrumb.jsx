import React from 'react';

const Breadcrumb = ({ items, navigate }) => (
  <div className="w-full px-5 py-3 border-t-2 border-b-2">
    <div className="flex items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.path ? (
            <h1
              onClick={() => navigate(item.path)}
              className="text-xl lg:text-2xl min-w-4 font-medium cursor-pointer truncate"
            >
              {item.label}
            </h1>
          ) : (
            <span className=' text-xs md:text-sm shrink-0'>{item.label}</span>
          )}
          {index < items.length - 1 && <span>/</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);


export default Breadcrumb;

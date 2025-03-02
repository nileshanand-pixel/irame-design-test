import React from 'react';

const Breadcrumb = ({ items, navigate }) => (
  <div className="w-full px-5 py-3 border-t-2 border-b-2">
    <div className="flex items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.path ? (
            <h1
              onClick={() => navigate(item.path)}
              className="text-2xl font-medium cursor-pointer"
            >
              {item.label}
            </h1>
          ) : (
            <span className='text-sm'>{item.label}</span>
          )}
          {index < items.length - 1 && <span>/</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);


export default Breadcrumb;

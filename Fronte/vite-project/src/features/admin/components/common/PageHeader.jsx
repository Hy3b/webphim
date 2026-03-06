import React from 'react';

const PageHeader = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 font-medium">{description}</p>}
    </div>
  );
};

export default PageHeader;

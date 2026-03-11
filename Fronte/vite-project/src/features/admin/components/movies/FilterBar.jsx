import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';

const FilterBar = ({ tabs, activeTab, setActiveTab, onSearch, onCreate, createText }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-6 border-b border-gray-200 w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-semibold transition-colors duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} {tab.count !== undefined && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <button 
          onClick={onCreate}
          className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>{createText}</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search for order ID, customer, order status..."
          onChange={(e) => onSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
        />
      </div>
    </div>
  );
};

export default FilterBar;

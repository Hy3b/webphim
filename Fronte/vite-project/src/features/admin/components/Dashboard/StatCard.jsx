import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  unit, 
  change, 
  changeLabel, 
  isPositive, 
  icon: Icon, 
  iconColor, 
  iconBg 
}) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div>
        <div className="flex items-baseline space-x-1 mb-2">
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {unit && <span className="text-base font-semibold text-gray-500">{unit}</span>}
        </div>
        
        <div className="flex items-center text-xs font-medium">
          <span className="text-gray-400 mr-2">{changeLabel}</span>
          {change && (
            <span className={`flex items-center space-x-0.5 ${isPositive ? 'text-green-500' : 'text-rose-500'}`}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{change}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white rounded-lg p-3 shadow-lg text-sm border-0">
        <p className="font-semibold">{label}</p>
        <p className="text-cyan-400 font-bold mt-1">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data, title }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{title}</h3>
      </div>
      
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 500 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 500 }}
              tickFormatter={(val) => val === 0 ? '0 ₫' : `${(val/1000000).toFixed(1)}M`}
              dx={-15}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#06b6d4" 
              strokeWidth={5} 
              dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#06b6d4' }} 
              activeDot={{ r: 8, strokeWidth: 0, fill: '#06b6d4' }} 
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;

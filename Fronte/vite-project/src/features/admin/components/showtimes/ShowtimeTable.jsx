import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Eye } from 'lucide-react';

const Badge = ({ children, color = 'teal' }) => {
  const colors = {
    teal: 'bg-teal-100 text-teal-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    rose: 'bg-rose-100 text-rose-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold tracking-wider rounded ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const Toggle = ({ active }) => (
  <button
    disabled
    className={`relative inline-flex h-4 w-7 shrink-0 items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
      active ? 'bg-indigo-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
        active ? 'translate-x-[6px]' : '-translate-x-[6px]'
      }`}
    />
  </button>
);

const ShowtimeTable = ({ data }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-white">
          <tr>
            <th className="w-16 px-6 py-4"></th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 w-1/2">Phim</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Thời lượng</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Thể loại</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((item) => (
            <React.Fragment key={item.id}>
              {/* Main Row */}
              <tr className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => toggleRow(item.id)}
                    className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    {expandedRows[item.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <img src={item.poster} alt={item.title} className="w-12 h-16 object-cover rounded shadow-sm" />
                    <div className="flex flex-col space-y-1">
                      <h4 className="font-bold text-gray-800">{item.title}</h4>
                      {item.isSpecial && <Badge color="rose">Đặc biệt</Badge>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">{item.duration}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">{item.genre}</td>
              </tr>
              
              {/* Nested Sub-table */}
              {expandedRows[item.id] && (
                <tr>
                  <td colSpan="4" className="bg-gray-50/30 p-0">
                    <div className="border-l-4 border-indigo-500 ml-16 mr-6 my-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phòng</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Định dạng</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Số ghế</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Hoạt động</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {item.showtimes.map((st) => (
                            <tr key={st.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-700">
                                {st.startTime} <span className="text-gray-400 font-normal ml-1">đến {st.endTime}</span>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">{st.room}</td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <Badge color="indigo">{st.format}</Badge>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-center text-sm">
                                <span className={st.booked === st.total ? 'text-rose-600 font-bold' : 'text-gray-600'}>
                                  {st.booked}/{st.total} <span className="text-xs text-gray-400">Ghế</span>
                                </span>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-center">
                                <Toggle active={st.isActive} />
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button className="text-gray-400 hover:text-indigo-600 transition-colors p-1"><Eye size={16} /></button>
                                  <button className="text-gray-400 hover:text-teal-600 transition-colors p-1"><Edit size={16} /></button>
                                  <button className="text-gray-400 hover:text-rose-600 transition-colors p-1"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShowtimeTable;

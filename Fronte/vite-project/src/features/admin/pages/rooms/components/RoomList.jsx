import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

const mockRooms = [
  { id: 1, name: "P101", cinema: "Mỹ Đình", type: "2D", seatsBooked: 116, seatsTotal: 116, status: "ĐÃ XUẤT BẢN", active: true },
  { id: 2, name: "P102", cinema: "Mỹ Đình", type: "3D", seatsBooked: 149, seatsTotal: 149, status: "ĐÃ XUẤT BẢN", active: true },
  { id: 3, name: "P101", cinema: "Hà Đông", type: "2D", seatsBooked: 193, seatsTotal: 193, status: "ĐÃ XUẤT BẢN", active: true },
  { id: 4, name: "P102", cinema: "Hà Đông", type: "4D", seatsBooked: 149, seatsTotal: 149, status: "ĐÃ XUẤT BẢN", active: true },
  { id: 5, name: "P101", cinema: "Gò Vấp", type: "2D", seatsBooked: 116, seatsTotal: 116, status: "ĐÃ XUẤT BẢN", active: true },
  { id: 6, name: "P102", cinema: "Cinema An Bài", type: "2D", seatsBooked: 149, seatsTotal: 149, status: "ĐÃ XUẤT BẢN", active: true },
];

const RoomList = ({ onViewSeatMap, onAddRoom, onEditRoom }) => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="flex flex-col h-full">
      {/* Header & Breadcrumb */}
      <div className="mb-6 flex space-x-2 text-sm text-gray-500 font-medium">
        <span>Quản lý</span>
        <span>&gt;</span>
        <span className="text-gray-900">Danh sách phòng chiếu</span>
      </div>

      <h1 className="text-2xl font-bold uppercase mb-6 text-gray-800">DANH SÁCH PHÒNG CHIẾU</h1>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách phòng chiếu</h2>
            <button 
              onClick={onAddRoom}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
            >
              <Plus size={18} />
              <span className="font-medium">Tạo phòng chiếu</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-4 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'all' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span>Tất cả</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'all' ? 'bg-teal-100' : 'bg-gray-100'}`}>6</span>
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`pb-3 px-4 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'published' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span>Đã xuất bản</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'published' ? 'bg-teal-100' : 'bg-gray-100'}`}>6</span>
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`pb-3 px-4 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'draft' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <span>Bản nháp</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Search for order ID, customer, order status or something..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phòng chiếu</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại Phòng</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sức chứa</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hoạt động</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mockRooms.map((room, index) => (
                <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{room.name}</div>
                    <button 
                      onClick={() => onViewSeatMap(room)}
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-0.5"
                    >
                      Xem sơ đồ ghế
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {room.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      <span className="text-gray-900">{room.seatsBooked}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-teal-600">{room.seatsTotal} Ghế</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold rounded bg-teal-100 text-teal-700 uppercase tracking-wider">
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" defaultChecked={room.active} />
                        <div className="block bg-indigo-500 w-10 h-5 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition transform translate-x-5"></div>
                      </div>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onEditRoom(room)}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomList;

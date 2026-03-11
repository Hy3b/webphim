import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import ShowtimeTable from '../../components/showtimes/ShowtimeTable';

const mockShowtimeData = [
  {
    id: 1,
    title: 'Địa Đạo: Mặt Trời Trong Bóng Tối',
    poster: 'https://cdn.galaxycine.vn/media/2024/6/14/dia-dao-mat-troi-trong-bong-toi-1_1718359288210.jpg',
    isSpecial: true,
    duration: '100 Phút',
    genre: 'Lịch sử, Hành động',
    showtimes: [
      { id: 101, startTime: '19:00', endTime: '21:00', room: 'Phòng 01', format: '2D Phụ đề', booked: 10, total: 146, isActive: true },
      { id: 102, startTime: '20:30', endTime: '22:30', room: 'Phòng 03', format: '2D Thuyết minh', booked: 146, total: 146, isActive: true },
    ]
  },
  {
    id: 2,
    title: 'Lật Mặt 7: Một Điều Ước',
    poster: 'https://cdn.galaxycine.vn/media/2024/4/19/lm7-500_1713506456093.jpg',
    isSpecial: false,
    duration: '138 Phút',
    genre: 'Gia đình, Tâm lý',
    showtimes: [
      { id: 201, startTime: '18:15', endTime: '20:45', room: 'Phòng 02', format: '2D Phụ đề', booked: 85, total: 120, isActive: false },
    ]
  }
];

const FilterDropdown = ({ label, options }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <select className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow">
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const ShowtimesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full bg-admin-bg p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="QUẢN LÝ XUẤT CHIẾU" />
        <div className="text-sm font-medium text-gray-500">
          <span className="cursor-pointer hover:text-indigo-600">Quản lý</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 cursor-pointer">Quản lý xuất chiếu</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-end justify-between gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full lg:max-w-md">
          <div className="flex flex-col space-y-1.5 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày chiếu</label>
            <input 
              type="date" 
              defaultValue="2025-04-04" 
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow" 
            />
          </div>
          <FilterDropdown label="Trạng thái" options={['Tất cả', 'Đang hoạt động', 'Đã hủy']} />
        </div>
        
        <button 
          onClick={() => navigate('/admin/showtimes/create')}
          className="flex items-center justify-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm w-full lg:w-auto h-10 shrink-0"
        >
          <Plus size={18} />
          <span>Thêm xuất chiếu</span>
        </button>
      </div>

      {/* Main Table */}
      <ShowtimeTable data={mockShowtimeData} />
    </div>
  );
};

export default ShowtimesPage;

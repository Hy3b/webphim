import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

const Toggle = ({ active, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
      active ? 'bg-indigo-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
        active ? 'translate-x-2' : '-translate-x-2'
      }`}
    />
  </button>
);

const InputField = ({ label, placeholder, type = 'text', icon }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
      />
      {icon && (
        <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, placeholder, options = [] }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <select className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow pr-10">
        <option value="" disabled selected defaultValue>{placeholder}</option>
        {options.map(opt => <option key={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

const MovieFormPage = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isHot, setIsHot] = useState(false);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full bg-admin-bg p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="QUẢN LÝ PHIM" />
        <div className="text-sm font-medium text-gray-500">
          <span className="cursor-pointer hover:text-indigo-600">Quản lý</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 cursor-pointer">Quản lý phim</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Cột trái */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">Thêm Mới Phim</h3>
          
          <InputField label="Tên phim" placeholder="Panor: Tà Thuật Huyết Ngải" />
          
          <div className="grid grid-cols-2 gap-6">
            <InputField label="Đạo diễn" placeholder="Putipong Saisikaew" />
            <InputField label="Diễn viên" placeholder="Cherprang Areekul, Jackrin..." />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <InputField label="Ngày khởi chiếu" placeholder="11/04/2025" icon={<Calendar size={16} />} />
            <InputField label="Ngày kết thúc" placeholder="dd/mm/yyyy" icon={<Calendar size={16} />} />
            <InputField label="Thời lượng" placeholder="Nhập thời lượng phim" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <InputField label="Thể loại" placeholder="Kinh dị" />
            <SelectField label="Giới hạn độ tuổi" placeholder="13 tuổi trở lên" options={['13 tuổi trở lên', '16 tuổi trở lên', '18 tuổi trở lên', 'Mọi lứa tuổi']} />
          </div>

          <SelectField label="Phiên bản" placeholder="Select..." options={['2D Phụ đề', '2D Lồng tiếng', '3D Màn hình lớn', 'IMAX']} />

          <div className="flex flex-col space-y-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              rows="4"
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow"
              placeholder="Nội dung phim..."
            ></textarea>
          </div>
        </div>

        {/* Cột phải */}
        <div className="flex flex-col space-y-6">
          
          {/* Box Thêm mới & Lưu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Thêm mới</h3>
            <div className="flex space-x-6 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-800">Hoạt động:</span>
                <Toggle active={isActive} onChange={() => setIsActive(!isActive)} />
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-800">Hot:</span>
                <Toggle active={isHot} onChange={() => setIsHot(!isHot)} />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => navigate('/admin/movies')}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
              >
                Lưu nháp
              </button>
              <button 
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                onClick={() => navigate('/admin/movies')}
              >
                Xuất bản
              </button>
            </div>
          </div>

          {/* Box Cover */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Hình ảnh:</h3>
            <div className="flex items-center space-x-4 border border-gray-200 rounded-lg p-1">
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center">
                <ImageIcon size={16} className="mr-1" /> Chọn tệp
              </button>
              <span className="text-sm text-gray-400">Không có tệp nào được chọn</span>
            </div>
          </div>

          {/* Box Trailer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4">Code Youtube</h3>
            <input
              type="text"
              placeholder="Nhập code"
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default MovieFormPage;

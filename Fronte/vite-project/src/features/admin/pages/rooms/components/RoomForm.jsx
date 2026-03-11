import React, { useState } from 'react';
import { X } from 'lucide-react';

const RoomForm = ({ room, onBack }) => {
  const isEditing = !!room;
  
  const [formData, setFormData] = useState({
    name: room?.name || '',
    branch: room?.branch || '',
    type: room?.type || '2D',
    seatMapTemplate: room?.seatMapTemplate || 'medium'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted", formData);
    // In real app, call API here
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden m-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-semibold text-gray-700">
            {isEditing ? 'Sửa phòng chiếu' : 'Thêm phòng chiếu'}
          </h2>
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên phòng chiếu</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="P101"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow text-gray-700"
              />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              {/* Loại Phòng Chiếu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Phòng Chiếu</label>
                <div className="relative">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none transition-shadow bg-white text-gray-700"
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="4D">4D</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mẫu Sơ Đồ Ghế */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mẫu Sơ Đồ Ghế</label>
                <div className="relative">
                  <select
                    name="seatMapTemplate"
                    value={formData.seatMapTemplate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-indigo-200 rounded-md focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none transition-shadow bg-white text-gray-700 focus:border-indigo-300 hover:border-indigo-300"
                  >
                    <option value="small">Mẫu sơ đồ ghế nhỏ</option>
                    <option value="medium">Mẫu sơ đồ ghế trung bình</option>
                    <option value="large">Mẫu sơ đồ ghế lớn</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end space-x-3 bg-white mt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 font-medium transition-colors border border-gray-100"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-medium transition-colors"
            >
              {isEditing ? 'Lưu' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomForm;

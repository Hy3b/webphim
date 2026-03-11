import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';

const gridOptions = [
  { value: "10x10", cols: 10, label: "10x10 - Nhỏ" },
  { value: "13x13", cols: 13, label: "13x13 - Trung bình" },
  { value: "15x15", cols: 15, label: "15x15 - Vừa" },
  { value: "20x20", cols: 20, label: "20x20 - Lớn" }
];

const TemplateFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    gridTemplate: '13x13',
    normalRows: 5,
    vipRows: 3,
    doubleRows: 2,
    description: ''
  });

  const [capacity, setCapacity] = useState(0);

  // Tính toán sức chứa
  useEffect(() => {
    const selectedGrid = gridOptions.find(g => g.value === formData.gridTemplate);
    const cols = selectedGrid ? selectedGrid.cols : 13;
    
    // Convert to numbers to prevent string concatenation
    const normal = parseInt(formData.normalRows) || 0;
    const vip = parseInt(formData.vipRows) || 0;
    const double = parseInt(formData.doubleRows) || 0;

    // Assuming Double seat takes 2 columns, so max (cols/2) double seats per row
    // Each double seat holds 2 people, so row capacity is (floor(cols/2) * 2)
    const doubleCapacityPerRow = Math.floor(cols / 2) * 2;
    
    // However, for simplicity, maybe they just want 13 double seats if grid is 13x13? 
    // Let's assume standard capacity: 1 block = 1 person for normal/VIP. 
    // 1 double block = 2 persons.
    // If standard double seat takes 2 grid spaces, people per row is always roughly cols.
    // Let's just display formula: Total = (Normal + VIP) * Cols + Double * (floor(Cols/2) * 2)
    const totalCapacity = (normal * cols) + (vip * cols) + (double * doubleCapacityPerRow);
    
    setCapacity(totalCapacity);
  }, [formData.gridTemplate, formData.normalRows, formData.vipRows, formData.doubleRows]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4 sm:p-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden m-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-800 tracking-wide">
            Thêm Mẫu Sơ Đồ Ghế Mới
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 hover:text-gray-700 p-1.5 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            
            {/* Tên & Ma trận */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Tên Mẫu Sơ Đồ Ghế <span className="text-red-500">*</span></label>
                 <input
                   type="text"
                   name="name"
                   value={formData.name}
                   onChange={handleChange}
                   placeholder="VD: Mẫu IMAX 15x15"
                   required
                   className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-800"
                 />
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Ma Trận Ghế</label>
                 <div className="relative">
                   <select
                     name="gridTemplate"
                     value={formData.gridTemplate}
                     onChange={handleChange}
                     className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none appearance-none transition-all text-gray-800"
                   >
                     {gridOptions.map(opt => (
                       <option key={opt.value} value={opt.value}>{opt.label}</option>
                     ))}
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                     <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                       <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                     </svg>
                   </div>
                 </div>
               </div>
            </div>

            {/* Row Config & Capacity Calc */}
            <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-indigo-900">Cấu Hình Số Hàng</h3>
                 <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
                   <Calculator size={16} className="text-teal-600" />
                   <span className="text-sm font-semibold text-gray-700">Tổng sức chứa ước tính:</span>
                   <span className="text-base font-bold text-teal-600">{capacity} chỗ</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Hàng Ghế Thường</label>
                  <input
                    type="number"
                    min="0"
                    name="normalRows"
                    value={formData.normalRows}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Hàng Ghế VIP</label>
                  <input
                    type="number"
                    min="0"
                    name="vipRows"
                    value={formData.vipRows}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Hàng Ghế Đôi</label>
                  <input
                    type="number"
                    min="0"
                    name="doubleRows"
                    value={formData.doubleRows}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập ghi chú hoặc mô tả về cấu hình mẫu này..."
                rows="3"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-800 resize-none"
              ></textarea>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end space-x-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-colors border border-gray-200"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-semibold transition-colors shadow-md shadow-teal-500/20"
            >
              Thêm & Tạo Sơ Đồ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormModal;

import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import TemplateFormModal from './TemplateFormModal';

const mockTemplates = [
  { id: 1, name: "Mẫu rạp nhỏ", desc: "Mẫu phim cơ bản 5x10", grid: "10x10", status: "ĐÃ XUẤT BẢN", active: true },
  { id: 2, name: "Mẫu rạp vừa", desc: "Mẫu 3D trung bình", grid: "15x15", status: "Bản nháp", active: false },
  { id: 3, name: "Mẫu rạp lớn", desc: "Dành cho IMAX, sức chứa cao", grid: "20x20", status: "ĐÃ XUẤT BẢN", active: true },
];

const TemplateList = ({ onEditTemplate }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header & Breadcrumb */}
      <h1 className="text-2xl font-bold uppercase mb-6 text-gray-800 tracking-wide">
        DANH SÁCH MẪU SƠ ĐỒ GHẾ
      </h1>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex space-x-1 sm:space-x-4 border-b md:border-none border-gray-200 w-full md:w-auto overflow-x-auto">
            
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Add Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="font-medium whitespace-nowrap">Tạo Mẫu Sơ Đồ Ghế</span>
            </button>
          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Mẫu</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ma Trận Ghế</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mockTemplates.map((template, index) => (
                <tr key={template.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{template.name}</div>
                    <button 
                      onClick={() => onEditTemplate(template)}
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-0.5"
                    >
                      Xem sơ đồ ghế
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                    {template.desc}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {template.grid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onEditTemplate(template)}
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Trang trước</button>
            <span className="px-2">1 / 1</span>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Trang sau</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TemplateFormModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newTemplate) => {
            console.log("Adding:", newTemplate);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TemplateList;

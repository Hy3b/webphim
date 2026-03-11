import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Toggle = ({ active, onChange }) => (
  <button
    role="switch"
    aria-checked={active}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors duration-200 ease-in-out ${
      active ? 'bg-indigo-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        active ? 'translate-x-2' : '-translate-x-2'
      }`}
    />
  </button>
);

const Badge = ({ children, color = 'teal' }) => {
  const colors = {
    teal: 'bg-teal-100 text-teal-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const MovieTable = ({ movies }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Hình ảnh</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin phim</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Trạng thái</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Hoạt động</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Hot</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movies.map((movie, idx) => (
              <tr key={movie.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-32 w-24 rounded-lg overflow-hidden shadow-sm border border-gray-100">
                    <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-2 max-w-md">
                    <h3 className="text-lg font-bold text-indigo-900">{movie.title}</h3>
                    <div className="text-sm text-gray-600 grid grid-cols-[100px_1fr] gap-1">
                      <span className="font-semibold text-gray-900">Đạo diễn:</span> <span>{movie.director}</span>
                      <span className="font-semibold text-gray-900">Diễn viên:</span> <span className="truncate">{movie.cast}</span>
                      <span className="font-semibold text-gray-900">Thể loại:</span> <span>{movie.genre}</span>
                      <span className="font-semibold text-gray-900">Phân loại:</span> <span>{movie.ageRating}</span>
                      <span className="font-semibold text-gray-900">Khởi chiếu:</span> <span>{movie.releaseDate}</span>
                      <span className="font-semibold text-gray-900">Kết thúc:</span> <span>{movie.endDate}</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <span className="text-sm font-semibold text-gray-900">Phiên bản:</span>
                      <div className="flex space-x-2">
                        {movie.versions.map(v => (
                          <span key={v} className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-md">{v}</span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-1 text-sm text-gray-500">
                      Trailer code: <span className="font-mono text-gray-800">{movie.trailerCode}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Badge color={movie.status === 'PUBLISHED' ? 'teal' : 'gray'}>
                    {movie.status === 'PUBLISHED' ? 'ĐÃ XUẤT BẢN' : 'BẢN NHÁP'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Toggle active={movie.isActive} onChange={() => {}} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Toggle active={movie.isHot} onChange={() => {}} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <Link to={`/admin/movies/edit/${movie.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-md hover:bg-indigo-100 transition-colors">
                      <Pencil size={16} />
                    </Link>
                    <button className="text-rose-600 hover:text-rose-900 bg-rose-50 p-2 rounded-md hover:bg-rose-100 transition-colors">
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
  );
};

export default MovieTable;

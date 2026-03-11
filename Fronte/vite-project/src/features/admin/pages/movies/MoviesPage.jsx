import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/movies/FilterBar';
import MovieTable from '../../components/movies/MovieTable';

const mockMovies = [
  {
    id: 1,
    title: 'Đêm Thánh: Đội Săn Quỷ',
    poster: 'https://cdn.galaxycine.vn/media/2024/4/23/dem-thanh-doi-san-quy-1_1713867625841.jpg',
    director: 'Lim Dae-hee',
    cast: 'Don Lee, Seo Hyun, David Lee',
    genre: 'Hành động, Kinh dị',
    ageRating: 'T18',
    releaseDate: '2025-04-25',
    endDate: '2025-05-05',
    versions: ['Phụ Đề', 'Thuyết Minh', 'Lồng Tiếng'],
    trailerCode: 'RWZ5psmKxDk',
    status: 'PUBLISHED',
    isActive: true,
    isHot: true
  },
  {
    id: 2,
    title: 'Panor: Tà Thuật Huyết Ngải',
    poster: 'https://cdn.galaxycine.vn/media/2024/4/11/ta-thuat-huyet-ngai-1_1712809620779.jpg',
    director: 'Putipong Saisikaew',
    cast: 'Cherprang Areekul, Jackrin Kungwankiatichai',
    genre: 'Kinh dị, Giật gân',
    ageRating: 'T16',
    releaseDate: '2025-04-11',
    endDate: '2025-05-10',
    versions: ['Phụ Đề'],
    trailerCode: 'xyz123abc',
    status: 'DRAFT',
    isActive: false,
    isHot: false
  }
];

const tabs = [
  { id: 'ALL', label: 'Tất cả', count: 10 },
  { id: 'PUBLISHED', label: 'Đã xuất bản', count: 10 },
  { id: 'DRAFT', label: 'Bản nháp' }
];

const MoviesPage = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCreate = () => {
    navigate('/admin/movies/create');
  };

  const filteredMovies = mockMovies.filter(movie => {
    if (activeTab !== 'ALL' && movie.status !== activeTab) return false;
    if (searchQuery && !movie.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full bg-admin-bg p-6">
      <div className="flex items-center justify-between mb-2">
        <PageHeader title="Danh sách Phim" />
        <div className="text-sm font-medium text-gray-500">
          <span className="cursor-pointer hover:text-indigo-600">Quản lý</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 cursor-pointer">Danh sách Phim</span>
        </div>
      </div>

      <FilterBar 
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearch={handleSearch}
        onCreate={handleCreate}
        createText="Tạo phim"
      />

      <MovieTable movies={filteredMovies} />
    </div>
  );
};

export default MoviesPage;

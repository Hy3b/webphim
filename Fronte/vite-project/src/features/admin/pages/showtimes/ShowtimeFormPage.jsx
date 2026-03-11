import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronDown, Wand2, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

const InputField = ({ label, placeholder, type = 'text', icon, value, onChange, readOnly = false }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm transition-shadow outline-none
          ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
      />
      {icon && (
        <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, placeholder, options = [], value, onChange }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange}
        className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow pr-10"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>)}
      </select>
      <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

const mockMovies = [
  { id: 1, name: 'Đêm Thánh: Đội Săn Quỷ', duration: 110 },
  { id: 2, name: 'Địa Đạo: Mặt Trời Trong Bóng Tối', duration: 130 },
  { id: 3, name: 'Kung Fu Panda 4', duration: 94 }
];

const ShowtimeFormPage = () => {
  const navigate = useNavigate();
  const [selectedMovie, setSelectedMovie] = useState('');
  const [movieDuration, setMovieDuration] = useState(0);

  // States for Auto mode
  const [timeStart, setTimeStart] = useState('08:00');
  const [timeEnd, setTimeEnd] = useState('23:30');
  const [cleanTime, setCleanTime] = useState(15);

  // Generated / Existing showtimes
  const [previewShowtimes, setPreviewShowtimes] = useState([]);

  useEffect(() => {
    if (selectedMovie) {
      const movie = mockMovies.find(m => m.id.toString() === selectedMovie);
      if (movie) setMovieDuration(movie.duration);
    } else {
      setMovieDuration(0);
    }
  }, [selectedMovie]);


  const generateAutoShowtimes = () => {
    if (!selectedMovie || movieDuration === 0) return alert('Vui lòng chọn phim trước!');
    
    let generated = [];
    const [startH, startM] = timeStart.split(':').map(Number);
    const [endH, endM] = timeEnd.split(':').map(Number);
    
    let currentTotalMins = startH * 60 + startM;
    const limitTotalMins = endH * 60 + endM;

    let count = 1;
    while (currentTotalMins + movieDuration <= limitTotalMins) {
      const stHours = Math.floor(currentTotalMins / 60) % 24;
      const stMins = currentTotalMins % 60;
      
      const endTotalMins = currentTotalMins + movieDuration;
      const endHours = Math.floor(endTotalMins / 60) % 24;
      const endMins = endTotalMins % 60;

      generated.push({
        id: `temp-${count}`,
        startTime: `${String(stHours).padStart(2, '0')}:${String(stMins).padStart(2, '0')}`,
        endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
        room: 'Phòng 01 (Preview)'
      });

      currentTotalMins = endTotalMins + Number(cleanTime);
      count++;
    }
    setPreviewShowtimes(generated);
  };


  const removeShowtime = (id) => {
    setPreviewShowtimes(previewShowtimes.filter(s => s.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full bg-admin-bg p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="THÊM MỚI SUẤT CHIẾU" />
        <div className="text-sm font-medium text-gray-500">
          <span className="cursor-pointer hover:text-indigo-600">Quản lý rạp</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 cursor-pointer">Thêm suất chiếu</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Cột trái: Form nhập liệu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">Thông tin cơ bản</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <SelectField 
              label="Tên phim" 
              placeholder="--- Chọn phim ---" 
              options={mockMovies} 
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
            />
            <SelectField label="Phiên bản phim" placeholder="--- Phiên bản ---" options={['2D Phụ đề', '2D Lồng tiếng']} value="" onChange={()=>{}}/>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <SelectField label="Phòng chiếu" placeholder="--- Chọn phòng ---" options={['Phòng 01', 'Phòng 02']} value="" onChange={()=>{}}/>
            <InputField label="Ngày chiếu" placeholder="dd/mm/yyyy" type="date" icon={<Calendar size={16} />} />
          </div>


            <div className="bg-indigo-50/50 rounded-lg p-5 border border-indigo-100 space-y-5">
              <div className="flex items-center text-indigo-800 font-semibold mb-2">
                <Wand2 size={18} className="mr-2" />
                Thiết lập tự động sinh suất chiếu
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Thời lượng phim (phút)" value={movieDuration || ''} readOnly placeholder="Tự động lấy" />
                <InputField label="Thời gian dọn phòng (phút)" type="number" value={cleanTime} onChange={(e) => setCleanTime(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Bắt đầu ca làm (Khung giờ)" type="time" icon={<Clock size={16} />} value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                <InputField label="Kết thúc ca làm (Khung giờ)" type="time" icon={<Clock size={16} />} value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
              </div>

              <button 
                onClick={generateAutoShowtimes}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center space-x-2"
              >
                <span>Tính toán & Sinh suất chiếu</span>
              </button>
            </div>
          {/* Action Footer */}
          <div className="flex justify-start space-x-3 pt-4 border-t border-gray-100">
            <button 
              onClick={() => navigate('/admin/showtimes')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={() => navigate('/admin/showtimes')}
              className="px-8 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold transition-colors shadow-sm"
            >
              Lưu toàn bộ suất chiếu
            </button>
          </div>
        </div>

        {/* Cột phải: Preview Suất Chiếu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center">
              Lịch chiếu dự kiến
              <span className="ml-2 bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs">{previewShowtimes.length}</span>
            </h3>
            {previewShowtimes.length > 0 && (
              <button onClick={() => setPreviewShowtimes([])} className="text-xs text-rose-500 font-semibold hover:text-rose-700">
                Xóa hết
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
            {previewShowtimes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-10">
                <Clock size={32} className="opacity-50" />
                <p className="text-sm">Chưa có suất chiếu nào được tạo.</p>
              </div>
            ) : (
              previewShowtimes.map((st, idx) => (
                <div key={st.id} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center group hover:border-indigo-300 transition-colors">
                  <div className="flex space-x-4 items-center">
                    <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-md text-sm border border-indigo-100">
                      {st.startTime}
                    </div>
                    <div className="text-gray-400 text-sm">đến</div>
                    <div className="bg-gray-50 text-gray-600 font-semibold px-3 py-1.5 rounded-md text-sm border border-gray-100">
                      {st.endTime}
                    </div>
                  </div>
                  <button onClick={() => removeShowtime(st.id)} className="text-gray-300 hover:text-rose-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowtimeFormPage;

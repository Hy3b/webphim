import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

// Generates an initial grid of seats: 8 rows (A-H), 13 cols (1-13)
const generateInitialSeats = () => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = Array.from({ length: 13 }, (_, i) => i + 1);
  const seats = {};
  
  rows.forEach(row => {
    cols.forEach(col => {
      seats[`${row}${col}`] = {
        id: `${row}${col}`,
        row,
        col,
        type: 'normal', // normal, vip, double, disabled
      };
    });
  });
  return seats;
};

const SeatIcon = ({ type, className = "" }) => {
  // Simple custom design for seats
  if (type === 'double') {
    return (
      <div className={`w-16 h-8 rounded-t-lg flex flex-col items-center justify-end overflow-hidden ${className}`}>
        <div className="w-full h-full bg-pink-100 border border-pink-300 rounded-t-lg relative">
          <div className="absolute top-1 left-2 right-2 bottom-2 bg-pink-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === 'vip') {
    return (
      <div className={`w-8 h-8 rounded-t-md flex flex-col items-center justify-end overflow-hidden ${className}`}>
        <div className="w-full h-full bg-amber-100 border border-amber-300 rounded-t-md relative">
          <div className="absolute top-1 left-1.5 right-1.5 bottom-1.5 bg-amber-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === 'disabled') {
    return (
      <div className={`w-8 h-8 rounded-t-md flex flex-col items-center justify-end overflow-hidden opacity-30 ${className}`}>
        <div className="w-full h-full bg-gray-200 border border-gray-300 rounded-t-md relative">
          <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-300 rounded"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-red-400 rotate-45"></div>
          </div>
        </div>
      </div>
    );
  }

  // normal
  return (
    <div className={`w-8 h-8 rounded-t-md flex flex-col items-center justify-end overflow-hidden ${className}`}>
      <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-t-md relative">
        <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

const SeatMap = ({ room, onBack }) => {
  const [seats, setSeats] = useState(generateInitialSeats());
  
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = Array.from({ length: 13 }, (_, i) => i + 1);

  const toggleSeatType = (seatId) => {
    setSeats(prev => {
      const seat = prev[seatId];
      let nextType = 'normal';
      if (seat.type === 'normal') nextType = 'vip';
      else if (seat.type === 'vip') nextType = 'double';
      else if (seat.type === 'double') nextType = 'disabled';
      else if (seat.type === 'disabled') nextType = 'normal';

      return {
        ...prev,
        [seatId]: { ...seat, type: nextType }
      };
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header element to mimic the tabs header but specifically for the map */}
      <div className="mb-6 flex items-center space-x-2 text-sm text-gray-500 font-medium">
        <span className="cursor-pointer hover:text-gray-700" onClick={onBack}>Quản lý rạp chiếu</span>
        <span>&gt;</span>
        <span className="text-gray-900">Sơ đồ ghế ({room?.name || 'P101'})</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold uppercase text-gray-800">QUẢN LÝ RẠP CHIẾU - MÔ HÌNH GHẾ</h1>
      </div>
      
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Area - Seat Map */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-8 flex flex-col items-center overflow-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-8 w-full text-left">Sơ đồ ghế</h2>
          
          {/* Main Map Container */}
          <div className="relative max-w-4xl w-full flex flex-col items-center select-none pt-4">
            
            {/* Screen Curve */}
            <div className="w-full max-w-3xl mb-16 relative flex justify-center">
              <div className="absolute top-0 w-[110%] h-12 border-t-[8px] border-gray-300 rounded-[100%]"></div>
              <div className="mt-4 text-gray-400 font-semibold tracking-[0.3em] uppercase">Màn hình chiếu</div>
            </div>

            {/* Grid */}
            <div className="flex flex-col space-y-4">
              {rows.map(row => (
                <div key={row} className="flex items-center justify-center space-x-3">
                  {cols.map(col => {
                    const seatId = `${row}${col}`;
                    const seat = seats[seatId];
                    return (
                      <div 
                        key={col} 
                        className="relative cursor-pointer hover:-translate-y-1 transition-transform"
                        onClick={() => toggleSeatType(seatId)}
                        title={`Seat ${seatId} - Type: ${seat.type}`}
                      >
                        <SeatIcon type={seat.type} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 z-10 pointer-events-none">
                          {seatId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-12 text-sm text-gray-400 italic">
              * Click vào các ghế để thay đổi loại (Thường → VIP → Đôi → Bảo trì)
            </div>
          </div>
        </div>

        {/* Right Area - Sidebar Tools */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto">
          {/* Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-3">Thông Tin</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">Trạng Thái:</span>
                <span className="text-gray-500">Chưa xuất bản</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Hoạt Động:</span>
                <span className="text-gray-500">Không hoạt động</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded shadow-sm font-semibold transition-colors">
                Lưu Nháp
              </button>
              <button className="w-full py-2.5 px-4 bg-indigo-800 hover:bg-indigo-900 text-white rounded shadow-sm font-semibold transition-colors">
                Xuất Bản
              </button>
            </div>
          </div>

          {/* Legend Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-3">Chú Thích</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ghế Thường:</span>
                <SeatIcon type="normal" />
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ghế VIP:</span>
                <SeatIcon type="vip" />
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ghế Đôi:</span>
                <SeatIcon type="double" />
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Bảo trì:</span>
                <SeatIcon type="disabled" />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SeatMap;

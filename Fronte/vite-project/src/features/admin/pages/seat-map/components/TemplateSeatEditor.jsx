import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Minus, Save, UserPlus, Users, Crown } from 'lucide-react';

const SeatIcon = ({ type, className = "" }) => {
  if (type === 'double') {
    return (
      <div className={`w-16 h-8 rounded-t-lg flex flex-col items-center justify-end overflow-hidden shadow-sm transition-colors ${className}`}>
        <div className="w-full h-full bg-green-100 border border-green-300 rounded-t-lg relative group-hover:bg-green-200">
          <div className="absolute top-1 left-2 right-2 bottom-2 bg-green-200 rounded flex items-center justify-center text-green-700">
            <Users size={14} className="opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'vip') {
    return (
      <div className={`w-8 h-8 rounded-t-md flex flex-col items-center justify-end overflow-hidden shadow-sm transition-colors ${className}`}>
        <div className="w-full h-full bg-indigo-100 border border-indigo-300 rounded-t-md relative group-hover:bg-indigo-200">
          <div className="absolute top-1 left-1.5 right-1.5 bottom-1.5 bg-indigo-200 rounded flex items-center justify-center text-indigo-700">
            <Plus size={12} className="opacity-70" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'disabled') {
    return (
      <div className={`w-8 h-8 rounded-t-md flex flex-col items-center justify-end overflow-hidden opacity-40 ${className}`}>
        <div className="w-full h-full bg-gray-200 border border-gray-300 rounded-t-md relative">
           <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-300 rounded"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-full h-0.5 bg-red-400 rotate-45"></div>
             <div className="w-full h-0.5 bg-red-400 -rotate-45 absolute"></div>
           </div>
        </div>
      </div>
    );
  }

  // normal (Yellow/Orange)
  return (
    <div className={`w-8 h-8 rounded-t-md flex flex-col items-center justify-end overflow-hidden shadow-sm transition-colors ${className}`}>
      <div className="w-full h-full bg-orange-100 border border-orange-300 rounded-t-md relative group-hover:bg-orange-200">
        <div className="absolute top-1 left-1 right-1 bottom-1 bg-orange-200 rounded flex items-center justify-center text-orange-700">
          <Plus size={12} className="opacity-70" />
        </div>
      </div>
    </div>
  );
};

const TemplateSeatEditor = ({ template, onBack }) => {
  const [gridData, setGridData] = useState([]);

  // Generate initial grid
  useEffect(() => {
    // Determine dimensions from template or default to 10x10 loosely
    let cols = 13;
    let normalRowCnt = 5;
    let vipRowCnt = 3;
    let doubleRowCnt = 2;
    
    if (template && template.grid) {
       const gridParts = template.grid.split('x');
       cols = parseInt(gridParts[0]) || 13;
    }
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    let currentLabelIndex = 0;
    const initialRows = [];

    const generateRowSeats = (type, count, rowLabel) => {
      const seats = [];
      const blocks = type === 'double' ? Math.floor(cols / 2) : cols;
      for (let i = 1; i <= blocks; i++) {
        seats.push({ id: `${rowLabel}${i}`, type: type, colIndex: i });
      }
      return seats;
    };

    // Normal Rows
    for (let i = 0; i < normalRowCnt; i++) {
      const label = rowLabels[currentLabelIndex++];
      initialRows.push({ label, seats: generateRowSeats('normal', cols, label) });
    }
    
    // VIP Rows
    for (let i = 0; i < vipRowCnt; i++) {
      const label = rowLabels[currentLabelIndex++];
      initialRows.push({ label, seats: generateRowSeats('vip', cols, label) });
    }

    // Double Rows
    for (let i = 0; i < doubleRowCnt; i++) {
      const label = rowLabels[currentLabelIndex++];
      initialRows.push({ label, seats: generateRowSeats('double', cols, label) });
    }

    setGridData(initialRows);
  }, [template]);

  const toggleSeatType = (rowIndex, seatIndex) => {
    setGridData(prev => {
      const newData = [...prev];
      const seat = newData[rowIndex].seats[seatIndex];
      let nextType = 'normal';
      if (seat.type === 'normal') nextType = 'vip';
      else if (seat.type === 'vip') nextType = 'double';
      else if (seat.type === 'double') nextType = 'disabled';
      else if (seat.type === 'disabled') nextType = 'normal';
      
      newData[rowIndex].seats[seatIndex] = { ...seat, type: nextType };
      return newData;
    });
  };

  const addSeatToRow = (rowIndex) => {
    setGridData(prev => {
      const newData = [...prev];
      const row = newData[rowIndex];
      const lastSeatCol = row.seats.length > 0 ? row.seats[row.seats.length - 1].colIndex : 0;
      // determine dominant type in row
      const firstType = row.seats.length > 0 ? row.seats[0].type : 'normal';
      row.seats.push({ 
        id: `${row.label}${lastSeatCol + 1}`,
        type: firstType,
        colIndex: lastSeatCol + 1
      });
      return newData;
    });
  };

  const removeSeatFromRow = (rowIndex) => {
    setGridData(prev => {
      const newData = [...prev];
      if (newData[rowIndex].seats.length > 0) {
        newData[rowIndex].seats.pop();
      }
      return newData;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      
      {/* Header Area */}
      <div className="mb-2">
         <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium mb-3 px-2">
            <span className="cursor-pointer hover:text-gray-700" onClick={onBack}>Danh sách Mẫu</span>
            <span>&gt;</span>
            <span className="text-gray-900">Chi tiết mẫu ({template?.name || 'Mẫu mới'})</span>
         </div>
         <div className="flex items-center space-x-4 mb-4">
            <button onClick={onBack} className="p-2 bg-white shadow-sm hover:bg-gray-100 rounded-full transition-colors text-gray-600">
               <ChevronLeft size={24} />
            </button>
            <div>
               <h1 className="text-2xl font-bold uppercase text-gray-800 tracking-wide">
                  TRÌNH CHỈNH SỬA SƠ ĐỒ GHẾ
               </h1>
               <p className="text-sm text-gray-500 mt-1">Template: <span className="font-semibold text-teal-600">{template?.name || 'Mẫu 13x13'}</span></p>
            </div>
         </div>
      </div>
      
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Left Area - Seat Map Visualizer */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center overflow-auto relative">
          
          <h2 className="text-lg font-bold text-gray-800 mb-8 w-full text-left uppercase tracking-wide border-b border-gray-100 pb-3">Phác Thảo Sơ Đồ</h2>
          
          <div className="relative min-w-max w-full flex flex-col items-center select-none pt-6 pb-20 px-8">
            
            {/* Screen Curve */}
            <div className="w-full max-w-4xl mb-24 relative flex justify-center">
              <div className="absolute top-0 w-full h-16 border-t-[8px] border-gray-300 rounded-[50%] opacity-80 shadow-sm shadow-gray-200/50"></div>
              <div className="mt-8 text-gray-400 font-bold tracking-[0.4em] uppercase text-sm drop-shadow-sm">Màn hình chiếu</div>
            </div>

            {/* Grid Area */}
            <div className="flex flex-col space-y-5 items-center w-full max-w-5xl">
              {gridData.map((row, rowIndex) => (
                <div key={row.label} className="flex items-center justify-center space-x-4 w-full relative">
                  
                  {/* Row Label Left */}
                  <div className="text-lg font-bold text-gray-400 w-8 text-center bg-gray-50 rounded-md py-1 absolute left-0 md:static">
                    {row.label}
                  </div>

                  {/* Seats */}
                  <div className="flex items-center space-x-3 justify-center flex-1">
                     {row.seats.map((seat, seatIndex) => (
                       <div 
                         key={seat.colIndex} 
                         className="relative cursor-pointer group hover:-translate-y-1 hover:scale-105 transition-all duration-200"
                         onClick={() => toggleSeatType(rowIndex, seatIndex)}
                         title={`Ghế ${seat.id}`}
                       >
                         <SeatIcon type={seat.type} />
                         <span className="absolute inset-x-0 bottom-8 flex justify-center text-[10px] font-bold text-gray-600 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md bg-white/90 rounded px-1 -translate-y-1">
                           {seat.id}
                         </span>
                       </div>
                     ))}
                  </div>

                  {/* Row Label Right & Row actions */}
                  <div className="flex items-center space-x-2 absolute right-0 md:static">
                     <div className="text-lg font-bold text-gray-400 w-8 text-center bg-gray-50 rounded-md py-1 mr-2 hidden md:block">
                        {row.label}
                     </div>
                     <button 
                        onClick={() => removeSeatFromRow(rowIndex)}
                        disabled={row.seats.length === 0}
                        className="p-1.5 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors shadow-sm disabled:opacity-50"
                        title="Bớt ghế"
                     >
                        <Minus size={16} strokeWidth={3} />
                     </button>
                     <button 
                        onClick={() => addSeatToRow(rowIndex)}
                        className="p-1.5 bg-teal-100 text-teal-600 rounded-md hover:bg-teal-200 transition-colors shadow-sm"
                        title="Thêm ghế"
                     >
                        <Plus size={16} strokeWidth={3} />
                     </button>
                  </div>

                </div>
              ))}
            </div>

            <div className="mt-16 text-sm text-gray-400 bg-gray-50 py-2 px-6 rounded-full inline-block font-medium border border-gray-100 shadow-sm">
              ✨ Click vào ghế để thay đổi loại (Thường → VIP → Đôi → Bỏ trống) | Dùng (+)/(-) cuỗi hàng để thay đổi số lượng
            </div>
          </div>
        </div>

        {/* Right Area - Sidebar Settings */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto">
          
          {/* Action Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center space-x-2">
               <Save size={20} className="text-teal-600" />
               <span>Cập Nhật Mẫu</span>
            </h3>
            
            <div className="space-y-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                <span className="font-semibold text-gray-700">Trạng Thái:</span>
                <span className="text-teal-600 font-bold text-xs uppercase bg-teal-50 px-2 py-1 rounded">Chưa xuất bản</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-gray-700">Tổng ghế (thực tế):</span>
                <span className="text-gray-900 font-bold text-lg">{gridData.reduce((acc, r) => acc + r.seats.length, 0)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                <Save size={16} />
                <span>Lưu Nháp</span>
              </button>
              <button className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md hover:shadow-lg font-semibold transition-all flex items-center justify-center space-x-2">
                <Crown size={18} />
                <span>Lưu & Xuất Bản</span>
              </button>
            </div>
          </div>

          {/* Legend Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3">Chú Thích Màu Sắc</h3>
            <div className="space-y-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between group">
                <span className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                   <span>Ghế Thường</span>
                </span>
                <SeatIcon type="normal" />
              </div>
               <div className="flex items-center justify-between group">
                <span className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                   <span>Ghế VIP</span>
                </span>
                <SeatIcon type="vip" />
              </div>
               <div className="flex items-center justify-between group">
                <span className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   <span>Ghế Đôi</span>
                </span>
                <SeatIcon type="double" />
              </div>
               <div className="flex items-center justify-between group opacity-60">
                <span className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                   <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                   <span>Bỏ trống / Bảo trì</span>
                </span>
                <SeatIcon type="disabled" />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TemplateSeatEditor;

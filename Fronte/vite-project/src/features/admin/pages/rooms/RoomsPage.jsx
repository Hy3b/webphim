import React, { useState } from 'react';
import RoomList from './components/RoomList';
import SeatMap from './components/SeatMap';
import RoomForm from './components/RoomForm';

const RoomsPage = () => {
  // viewState can be 'list', 'seatMap', or 'form'
  const [viewState, setViewState] = useState('list');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleViewSeatMap = (room) => {
    setSelectedRoom(room);
    setViewState('seatMap');
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setViewState('form');
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setViewState('form');
  };

  const handleBackToList = () => {
    setSelectedRoom(null);
    setViewState('list');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {(viewState === 'list' || viewState === 'form') && (
        <RoomList 
          onViewSeatMap={handleViewSeatMap}
          onAddRoom={handleAddRoom}
          onEditRoom={handleEditRoom}
        />
      )}
      {viewState === 'seatMap' && (
        <SeatMap room={selectedRoom} onBack={handleBackToList} />
      )}
      {viewState === 'form' && (
        <RoomForm room={selectedRoom} onBack={handleBackToList} />
      )}
    </div>
  );
};

export default RoomsPage;

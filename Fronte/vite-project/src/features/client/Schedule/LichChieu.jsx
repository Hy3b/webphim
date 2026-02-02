import React, { useState } from 'react';
import './LichChieu.css';
import DateSelector from './components/DateSelector';
import NoteSection from './components/NoteSection';
import MovieItem from './components/MovieItem';

const LichChieu = () => {
    const [activeTab, setActiveTab] = useState('tab-id-1');

    const days = [
        { id: 'tab-id-1', dayNumber: 'DD', monthYear: '/MM - Day' },
        { id: 'tab-id-2', dayNumber: 'DD', monthYear: '/MM - Day' },
    ];

    // Mock data structure replicating the original placeholders
    // In a real app, this would be fetched from an API
    const movies = [
        {
            id: 1,
            title: '[Tên Phim]',
            imageUrl: '[Hinh_Anh_Phim_Url]',
            ratingUrl: '[Icon_Rating_Url]',
            link: '[Link_Chi_Tiet]',
            genre: '[Thể loại]',
            duration: '[Thời lượng]',
            type: '[Loại Chiếu (2D/3D)]',
            showtimes: [
                { time: '[HH:MM]', date: '[DD/MM]', seats: '[Số ghế trống]' }
            ]
        },
        {
            id: 2,
            title: '[Tên Phim]',
            imageUrl: '[Hinh_Anh_Phim_Url]',
            ratingUrl: '[Icon_Rating_Url]',
            link: '[Link_Chi_Tiet]',
            genre: '[Thể loại]',
            duration: '[Thời lượng]',
            type: '[Loại Chiếu]',
            showtimes: [
                { time: '[HH:MM]', date: '[DD/MM]', seats: '[Số ghế trống]' }
            ]
        }
    ];

    return (
        <div className="container">
            <div className="tab-style-1 margin-bottom-35">
                <DateSelector
                    days={days}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="tab-content" id="tab-content">
                    {days.map((day) => (
                        <div
                            key={day.id}
                            className={`tab-pane fade ${activeTab === day.id ? 'in active' : ''}`}
                            id={day.id}
                        >
                            <div className="content-page">
                                <NoteSection />
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
                                    {movies.map((movie) => (
                                        <MovieItem key={movie.id} movie={movie} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LichChieu;

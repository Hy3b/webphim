import React, { useState, useEffect } from 'react';
import './LichChieu.css';
import DateSelector from './components/DateSelector/DateSelector';
import NoteSection from './components/NoteSection/NoteSection';
import MovieItem from './components/MovieItem/MovieItem';
import { scheduleData } from './data/fakeData';

const LichChieu = () => {
    // Default to the first day in the schedule
    const [activeTab, setActiveTab] = useState(scheduleData[0]?.day.id || 'tab-id-1');
    const [realMovies, setRealMovies] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8080/api/movies')
            .then(res => res.json())
            .then(data => {
                setRealMovies(data.filter(m => m.status === 'showing'));
            })
            .catch(err => console.error("Lỗi khi tải phim: ", err));
    }, []);

    // Extract days for the selector
    const days = scheduleData.map(item => item.day);

    return (
        <div className="schedule-page-wrapper">
            <div className="schedule-container">
                <DateSelector
                    days={days}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="schedule-content">
                    {scheduleData.map((item) => (
                        <div
                            key={item.day.id}
                            className={`schedule-tab-pane ${activeTab === item.day.id ? 'active' : ''}`}
                        >
                            <NoteSection />
                            <div className="movies-list">
                                {realMovies.length > 0 ? (
                                    realMovies.map((movie) => {
                                        // Fake showtimes since we don't have schedule API yet
                                        const fakeShowtimes = [
                                            { time: '18:00', seats: 85 },
                                            { time: '20:15', seats: 120 }
                                        ];
                                        return <MovieItem key={movie.id} movie={{...movie, showtimes: fakeShowtimes, type: '2D PHỤ ĐỀ'}} />;
                                    })
                                ) : (
                                    <div className="empty-state">Đang tải lịch chiếu...</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LichChieu;


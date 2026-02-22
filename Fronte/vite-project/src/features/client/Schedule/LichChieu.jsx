import React, { useState } from 'react';
import './LichChieu.css';
import DateSelector from './components/DateSelector';
import NoteSection from './components/NoteSection';
import MovieItem from './components/MovieItem';
import { scheduleData } from './data/fakeData';

const LichChieu = () => {
    // Default to the first day in the schedule
    const [activeTab, setActiveTab] = useState(scheduleData[0]?.day.id || 'tab-id-1');

    // Extract days for the selector
    const days = scheduleData.map(item => item.day);

    return (
        <div className="container">
            <div className="tab-style-1 margin-bottom-35">
                <DateSelector
                    days={days}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="tab-content" id="tab-content">
                    {scheduleData.map((item) => (
                        <div
                            key={item.day.id}
                            className={`tab-pane fade ${activeTab === item.day.id ? 'in active' : ''}`}
                            id={item.day.id}
                        >
                            <div className="content-page">
                                <NoteSection />
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
                                    {item.movies && item.movies.length > 0 ? (
                                        item.movies.map((movie) => (
                                            <MovieItem key={movie.id} movie={movie} />
                                        ))
                                    ) : (
                                        <div className="text-center padding-20">Không có suất chiếu nào.</div>
                                    )}
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


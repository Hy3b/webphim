import React from 'react';

const DateSelector = ({ days, activeTab, onTabChange }) => {
    return (
        <ul className="nav nav-tabs dayofweek" style={{ marginBottom: '10px', marginLeft: '1%', marginRight: '1%' }}>
            {days.map((day) => (
                <li key={day.id} className={activeTab === day.id ? 'in active' : ''}>
                    <a
                        href={`#${day.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            onTabChange(day.id);
                        }}
                        data-toggle="tab"
                        className="dayofweek"
                    >
                        {/* Assuming date format split if needed, or just pass formatted info */}
                        <span className="font-38 font-s-35">{day.dayNumber}</span>{day.monthYear}
                    </a>
                </li>
            ))}
        </ul>
    );
};

export default DateSelector;

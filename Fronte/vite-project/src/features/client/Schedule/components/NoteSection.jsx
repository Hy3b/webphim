import React from 'react';

const NoteSection = () => {
    return (
        <div style={{ fontFamily: 'Montserrat-Medium', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <div style={{ display: 'inline-block', width: '25px', height: '15px', backgroundColor: '#B3C9E9' }}></div>
                [Ghi chú/Thông báo]
            </div>
            {/* Add more items if needed */}
        </div>
    );
};

export default NoteSection;

import React, { useState } from 'react';
import './LichChieu.css';

const LichChieu = () => {
    const [activeTab, setActiveTab] = useState('tab-id-1');

    return (
        <div className="container">
            <div className="tab-style-1 margin-bottom-35">
                <ul className="nav nav-tabs dayofweek" style={{ marginBottom: '10px', marginLeft: '1%', marginRight: '1%' }}>
                    <li className={activeTab === 'tab-id-1' ? 'in active' : ''}>
                        <a
                            href="#tab-id-1"
                            name="firtTimeInSchedule"
                            onClick={(e) => { e.preventDefault(); setActiveTab('tab-id-1'); }}
                            data-toggle="tab"
                            className="dayofweek"
                            id="day-id-1"
                        >
                            <span className="font-38 font-s-35">DD</span>/MM - Day
                        </a>
                    </li>
                    <li className={activeTab === 'tab-id-2' ? 'in active' : ''}>
                        <a
                            href="#tab-id-2"
                            onClick={(e) => { e.preventDefault(); setActiveTab('tab-id-2'); }}
                            data-toggle="tab"
                            className="dayofweek"
                            id="day-id-2"
                        >
                            <span className="font-38 font-s-35">DD</span>/MM - Day
                        </a>
                    </li>
                </ul>

                <div className="tab-content" id="tab-content">
                    {/* Tab 1 Content */}
                    <div className={`tab-pane fade ${activeTab === 'tab-id-1' ? 'in active' : ''}`} id="tab-id-1">
                        <div className="content-page">
                            <div style={{ fontFamily: 'Montserrat-Medium', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                                    <div style={{ display: 'inline-block', width: '25px', height: '15px', backgroundColor: '#B3C9E9' }}></div>
                                    [Ghi chú/Thông báo]
                                </div>
                            </div>

                            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
                                {/* Movie Item 1 */}
                                <div className="row margin-left-0 margin-right-0 margin-bottom-40">
                                    <div className="col-lg-5 col-md-5 col-sm-5 col-xs-6">
                                        <div className="product-item padding-xs margin-xs padding-sm margin-sm">
                                            <div className="pi-img-wrapper">
                                                <span style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                                    <img src="[Icon_Rating_Url]" className="img-responsive" alt="rating" />
                                                </span>
                                                <img className="img-responsive border-radius-20" alt="[Ten_Phim]" src="[Hinh_Anh_Phim_Url]" />
                                                <div className="border-radius-20">
                                                    <a href="#trailer-pop-up" className="fancybox-fast-view">
                                                        <i className="fa fa-play-circle"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-11 col-md-11 col-sm-11 col-xs-10">
                                        <div className="row">
                                            <h1 className="no-margin no-padding">
                                                <a href="[Link_Chi_Tiet]">[Tên Phim]</a>
                                            </h1>
                                            <ul className="blog-info">
                                                <li><i className="fa fa-tags"></i>[Thể loại]</li>
                                                <li><i className="fa fa-clock-o"></i>[Thời lượng] phút</li>
                                            </ul>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-16 col-sm-16 col-xs-16" style={{ marginBottom: '10px', marginTop: '10px', paddingLeft: 'unset' }}>
                                                <span className="font-lg bold font-transform-uppercase">[Loại Chiếu (2D/3D)]</span>
                                            </div>
                                            <div style={{ paddingLeft: 'unset' }} className="col-lg-2 col-md-5 col-sm-5 col-xs-7 margin-xs-bottom-10 text-center">
                                                <a style={{ width: '100%', minHeight: '43px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }} href="#product-pop-up" className="btn default show-in fancybox-fast-view">
                                                    <div style={{ fontSize: '13px' }}>[HH:MM]</div>
                                                    <small style={{ fontSize: '10px', display: 'none', fontFamily: 'Montserrat-Medium' }}>[DD/MM]</small>
                                                </a>
                                                <div className="font-smaller padding-top-3 padding-bottom-10">[Số ghế trống] ghế trống</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Movie Item 2 / List */}
                                <div className="row margin-left-0 margin-right-0 padding-xs">
                                    <div className="col-md-8 col-sm-16 col-b col-b-xs col-b-sm padding-xs-left padding-xs-right padding-sm-left padding-sm-right">
                                        <div className="col-lg-8 col-md-8 col-sm-5 col-xs-6">
                                            <div className="product-item no-padding">
                                                <div className="pi-img-wrapper">
                                                    <span style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                                        <img src="[Icon_Rating_Url]" className="img-responsive" alt="rating" />
                                                    </span>
                                                    <img className="img-responsive border-radius-20" alt="" src="[Hinh_Anh_Phim_Url]" />
                                                    <div className="border-radius-20">
                                                        <a href="#trailer-pop-up" className="fancybox-fast-view">
                                                            <i className="fa fa-play-circle"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-8 col-md-8 col-sm-11 col-xs-10">
                                            <div className="row">
                                                <h3>
                                                    <a style={{ color: '#005198' }} href="[Link_Chi_Tiet]">[Tên Phim]</a>
                                                </h3>
                                                <ul className="blog-info">
                                                    <li><i className="fa fa-tags"></i>[Thể loại]</li>
                                                    <li><i className="fa fa-clock-o"></i>[Thời lượng] phút</li>
                                                </ul>
                                                <div className="col-md-16 col-sm-16 col-xs-16" style={{ marginBottom: '10px', marginTop: '10px', paddingLeft: 'unset' }}>
                                                    <span className="font-lg bold font-transform-uppercase">[Loại Chiếu]</span>
                                                </div>
                                                <div style={{ paddingLeft: 'unset' }} className="col-lg-5 col-md-7 col-sm-5 col-xs-7 margin-xs-bottom-10 text-center">
                                                    <a style={{ width: '100%', minHeight: '43px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }} href="#product-pop-up" className="btn default show-in fancybox-fast-view">
                                                        <div style={{ fontSize: '13px' }}>[HH:MM]</div>
                                                        <small style={{ fontSize: '10px', display: 'none', fontFamily: 'Montserrat-Medium' }}>[DD/MM]</small>
                                                    </a>
                                                    <div className="font-smaller padding-top-3 padding-bottom-10">[Số ghế trống] ghế trống</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LichChieu;

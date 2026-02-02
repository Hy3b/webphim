import React from 'react';

const MovieItem = ({ movie }) => {
    const { title, imageUrl, ratingUrl, genre, duration, type, showtimes, link } = movie;

    return (
        <div className="row margin-left-0 margin-right-0 margin-bottom-40">
            <div className="col-lg-5 col-md-5 col-sm-5 col-xs-6">
                <div className="product-item padding-xs margin-xs padding-sm margin-sm">
                    <div className="pi-img-wrapper">
                        <span style={{ position: 'absolute', top: '10px', left: '10px' }}>
                            <img src={ratingUrl} className="img-responsive" alt="rating" />
                        </span>
                        <img className="img-responsive border-radius-20" alt={title} src={imageUrl} />
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
                        <a href={link || "#"}>{title}</a>
                    </h1>
                    <ul className="blog-info">
                        <li><i className="fa fa-tags"></i>{genre}</li>
                        <li><i className="fa fa-clock-o"></i>{duration} phút</li>
                    </ul>
                </div>
                <div className="row">
                    <div className="col-md-16 col-sm-16 col-xs-16" style={{ marginBottom: '10px', marginTop: '10px', paddingLeft: 'unset' }}>
                        <span className="font-lg bold font-transform-uppercase">{type}</span>
                    </div>
                    {/* Render Showtimes */}
                    {showtimes && showtimes.map((item, index) => (
                        <div key={index} style={{ paddingLeft: 'unset' }} className="col-lg-2 col-md-5 col-sm-5 col-xs-7 margin-xs-bottom-10 text-center">
                            <a style={{ width: '100%', minHeight: '43px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }} href="#product-pop-up" className="btn default show-in fancybox-fast-view">
                                <div style={{ fontSize: '13px' }}>{item.time}</div>
                                <small style={{ fontSize: '10px', display: 'none', fontFamily: 'Montserrat-Medium' }}>{item.date}</small>
                            </a>
                            <div className="font-smaller padding-top-3 padding-bottom-10">{item.seats} ghế trống</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieItem;

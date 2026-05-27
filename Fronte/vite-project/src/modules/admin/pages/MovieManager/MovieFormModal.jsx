import React, { useState, useEffect } from 'react';
import { X, Save, Film, Search, DownloadCloud } from 'lucide-react';
import { tmdbService } from '../../../../services/tmdbService';
import './MovieFormModal.css';

const EMPTY_FORM = {
    title: '', description: '', duration: '', poster: '', banner: '',
    genre: 'Chưa cập nhật', releaseDate: 'Chưa cập nhật',
    director: '', castMembers: '', ageRating: 'P', status: 'showing',
};

const AGE_RATINGS = ['P', 'C13', 'C16', 'C18'];
const GENRES = ['Hành động', 'Hài', 'Lãng mạn', 'Kinh dị', 'Hoạt hình', 'Khoa học viễn tưởng', 'Tâm lý', 'Chưa cập nhật'];

const MovieFormModal = ({ mode, movie, onSave, onClose }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // TMDB Search State
    const [showTmdbSearch, setShowTmdbSearch] = useState(false);
    const [tmdbQuery, setTmdbQuery] = useState('');
    const [tmdbResults, setTmdbResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && movie) {
            setForm({
                title: movie.title || '',
                description: movie.description || '',
                duration: movie.duration || '',
                poster: movie.poster || '',
                banner: movie.banner || '',
                genre: movie.genre || 'Chưa cập nhật',
                releaseDate: movie.releaseDate || 'Chưa cập nhật',
                director: movie.director || '',
                castMembers: movie.castMembers || '',
                ageRating: movie.ageRating || 'P',
                status: movie.status || 'showing',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [mode, movie]);

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Tên phim không được để trống.';
        if (form.duration && (isNaN(form.duration) || +form.duration < 1 || +form.duration > 500))
            e.duration = 'Thời lượng phải từ 1 đến 500 phút.';
        return e;
    };

    const handleChange = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        await onSave(
            { ...form, duration: form.duration ? +form.duration : null },
            mode === 'edit',
            movie?.id
        );
        setSaving(false);
    };

    const handleSearchTmdb = async () => {
        if (!tmdbQuery.trim()) return;
        setIsSearching(true);
        try {
            // Support searching by ID directly if query is a number
            if (/^\d+$/.test(tmdbQuery.trim())) {
                const movie = await tmdbService.getMovieById(tmdbQuery.trim());
                setTmdbResults([movie]);
            } else {
                const results = await tmdbService.searchMovies(tmdbQuery);
                setTmdbResults(results);
            }
        } catch (error) {
            alert('Lỗi tìm kiếm TMDB. Vui lòng kiểm tra API Key.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectTmdbMovie = async (tmdbId) => {
        setIsSearching(true);
        try {
            const movieDetails = await tmdbService.getMovieById(tmdbId);
            
            const director = movieDetails.credits?.crew?.find(c => c.job === 'Director')?.name || '';
            const cast = movieDetails.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '';
            const genresStr = movieDetails.genres?.map(g => g.name).join(', ') || '';
            const mappedGenre = GENRES.find(g => genresStr.includes(g)) || 'Chưa cập nhật';
            
            setForm(f => ({
                ...f,
                title: movieDetails.title || movieDetails.original_title || '',
                description: movieDetails.overview || '',
                duration: movieDetails.runtime ? String(movieDetails.runtime) : '',
                releaseDate: movieDetails.release_date || '',
                poster: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : '',
                banner: movieDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}` : '',
                director: director,
                castMembers: cast,
                genre: mappedGenre
            }));
            
            setShowTmdbSearch(false);
            setTmdbResults([]);
            setTmdbQuery('');
        } catch (error) {
            alert('Lỗi khi lấy chi tiết phim.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="mfm-overlay" onClick={onClose}>
            <div className="mfm-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="mfm-header">
                    <div className="mfm-header-left">
                        <Film size={18} className="mfm-icon" />
                        <h2>{mode === 'edit' ? 'Chỉnh Sửa Phim' : 'Thêm Phim Mới'}</h2>
                        <button 
                            type="button" 
                            className="mfm-tmdb-btn"
                            onClick={() => setShowTmdbSearch(!showTmdbSearch)}
                        >
                            <DownloadCloud size={16} /> Nhập từ TMDB
                        </button>
                    </div>
                    <button className="mfm-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* TMDB Search Panel */}
                {showTmdbSearch && (
                    <div className="mfm-tmdb-panel">
                        <div className="tmdb-search-bar">
                            <input 
                                type="text" 
                                placeholder="Nhập tên phim hoặc ID TMDB..." 
                                value={tmdbQuery}
                                onChange={e => setTmdbQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchTmdb())}
                            />
                            <button type="button" onClick={handleSearchTmdb} disabled={isSearching}>
                                {isSearching ? 'Đang tìm...' : <Search size={16} />}
                            </button>
                        </div>
                        
                        {tmdbResults.length > 0 && (
                            <div className="tmdb-results">
                                {tmdbResults.map(m => (
                                    <div key={m.id} className="tmdb-result-item" onClick={() => handleSelectTmdbMovie(m.id)}>
                                        {m.poster_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title} />
                                        ) : (
                                            <div className="tmdb-no-image">Không ảnh</div>
                                        )}
                                        <div className="tmdb-result-info">
                                            <h4>{m.title}</h4>
                                            <p>{m.release_date ? m.release_date.substring(0, 4) : 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Form */}
                <form className="mfm-form" onSubmit={handleSubmit}>
                    <div className="mfm-grid-2">
                        {/* Title */}
                        <div className="mfm-field mfm-col-2">
                            <label>Tên phim <span className="mfm-req">*</span></label>
                            <input
                                value={form.title}
                                onChange={e => handleChange('title', e.target.value)}
                                placeholder="Nhập tên phim..."
                                className={errors.title ? 'err' : ''}
                            />
                            {errors.title && <span className="mfm-err">{errors.title}</span>}
                        </div>

                        {/* Duration */}
                        <div className="mfm-field">
                            <label>Thời lượng (phút)</label>
                            <input
                                type="number"
                                value={form.duration}
                                onChange={e => handleChange('duration', e.target.value)}
                                placeholder="90"
                                min="1" max="500"
                                className={errors.duration ? 'err' : ''}
                            />
                            {errors.duration && <span className="mfm-err">{errors.duration}</span>}
                        </div>

                        {/* Status */}
                        <div className="mfm-field">
                            <label>Trạng thái</label>
                            <select value={form.status} onChange={e => handleChange('status', e.target.value)}>
                                <option value="showing">Đang chiếu</option>
                                <option value="coming">Sắp chiếu</option>
                            </select>
                        </div>

                        {/* Genre */}
                        <div className="mfm-field">
                            <label>Thể loại</label>
                            <select value={form.genre} onChange={e => handleChange('genre', e.target.value)}>
                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        {/* Age Rating */}
                        <div className="mfm-field">
                            <label>Giới hạn tuổi</label>
                            <select value={form.ageRating} onChange={e => handleChange('ageRating', e.target.value)}>
                                {AGE_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Release Date */}
                        <div className="mfm-field">
                            <label>Ngày khởi chiếu</label>
                            <input
                                value={form.releaseDate}
                                onChange={e => handleChange('releaseDate', e.target.value)}
                                placeholder="2026-04-17"
                            />
                        </div>

                        {/* Director */}
                        <div className="mfm-field">
                            <label>Đạo diễn</label>
                            <input
                                value={form.director}
                                onChange={e => handleChange('director', e.target.value)}
                                placeholder="Tên đạo diễn..."
                            />
                        </div>

                        {/* Cast */}
                        <div className="mfm-field mfm-col-2">
                            <label>Diễn viên</label>
                            <input
                                value={form.castMembers}
                                onChange={e => handleChange('castMembers', e.target.value)}
                                placeholder="Ngăn cách bằng dấu phẩy..."
                            />
                        </div>

                        {/* Poster URL */}
                        <div className="mfm-field mfm-col-2">
                            <label>URL Poster</label>
                            <input
                                value={form.poster}
                                onChange={e => handleChange('poster', e.target.value)}
                                placeholder="https://..."
                            />
                            {form.poster && (
                                <img src={form.poster} alt="preview" className="mfm-poster-preview" />
                            )}
                        </div>

                        {/* Banner URL */}
                        <div className="mfm-field mfm-col-2">
                            <label>URL Banner</label>
                            <input
                                value={form.banner}
                                onChange={e => handleChange('banner', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Description */}
                        <div className="mfm-field mfm-col-2">
                            <label>Mô tả</label>
                            <textarea
                                value={form.description}
                                onChange={e => handleChange('description', e.target.value)}
                                rows={4}
                                placeholder="Nội dung phim..."
                            />
                        </div>
                    </div>

                    <div className="mfm-footer">
                        <button type="button" className="mfm-btn-ghost" onClick={onClose}>Huỷ</button>
                        <button type="submit" className="mfm-btn-save" disabled={saving}>
                            <Save size={15} />
                            {saving ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật' : 'Thêm phim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MovieFormModal;

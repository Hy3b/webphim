import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdbApi = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
        api_key: TMDB_API_KEY,
        language: 'vi-VN',
    },
});

export const tmdbService = {
    searchMovies: async (query) => {
        try {
            const response = await tmdbApi.get('/search/movie', {
                params: {
                    query,
                    include_adult: false,
                },
            });
            return response.data.results;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm phim từ TMDB:', error);
            throw error;
        }
    },

    getMovieById: async (id) => {
        try {
            const response = await tmdbApi.get(`/movie/${id}`, {
                params: {
                    append_to_response: 'credits,release_dates',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết phim từ TMDB:', error);
            throw error;
        }
    },
};

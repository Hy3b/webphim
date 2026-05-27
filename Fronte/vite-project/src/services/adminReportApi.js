import api from './api';

export const adminReportApi = {
    getOverview: async (from, to) => {
        let url = '/admin/reports/overview';
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        const response = await api.get(url);
        return response.data;
    }
};

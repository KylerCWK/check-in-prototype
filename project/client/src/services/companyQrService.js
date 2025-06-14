import api from '../api';

export default {
    async getQRSettings() {
        try {
            const response = await api.get('/api/companies/qr/qr-settings');
            return response.data;
        } catch (error) {
            console.error('Error fetching QR settings:', error);
            throw error;
        }
    },

    async updateQRSettings(settings) {
        try {
            const formData = new FormData();
            if (settings.logo) {
                formData.append('logo', settings.logo);
            }
            if (settings.primaryColor) {
                formData.append('primaryColor', settings.primaryColor);
            }
            if (settings.secondaryColor) {
                formData.append('secondaryColor', settings.secondaryColor);
            }
            if (settings.template) {
                formData.append('template', settings.template);
            }

            const response = await api.post('/api/companies/qr/qr-settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating QR settings:', error);
            throw error;
        }
    },

    async generateQRCode(bookId, options = {}) {
        try {
            const formData = new FormData();
            formData.append('bookId', bookId);
            
            if (options.template) {
                formData.append('template', options.template);
            }
            if (options.primaryColor) {
                formData.append('primaryColor', options.primaryColor);
            }
            if (options.secondaryColor) {
                formData.append('secondaryColor', options.secondaryColor);
            }
            if (options.logo) {
                formData.append('logo', options.logo);
            }

            const response = await api.post('/api/companies/qr/qr-code', formData, {
                responseType: 'blob'
            });
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          sidebar: '#3F51B5', // Màu xanh đậm
          bg: '#F4F7FE',      // Xám nhạt ngả xanh
          text: '#2D3748',
          textMuted: '#718096',
          success: '#48BB78',
          danger: '#F56565'
        }
      }
    },
  },
  plugins: [],
}

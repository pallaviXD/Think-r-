/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        orange: {
          DEFAULT: '#FF6B00',
          hover: '#E85D04',
          soft: '#FFE8D6',
          500: '#FF6B00',
          600: '#E85D04',
        },
      },
      borderRadius: {
        card: '20px',
        btn: '12px',
      },
    },
  },
  plugins: [],
}

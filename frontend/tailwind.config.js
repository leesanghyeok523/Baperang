/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Paperlogy', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        semibold: '600',
      },
      backgroundImage: {
        login: "url('/images/background/background_login.png')",
        main: "url('/images/background/background_main.png')",
        mypage: "url('/images/background/background_mypage.png')",
        join: "url('/images/background/background_join.png')",
        logo: "url('/images/logo/logo.png')",
      },
    },
  },
  plugins: [],
};

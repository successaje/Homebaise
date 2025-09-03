/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}" // Include all files in src
  ],
  theme: {
    extend: {
      colors: {
        'hedera-green': '#24c782',
        'hedera-green-dark': '#1a8a5c',
        'hedera-blue': '#1a1b2d',
        'hedera-blue-light': '#2a2b3d',
        'hedera-accent': '#5e5ce6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'hedera-gradient': 'linear-gradient(90deg, #24c782, #5e5ce6)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
}

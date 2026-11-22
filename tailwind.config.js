/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        sage: {
          50: '#f0faf4',
          100: '#c6f6d5',
          200: '#9ae6b4',
          300: '#68d391',
          400: '#48bb78',
          500: '#38a169',
          600: '#2f855a',
          700: '#276749',
          800: '#22543d',
          900: '#1c4532',
        },
        // TaxClarity × Japandi / Brownefield Woodworks palette
        tc: {
          cream: '#F4EEE3', // page background
          paper: '#FBF8F1', // card surface
          ink: '#2A241D', // text + card borders
          muted: '#6B5F52', // secondary text
          line: '#D9CFBF', // hairlines
          honey: '#B07F35', // primary accent (TaxClarity gold, toned to oak)
          honeysoft: '#F1E4CC',
          sage: '#76866A', // accent bar — live / ready
          clay: '#B4694A', // accent bar — attention
          slate: '#5D6B78', // accent bar — info
        },
        warm: {
          50: '#fffaf0',
          100: '#feebc8',
          200: '#fbd38d',
          300: '#f6ad55',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

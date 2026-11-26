/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        sidebarBg: '#F3F4F4',
        cardSubtle: '#FAFAFA',
        searchBg: '#F5F6F8',
        borderHairline: '#E5E7EB',
        borderSoft: '#EBECEF',
        inkPrimary: '#111315',
        inkCharcoal: '#18181B',
        inkBody: '#374151',
        inkMuted: '#6B7280',
        inkFaint: '#9CA3AF',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-dark': '#0a0e27',
                'cyber-blue': '#00d4ff',
                'cyber-purple': '#7b2cbf',
                'cyber-pink': '#ff006e',
            },
            fontFamily: {
                'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
            },
            boxShadow: {
                'glow-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
                'glow-purple': '0 0 20px rgba(123, 44, 191, 0.5)',
            },
        },
    },
    plugins: [],
}

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        token: {
          1: '#FFE6E6',
          2: '#E6F3FF',
          3: '#FFF9E6',
          4: '#E6FFE6',
          5: '#F3E6FF',
          6: '#FFE6F3',
        },
      },
    },
  },
  plugins: [],
}
export default config

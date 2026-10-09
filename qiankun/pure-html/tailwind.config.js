/** Tailwind CSS v3 传统配置（JIT 模式） */
module.exports = {
  // 扫描 index.html 与所有 TS 源码（类名写在 TS 模板字符串里）
  content: ['./index.html', './src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        // 品牌主色：清爽蓝，避免大面积的 indigo/purple
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a8ff',
          500: '#3388fb',
          600: '#1d68f0',
          700: '#1653dd',
          800: '#1944b3',
          900: '#1a3d8d',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(16 24 40 / 0.06), 0 1px 2px -1px rgb(16 24 40 / 0.06)',
        'card-hover': '0 8px 24px -6px rgb(16 24 40 / 0.14)',
      },
    },
  },
  plugins: [],
};

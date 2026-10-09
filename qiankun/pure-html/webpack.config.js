/**
 * pure-html 子应用 webpack 配置
 *
 * 要点：
 * 1. output.publicPath = 'auto'：产物中的资源引用使用相对路径，
 *    同时运行时在 src/index.ts 里根据 qiankun 注入的
 *    __INJECTED_PUBLIC_PATH_BY_QIANKUN__ 动态覆盖 __webpack_public_path__，
 *    保证被 qiankun 以 HTML entry 方式加载时资源（尤其懒加载 chunk）路径正确。
 * 2. css-loader 的 import.filter 用于「保留」legacy-support.css 这条真实的
 *    @import 语句到产物 CSS 中——专门用来测试 qiankun 加载子应用 CSS 时
 *    对 @import 的处理（qiankun 官方文档提示子应用中应尽量避免 @import）。
 * 3. MiniCssExtractPlugin 抽出的独立 css 文件更贴近真实部署，便于观察
 *    qiankun 的样式隔离（scoped / strict）对全局选择器的影响。
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? 'js/[name].js' : 'js/[name].[contenthash:8].js',
    chunkFilename: isDev ? 'js/[name].chunk.js' : 'js/[name].[contenthash:8].chunk.js',
    // auto：由运行时 __webpack_public_path__ 决定（见 src/index.ts 顶部）
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // 只「不处理」legacy-support.css 这条 import，
              // 让它在产物 CSS 里原样保留（供 qiankun @import 行为测试）。
              // 其余业务 @import（tailwind/base/components/animations）照常内联合并。
              import: {
                filter: (url) => !/legacy-support\.css/.test(url),
              },
            },
          },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'body',
      minify: isDev ? false : { collapseWhitespace: true, removeComments: true },
    }),
    new MiniCssExtractPlugin({
      filename: isDev ? 'css/[name].css' : 'css/[name].[contenthash:8].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '' },
        // legacy-support.css 独立拷贝到 dist/css/，与产物 CSS 中保留的
        // `@import './legacy-support.css';` 相对路径对应
        { from: 'src/styles/legacy-support.css', to: 'css/legacy-support.css' },
      ],
    }),
  ],
  devServer: {
    // qiankun 主应用 fetch 子应用 HTML 时要求 CORS
    headers: { 'Access-Control-Allow-Origin': '*' },
    host: '0.0.0.0',
    port: 8002,
    hot: true,
    open: false,
    historyApiFallback: true,
  },
  devtool: isDev ? 'eval-source-map' : 'source-map',
};

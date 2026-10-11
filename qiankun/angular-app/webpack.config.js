// webpack.config.js
// qiankun 子应用配置：
//   - publicPath 由 qiankun 在挂载时通过 __INJECTED_PUBLIC_PATH_BY_QIANKUN__ 动态注入
//     （main.ts 顶部有 __webpack_public_path__ = ... 赋值）
//   - UMD library 让生命周期函数挂到 window 上
module.exports = {
  output: {
    publicPath: '__webpack_public_path__',
    library: 'angular22App',
    libraryTarget: 'umd',
    globalObject: 'window',
  },
};

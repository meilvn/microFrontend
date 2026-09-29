const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "reactApp",
    projectName: "reactChild",
    webpackConfigEnv,
    argv,
    outputSystemJS: false,
  });

  const config = merge(defaultConfig, {
    // externals: ["react", "react-dom", "single-spa"],
    // modify the webpack config however you'd like to by adding to this object
  });

  config.externals = ['single-spa'];

  // 1. 在 config.plugins 数组中查找特定插件的索引
  const publicPathPluginIndex = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === "SystemJSPublicPathWebpackPlugin",
  );

  // 2. 如果找到了该插件（索引大于等于 0）
  if (publicPathPluginIndex >= 0) {
    // 3. 从插件数组中把它移除
    config.plugins.splice(publicPathPluginIndex, 1);
  }

  return config;
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // NOTE: react-native-dotenv removed - incompatible with expo-router
      // Use process.env.VARIABLE_NAME directly instead (Expo has built-in .env support)
      // Path aliases matching tsconfig.json
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@app": "./app",
            "@services": "./services",
            "@config": "./config",
            "@utils": "./app/utils",
            "@components": "./app/components",
            "@types": "./app/types",
          },
          extensions: [
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
          ],
        },
      ],
      // react-native-reanimated plugin must be listed last
      "react-native-reanimated/plugin",
    ],
  };
};
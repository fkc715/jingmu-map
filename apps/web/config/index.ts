import path from "node:path";
import { defineConfig, type UserConfigExport } from "@tarojs/cli";

export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport = {
    projectName: "jingmu-map-web",
    date: "2026-06-12",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2
    },
    sourceRoot: "src",
    outputRoot: "dist",
    alias: {
      "@": path.resolve(__dirname, "..", "src")
    },
    plugins: ["@tarojs/plugin-framework-react", "@tarojs/plugin-platform-h5"],
    framework: "react",
    compiler: {
      type: "webpack5",
      prebundle: {
        enable: false
      }
    },
    cache: {
      enable: false
    },
    mini: {},
    h5: {
      publicPath: "/",
      staticDirectory: "static",
      router: {
        mode: "browser"
      },
      devServer: {
        port: 3000,
        host: "0.0.0.0"
      }
    }
  };

  const envConfig = mode === "production" ? await import("./prod") : await import("./dev");
  return merge({}, baseConfig, envConfig.default);
});

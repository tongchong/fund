import dotenv from "dotenv";
import os from "os";
// import TerserPlugin from "terser-webpack-plugin";

dotenv.config();

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/";

/** @type {import('next').NextConfig} */

export default () => {

  global.__CONFIG__ = {
    BASE_PATH,
  };
  /** @type {import('next').NextConfig} */

  const normalizedBasePath = BASE_PATH === "/" ? "" : BASE_PATH;
  const nextConfig = {
    basePath: normalizedBasePath,
    assetPrefix: normalizedBasePath,

    compiler: {
      styledComponents: true,
    },
    // 新增路由重写配置
    async redirects() {
      return process.env.NEXT_PUBLIC_ALLOW_LOGON === "1"
        ? []
        : [{
          source: "/logon",
          destination: "/login",
          permanent: false
        }];
    },

    webpack: (config, { isServer }) => {
      config.resolve.extensionAlias = {
        ".js": [".ts", ".tsx", ".js"],
        ".jsx": [".ts", ".tsx", ".js"],
      };

      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
        };
      }

      config.module.rules.push({
        test: /\.node$/,
        use: [
          {
            loader: "nextjs-node-loader",
            options: {
              flags: os.constants.dlopen.RTLD_NOW,
              outputPath: config.output.path,
            },
          },
        ],
      });

      // 添加 TerserPlugin 配置来保留类名和函数名
      // if (!dev && !isServer) {
      //   config.optimization.minimizer = [
      //     new TerserPlugin({
      //       terserOptions: {
      //         keep_classnames: true,  // 保留类名，防止类名被混淆
      //         keep_fnames: true,      // 保留函数名
      //       },
      //     }),
      //   ];
      // }
      config.optimization.minimize = false

      return config;
    },

    skipTrailingSlashRedirect: true,
    transpilePackages: ["antd", "@ant-design/icons"],
  };

  return nextConfig;
};

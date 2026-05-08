const PRODUCTION_ENV = {
  NODE_ENV: "production",
};


module.exports = {
  apps: [
    {
      name: "web",
      script: "npm",
      args: "run dev:server",
      interpreter: "pnpm",
      cwd: "./apps/web",
      env: {
       PORT: "7000",
       ...PRODUCTION_ENV,
      },
    },
  ],
};

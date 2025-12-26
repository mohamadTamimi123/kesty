module.exports = {
  apps: [
    {
      name: 'kisty-backend',
      script: 'npm',
      args: 'run start:dev',
      cwd: process.env.PM2_CWD || '/root/kisty/backend/src/api/project-name',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};

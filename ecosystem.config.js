// PM2 process definitions for the single-droplet deploy.
// Start with:  pm2 start ecosystem.config.js && pm2 save
// The API reads its secrets from apps/api/.env (loaded via dotenv/config),
// so cwd must stay apps/api. The web app reads apps/web/.env.local.
module.exports = {
  apps: [
    {
      name: 'rms-api',
      cwd: './apps/api',
      script: 'dist/index.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      time: true,
    },
    {
      name: 'rms-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      time: true,
    },
  ],
}

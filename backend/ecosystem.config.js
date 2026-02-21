export default {
  apps : [{
    name: "colonia-backend",
    cwd: "/var/www/colonia-app/backend",
    script: "src/app.js",
    node_args: "--max-old-space-size=512",
    max_memory_restart: "600M",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}
module.exports = {
  apps: [{
    name: "colonia-backend",
    script: "/var/www/colonia-app/backend/src/app.js",
    node_args: "--max-old-space-size=512",
    max_memory_restart: "600M",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}



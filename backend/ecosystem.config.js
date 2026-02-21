module.exports = {
  apps : [{
    name: "colonia-backend",
    cwd: "/var/www/colonia-app/backend",  // Directorio de trabajo
    script: "src/app.js",                   // Ruta completa al archivo
    node_args: "--max-old-space-size=512",
    max_memory_restart: "600M",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}
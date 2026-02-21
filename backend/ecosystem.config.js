module.exports = {
  apps : [{
    name: "paraje-doroteo-app",         // Nombre de tu aplicación
    script: "src/app.js",        // Archivo principal de tu app
    node_args: "--max-old-space-size=512", // Límite de memoria para Node.js
    max_memory_restart: "600M",             // Reinicio por alto consumo
    env: {
      NODE_ENV: "production",
    },
  }]
}
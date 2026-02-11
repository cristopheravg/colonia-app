#!/bin/bash

echo "🚀 Descargando fuente Inter de Google Fonts..."

# Lista de pesos y sus URLs
declare -A fonts=(
  ["inter-thin.woff2"]="100"
  ["inter-extralight.woff2"]="200"
  ["inter-light.woff2"]="300"
  ["inter-regular.woff2"]="400"
  ["inter-medium.woff2"]="500"
  ["inter-semibold.woff2"]="600"
  ["inter-bold.woff2"]="700"
  ["inter-extrabold.woff2"]="800"
  ["inter-black.woff2"]="900"
)

# URL base de Google Fonts
BASE_URL="https://fonts.gstatic.com/s/inter/v13"

# Descargar cada variante
for filename in "${!fonts[@]}"; do
  weight=${fonts[$filename]}
  echo "📥 Descargando peso $weight..."
  
  # URL específica para cada peso
  case $weight in
    100) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2" ;;
    200) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7W0Q5n-wU.woff2" ;;
    300) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7W0Q5n-wU.woff2" ;;
    400) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5n-wU.woff2" ;;
    500) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7W0Q5n-wU.woff2" ;;
    600) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7W0Q5n-wU.woff2" ;;
    700) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7W0Q5n-wU.woff2" ;;
    800) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa35L7W0Q5n-wU.woff2" ;;
    900) url="${BASE_URL}/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7W0Q5n-wU.woff2" ;;
  esac
  
  # Descargar con curl
  curl -s -L -o "$filename" "$url" &
done

# Esperar a que todas las descargas terminen
wait

echo "✅ ¡Descarga completada!"
echo "📁 Fuentes descargadas en: $(pwd)"
ls -la *.woff2

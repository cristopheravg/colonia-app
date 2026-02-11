# Actualizar sistema
sudo apt update && sudo apt upgrade -y


# Instalar Nginx (opcional)
sudo apt install -y nginx

# Configurar firewall
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp  # Backend
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

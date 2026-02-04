FROM node:18-alpine

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier les fichiers de l'application
COPY server.js .
COPY public/ ./public/

# Créer le répertoire des uploads
RUN mkdir -p public/uploads

# Exposer le port
EXPOSE 5000

# Démarrer l'application
CMD ["node", "server.js"]

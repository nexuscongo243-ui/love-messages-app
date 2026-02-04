# 📱 Application Messages d'Amour - Documentation Complète

## 🔐 Vue d'ensemble Sécurité

Cette application a été entièrement sécurisée avec les meilleures pratiques de l'industrie :

### ✅ Mesures de sécurité implémentées

1. **Authentification JWT sécurisée**
   - Tokens JWT signés avec clé secrète
   - Expiration automatique des sessions (24h)
   - Validation sur chaque requête protégée

2. **Hachage des mots de passe**
   - Utilisation de bcrypt (10 rounds)
   - Salting automatique
   - Aucun mot de passe stocké en clair

3. **Base de données sécurisée**
   - SQLite avec chiffrement optionnel
   - Prêt pour migration vers PostgreSQL/MySQL
   - Foreign keys et contraintes intégrité

4. **Protection HTTPS/TLS**
   - Redirection HTTP → HTTPS
   - Certificats SSL/TLS
   - HSTS (HTTP Strict-Transport-Security)

5. **Rate Limiting**
   - Limite 5 tentatives de connexion/15min
   - Limite générale 100 requêtes/15min
   - Protection contre brute-force

6. **Validation & Sanitization**
   - Validation avec express-validator
   - Échappement des entrées (XSS protection)
   - Contrôle des uploads (images uniquement)

7. **Headers de sécurité**
   - Content-Security-Policy (CSP)
   - X-Frame-Options (clickjacking)
   - X-Content-Type-Options (MIME sniffing)

8. **Logging & Monitoring**
   - Journal complet des actions
   - IP tracking
   - Détection anomalies

---

## 🚀 Installation & Déploiement

### Option 1 : Déploiement Docker (Recommandé)

#### Pré-requis
- Docker & Docker Compose installés
- Certificats SSL (Let's Encrypt gratuit)
- Serveur Linux (Ubuntu 20.04+ recommandé)

#### Étapes

1. **Cloner le projet**
```bash
git clone <repository-url>
cd love-messages-app
```

2. **Configuration environnement**
```bash
cp .env.example .env
nano .env
```

**Variables obligatoires à modifier:**
```env
JWT_SECRET=votre-clé-secrète-très-longue-min-32-caractères
DEFAULT_ADMIN_USERNAME=votre-admin
DEFAULT_ADMIN_PASSWORD=VotreMotDePasse@123
CORS_ORIGIN=https://votredomaine.com
NODE_ENV=production
```

3. **Générer certificats SSL (Let's Encrypt avec Certbot)**
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d votredomaine.com

# Copier les certificats
mkdir -p ssl
sudo cp /etc/letsencrypt/live/votredomaine.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/votredomaine.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*
```

4. **Démarrer l'application**
```bash
docker-compose up -d
```

5. **Initialiser l'admin**
```bash
curl -X POST http://localhost:5000/api/auth/init
```

6. **Vérifier le statut**
```bash
docker-compose ps
docker-compose logs -f app
```

---

### Option 2 : Déploiement Manuel

#### Pré-requis
- Node.js 18+ LTS
- npm ou yarn
- Nginx
- SQLite3

#### Installation

1. **Installer dépendances**
```bash
npm install
```

2. **Configuration**
```bash
cp .env.example .env
nano .env
```

3. **Démarrer en développement**
```bash
npm run dev
```

4. **Mode production (PM2 recommandé)**
```bash
npm install -g pm2
pm2 start server.js --name "love-app"
pm2 startup
pm2 save
```

5. **Configurer Nginx**
```bash
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🏠 Hébergement Options

### 1. **Heroku** ⭐ Plus facile pour débuter
```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer app
heroku create love-messages-app

# Définir variables
heroku config:set JWT_SECRET=your-secret

# Déployer
git push heroku main
```

### 2. **Railway.app** (Recommandé)
- Gratuit jusqu'à $5/mois
- Support Docker natif
- Dashboard intuitif
- [https://railway.app](https://railway.app)

### 3. **Render.com**
- Free tier disponible
- Support custom domains
- Déploiement depuis GitHub

### 4. **DigitalOcean**
```bash
# App Platform
- $5-12/mois
- Déploiement Docker facile
- Base de données PostgreSQL optionnelle

# Droplet + Nginx (DIY)
- $5+/mois
- Plus de contrôle
- Nécessite configuration manuelle
```

### 5. **Scaleway** (Hosting français)
- Conteneurs Docker à partir de €0.006/h
- S3-compatible storage
- RGPD compliant

---

## 📊 Architecture Application

```
┌─────────────────────────────────────┐
│        Client (HTML/JS)             │
│  - admin-login.html                 │
│  - admin-dashboard.html             │
│  - message-public.html              │
└────────────┬────────────────────────┘
             │ HTTPS
         ┌───▼───────────┐
         │  Nginx(SSL)   │ ◄─── Rate Limiting
         │ (Reverse      │      Headers Sécurité
         │  Proxy)       │      Compression
         └───┬───────────┘
             │
         ┌───▼──────────────────────┐
         │   Node.js Express        │
         │  - JWT Auth              │
         │  - API Routes            │
         │  - Validation            │
         │  - Image Processing      │
         └───┬──────────────────────┘
             │
         ┌───▼──────────────────────┐
         │   SQLite Database        │
         │  - Users                 │
         │  - Messages              │
         │  - Sessions              │
         │  - Logs                  │
         └──────────────────────────┘
```

---

## 🔑 API Reference

### Auth Endpoints

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "password123"
}
```
Response:
```json
{
  "token": "eyJhbGc...",
  "username": "admin",
  "expiresIn": "24h"
}
```

**POST /api/auth/logout** (Requires auth)

**POST /api/auth/change-password** (Requires auth)
```json
{
  "currentPassword": "old",
  "newPassword": "new123"
}
```

### Message Endpoints

**POST /api/messages** (Requires auth)
```json
{
  "message": "Mon texte d'amour...",
  "password": "secret",
  "coupleName": "Sophie & Marc",
  "images": [file1, file2]
}
```

**GET /api/messages** (Requires auth)
Response: Liste des messages de l'admin

**GET /api/messages/:id** (Public)
Response: Infos du message (sans le contenu)

**POST /api/messages/:id/unlock** (Public)
```json
{
  "password": "secret"
}
```
Response: Contenu du message + images

**DELETE /api/messages/:id** (Requires auth)

**GET /api/stats** (Requires auth)
Response: Statistiques de l'admin

---

## 🛡️ Checklist Sécurité Déploiement

- [ ] JWT_SECRET changé (min 32 caractères aléatoires)
- [ ] Certificats SSL valides (Let's Encrypt)
- [ ] NODE_ENV=production
- [ ] Domaine configuré
- [ ] CORS_ORIGIN défini correctement
- [ ] Admin utilisateur créé et mot de passe changé
- [ ] Base de données sauvegardée
- [ ] Logs activés
- [ ] Rate limiting activé
- [ ] Headers de sécurité vérifiés
- [ ] HTTPS redirection active
- [ ] Firewall configuré (port 443 + 80 seulement)
- [ ] Backups quotidiens mis en place

---

## 🐛 Troubleshooting

### "Connection refused"
```bash
# Vérifier que le service tourne
docker-compose ps

# Restart
docker-compose restart app
```

### "Certificate error"
```bash
# Vérifier chemin certificats
ls -la ssl/

# Renouveler avec Certbot
sudo certbot renew
```

### "Database locked"
```bash
# Supprimer lock file
rm -f database.sqlite-journal

# Restart
docker-compose restart app
```

### "Port 5000 already in use"
```bash
# Trouver processus
lsof -i :5000

# Killer processus (si processus ancien)
kill -9 <PID>
```

---

## 📈 Performance & Scaling

### Optimisations actuelles
- Gzip compression
- Browser caching
- Image optimization (WebP)
- Connection pooling
- Rate limiting

### Pour scaling futur
1. Migrer SQLite → PostgreSQL
2. Redis pour sessions
3. CDN pour assets
4. Multiple Node instances
5. Load balancer
6. Database replication

---

## 🔄 Maintenance

### Sauvegarde

```bash
# Backup SQLite
docker-compose exec app cp database.sqlite database.sqlite.backup

# Copier localement
docker-compose cp app:/app/database.sqlite ./backups/db-$(date +%Y%m%d).sqlite
```

### Monitoring

```bash
# Logs en temps réel
docker-compose logs -f app

# Vérifier ressources
docker stats

# Logs Nginx
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

### Updates

```bash
# Rebuild images
docker-compose build --no-cache

# Restart
docker-compose up -d
```

---

## 📝 Notes Importantes

1. **Changez TOUS les mots de passe par défaut**
2. **Générez une clé JWT secrète forte**
3. **Configurez les certificats SSL**
4. **Mettez en place des backups automatiques**
5. **Monitoring et logging essentiels en production**
6. **Testez le déploiement complètement avant de lancer**

---

## ❓ Support

Pour déboguer :
```bash
# Afficher logs détaillés
docker-compose logs -f --tail=100 app

# Exécuter commandes dans le conteneur
docker-compose exec app sh

# Vérifier variables d'environnement
docker-compose exec app env | grep -i jwt
```

---

**Dernière mise à jour:** Février 2026
**Version:** 1.0.0
**Statut:** Production Ready ✅

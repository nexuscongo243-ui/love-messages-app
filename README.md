# 💌 Messages d'Amour - Application Sécurisée

Une application web élégante et sécurisée pour créer et partager des messages d'amour secrets pour la Saint-Valentin.

## ✨ Fonctionnalités

### Pour les administrateurs
- 🔐 Authentification JWT sécurisée
- ✍️ Créer des messages d'amour avec protection par mot de passe
- 📸 Ajouter jusqu'à 2 photos en cadres personnalisés
- 📊 Tableau de bord avec statistiques
- 🔗 Générer des liens de partage uniques
- 📈 Voir le nombre de vues pour chaque message
- 🔄 Gérer et supprimer les messages

### Pour les visiteurs
- 🔓 Déverrouiller les messages avec mot de passe
- 🎨 Interface esthétique avec animations
- 📱 Design responsive (mobile, tablet, desktop)
- 💝 Cœurs animés et effets spéciaux
- 🔒 Aucun mot de passe stocké côté client

## 🛡️ Sécurité

✅ **Authentification**
- JWT tokens
- Hachage bcrypt des mots de passe
- Sessions temporaires (24h)

✅ **Protection des données**
- HTTPS/TLS obligatoire
- Mots de passe chiffrés (bcrypt)
- Validation des entrées
- Protection XSS

✅ **Accès**
- Rate limiting (5 tentatives de connexion/15min)
- IP tracking et logging
- CORS configuré
- Headers de sécurité (CSP, HSTS, etc.)

✅ **Infrastructure**
- Container Docker isolé
- Nginx reverse proxy sécurisé
- Base de données locale/distante
- Backups automatiques possibles

## 📋 Stack Technique

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js + Express.js
- **Database:** SQLite (scalable vers PostgreSQL)
- **Security:** JWT, bcrypt, Helmet, express-validator
- **Deployment:** Docker + Docker Compose + Nginx
- **SSL:** Let's Encrypt / Certbot

## 🚀 Démarrage rapide

### Mode développement
```bash
npm install
npm run dev
```

Accès: http://localhost:5000

### Mode production (Docker)
```bash
docker-compose up -d
```

Accès: https://votredomaine.com

Pour la configuration complète, voir [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📦 Structure du projet

```
.
├── server.js                 # Backend principal
├── package.json              # Dépendances Node
├── Dockerfile                # Configuration Docker
├── docker-compose.yml        # Composition des services
├── nginx.conf                # Configuration reverse proxy
├── .env.example              # Variables d'environnement
├── DEPLOYMENT.md             # Guide complet déploiement
├── public/
│   ├── admin-login.html      # Page connexion
│   ├── admin-dashboard.html  # Tableau de bord
│   ├── message-public.html   # Affichage messages
│   └── uploads/              # Fichier images
└── database.sqlite           # Base de données (créée auto)
```

## 🔐 Configuration sécurité

1. **Changer le JWT_SECRET:**
   ```bash
   # Générer une clé sécurisée
   openssl rand -base64 32
   ```

2. **Changer les identifiants par défaut:**
   ```env
   DEFAULT_ADMIN_USERNAME=votre_username
   DEFAULT_ADMIN_PASSWORD=VotreMotDePasse@123
   ```

3. **Configurer HTTPS:**
   - Obtenir certificat Let's Encrypt
   - Placer dans dossier `ssl/`
   - Configurer domaine

4. **Activer CORS:**
   ```env
   CORS_ORIGIN=https://votredomaine.com
   ```

## 🌐 Options d'hébergement

| Plateforme | Prix | Facilité | Recommandé |
|-----------|------|---------|-----------|
| **Railway.app** | Gratuit-$5 | ⭐⭐⭐⭐⭐ | ✅ |
| **Render.com** | Gratuit-$7 | ⭐⭐⭐⭐ | ✅ |
| **Heroku** | Payant | ⭐⭐⭐⭐ | ✅ |
| **DigitalOcean** | $5+ | ⭐⭐⭐ | ✅ |
| **Scaleway** | €0.006/h | ⭐⭐⭐ | ✅ |
| **VPS manuel** | Varie | ⭐⭐ | Expert |

## 📈 Statistiques & Monitoring

L'application enregistre:
- Actions des utilisateurs
- Tentatives d'accès
- Nombre de vues par message
- Adresses IP
- Erreurs et exceptions

Accédez aux logs:
```bash
docker-compose logs -f app
```

## 🐛 Troubleshooting

**Problème:** "Cannot connect to database"
```bash
docker-compose restart app
```

**Problème:** "SSL certificate error"
```bash
# Renouveler le certificat
sudo certbot renew
```

**Problème:** "Port 5000 already in use"
```bash
# Trouver et tuer le processus
lsof -i :5000
kill -9 <PID>
```

Pour plus d'aide, voir [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📜 License

MIT - Libre d'utilisation pour projets personnels et commerciaux

## 👨‍💻 Support

Questions ou bug reports? Créez une issue dans le repository!

---

### Améliorations futures possibles

- [ ] Réinitialisation de mot de passe par email
- [ ] Exportation PDF des messages
- [ ] Thèmes personnalisés
- [ ] Support multilingue
- [ ] 2FA (authentification double facteur)
- [ ] Intégration réseaux sociaux
- [ ] API publique pour intégrations tiers

---

**Créé avec ❤️ pour la Saint-Valentin 2026**
# love-messages-app

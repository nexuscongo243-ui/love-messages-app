#!/bin/bash

# ================================
# Script Setup Application
# ================================

set -e

echo "🎈 Setup Application Messages d'Amour"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifications pré-requises
echo "📋 Vérification des pré-requis..."

if ! command -v docker &> /dev/null; then
    print_error "Docker non installé! Voir: https://docs.docker.com/install/"
    exit 1
fi
print_success "Docker installé"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose non installé!"
    exit 1
fi
print_success "Docker Compose installé"

# Créer le fichier .env
echo ""
echo "🔧 Configuration environnement..."

if [ -f .env ]; then
    print_warning ".env existe déjà - Non remplacé"
else
    cp .env.example .env
    print_success ".env créé"
fi

# Demander configuration
echo ""
echo "❓ Configuration requise:"
echo ""

read -p "Entrez votre nom d'admin [admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

read -sp "Entrez un mot de passe d'admin sécurisé: " ADMIN_PASS
echo ""

read -p "Entrez votre domaine [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
print_success "Clé JWT générée"

# Mettre à jour .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
sed -i "s|DEFAULT_ADMIN_USERNAME=.*|DEFAULT_ADMIN_USERNAME=$ADMIN_USER|g" .env
sed -i "s|DEFAULT_ADMIN_PASSWORD=.*|DEFAULT_ADMIN_PASSWORD=$ADMIN_PASS|g" .env
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|g" .env

print_success ".env configuré"

# Dosseurs SSL
echo ""
echo "🔐 Configuration SSL..."

if [ ! -d "ssl" ]; then
    mkdir -p ssl
    
    if [ "$DOMAIN" == "localhost" ]; then
        # Auto-signed cert pour développement
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem \
            -days 365 -nodes -subj "/CN=localhost"
        print_success "Certificat auto-signé créé (dev only)"
    else
        print_warning "Certificats SSL manquants!"
        echo "  → Installer Let's Encrypt Certbot:"
        echo "     sudo apt-get install certbot"
        echo "     sudo certbot certonly --standalone -d $DOMAIN"
        echo "  → Puis copier les certificats:"
        echo "     sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem"
        echo "     sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem"
    fi
else
    print_success "Dossier SSL existe"
fi

# Créer dossier uploads
mkdir -p public/uploads
print_success "Dossier uploads créé"

# Afficher résumé
echo ""
echo "========================================"
echo -e "${GREEN}✅ Configuration complète!${NC}"
echo "========================================"
echo ""
echo "Informations:"
echo "  Admin: $ADMIN_USER"
echo "  Domaine: $DOMAIN"
echo "  JWT Secret: [généré automatiquement]"
echo ""

# Démarrer Docker
echo "🐳 Démarrage Docker Compose..."
docker-compose build
docker-compose up -d

echo ""
print_success "Application démarrée!"
echo ""
echo "Accès:"
if [ "$DOMAIN" == "localhost" ]; then
    echo "  Développement: http://localhost:5000"
else
    echo "  Production: https://$DOMAIN"
fi

echo ""
echo "Initialiser l'admin:"
echo "  curl -X POST http://localhost:5000/api/auth/init"
echo ""

# Vérifier si running
sleep 3
if docker-compose ps | grep -q "Up"; then
    print_success "Services en ligne ✨"
else
    print_error "Services ne démarrent pas - Vérifier logs:"
    docker-compose logs
fi

echo ""
echo "Pour afficher les logs:"
echo "  docker-compose logs -f app"
echo ""
echo "Pour arrêter:"
echo "  docker-compose down"
echo ""

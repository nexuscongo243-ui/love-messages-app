#!/bin/bash

# ================================
# Script Deploy vers GitHub + Railway
# ================================

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ❤️  SCRIPT DEPLOY LOVE MESSAGES      ║"
echo "║  Pousse tout sur GitHub + Railway     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ================================
# 1. Demander informations
# ================================

echo "📋 ÉTAPE 1: Configuration"
echo "========================="
echo ""

read -p "Ton username GitHub? (ex: nexuscongo243): " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "Username requis!"
    exit 1
fi

read -p "Créer nouveau repo? (oui/non): " CREATE_REPO

echo ""
read -p "Nom du repo GitHub? (par défaut: love-messages-app): " REPO_NAME
REPO_NAME=${REPO_NAME:-love-messages-app}

echo ""
print_info "Configuration:"
echo "  Username: $GITHUB_USERNAME"
echo "  Repo: $REPO_NAME"
echo ""

# ================================
# 2. Configurer Git
# ================================

echo "⚙️  ÉTAPE 2: Configuration Git"
echo "=============================="
echo ""

read -p "Ton nom complet pour Git? (ex: John Doe): " GIT_NAME
read -p "Ton email pour Git? (ex: john@example.com): " GIT_EMAIL

git config --global user.name "$GIT_NAME"
git config --global user.email "$GIT_EMAIL"

print_success "Git configuré"

# ================================
# 3. Initialiser repo local
# ================================

echo ""
echo "🔧 ÉTAPE 3: Initialiser repo local"
echo "=================================="
echo ""

if [ -d ".git" ]; then
    print_warning "Git déjà initialisé"
    read -p "Réinitialiser? (oui/non): " REINIT
    if [ "$REINIT" == "oui" ]; then
        rm -rf .git
        git init
    fi
else
    git init
    print_success "Repo local créé"
fi

# ================================
# 4. Ajouter fichiers
# ================================

echo ""
echo "📦 ÉTAPE 4: Ajouter fichiers"
echo "============================"
echo ""

git add .

# Vérifier les changements
CHANGES=$(git status --short | wc -l)
print_success "$CHANGES fichiers prêts à commiter"

# ================================
# 5. Commit
# ================================

echo ""
echo "💾 ÉTAPE 5: Commit"
echo "=================="
echo ""

git commit -m "🚀 Initial deployment - Love Messages App"
print_success "Commit effectué"

# ================================
# 6. Ajouter remote
# ================================

echo ""
echo "🔗 ÉTAPE 6: Ajouter distant GitHub"
echo "==================================="
echo ""

REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Vérifier si remote existe déjà
if git remote get-url origin 2>/dev/null; then
    print_warning "Remote 'origin' existe déjà"
    git remote remove origin
fi

git remote add origin "$REMOTE_URL"
print_success "Remote ajouté: $REMOTE_URL"

# ================================
# 7. Instructions créer repo GitHub
# ================================

echo ""
echo "⚠️  ÉTAPE 7: Créer le repo sur GitHub"
echo "====================================="
echo ""
echo "Tu dois créer le repo sur GitHub avant de pouvoir pousser."
echo ""
print_info "Voici comment:"
echo ""
echo "1️⃣  Aller sur: https://github.com/new"
echo ""
echo "2️⃣  Remplir:"
echo "   • Repository name: $REPO_NAME"
echo "   • Description: Application messages d'amour sécurisée"
echo "   • Visibility: Public"
echo ""
echo "3️⃣  Click: 'Create repository'"
echo ""
echo "4️⃣  Revenir ici et appuyer sur ENTRÉE"
echo ""

read -p "T'as créé le repo? (appuie sur ENTRÉE quand c'est fait)"

# ================================
# 8. Pousser le code
# ================================

echo ""
echo "🚀 ÉTAPE 8: Pousser le code"
echo "============================"
echo ""

print_info "Poussage du code vers GitHub..."

git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    print_success "Code poussé sur GitHub! 🎉"
else
    print_error "Erreur lors du push"
    echo ""
    echo "Possibilités:"
    echo "1. Repo n'existe pas sur GitHub"
    echo "2. Problème d'authentification"
    echo ""
    echo "Solution:"
    echo "- Aller sur: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "- Vérifier que le repo existe"
    echo "- Vérifier ton token GitHub"
    exit 1
fi

# ================================
# 9. Résumé
# ================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║           ✅ C'EST DONE! ✅            ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Ton code est sur GitHub!"
echo ""
print_success "Repo GitHub: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo ""
echo "1️⃣  Aller sur: https://railway.app"
echo ""
echo "2️⃣  Click 'New Project' → 'Deploy from GitHub'"
echo ""
echo "3️⃣  Sélectionner: $REPO_NAME"
echo ""
echo "4️⃣  Click 'Deploy'"
echo ""
echo "5️⃣  Attendre 2-3 minutes"
echo ""
echo "6️⃣  Aller aux Settings → Variables et ajouter:"
echo ""
echo "    JWT_SECRET = aB7x9mK2pL5qR8vW3dF6gH4jN1sT0uY2"
echo "    NODE_ENV = production"
echo "    DEFAULT_ADMIN_PASSWORD = Admin@2026"
echo ""
echo "7️⃣  Redéployer"
echo ""
echo "8️⃣  App est LIVE! 🎉"
echo ""
echo "Questions? C'est normal, railacé c'est super!"
echo ""

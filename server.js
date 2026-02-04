require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const sharp = require('sharp');

// Configuration
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// MIDDLEWARE SÉCURITÉ
// ============================================

// Helmet pour les headers HTTP sécurisés
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite 100 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard'
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Max 5 tentatives de connexion
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
});

const passwordAttemptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Max 10 tentatives par message
    skipSuccessfulRequests: true
});

app.use('/api/', limiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/messages/unlock', passwordAttemptLimiter);

// Configuration multer pour uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont acceptées'));
        }
    }
});

// ============================================
// BASE DE DONNÉES SQLite
// ============================================

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Erreur connexion BD:', err.message);
    } else {
        console.log('✓ Connecté à la base de données SQLite');
        initDatabase();
    }
});

function initDatabase() {
    // Table Admin
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table Messages
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_text TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            couple_name TEXT,
            left_image BLOB,
            right_image BLOB,
            views INTEGER DEFAULT 0,
            admin_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
        )
    `);

    // Table Sessions
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
        )
    `);

    // Table Logs
    db.run(`
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            admin_id INTEGER,
            ip_address TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✓ Tables de base de données initialisées');
}

// ============================================
// UTILITAIRES
// ============================================

// Logger
function logAction(action, adminId = null, details = null, req = null) {
    const ip = req ? req.ip || req.connection.remoteAddress : 'unknown';
    db.run(
        `INSERT INTO logs (action, admin_id, ip_address, details) VALUES (?, ?, ?, ?)`,
        [action, adminId, ip, details || null]
    );
}

// Middleware authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            logAction('auth_failed', null, `Token invalide: ${err.message}`, req);
            return res.status(403).json({ error: 'Token invalide' });
        }
        req.adminId = decoded.adminId;
        req.username = decoded.username;
        next();
    });
};

// ============================================
// ROUTES AUTHENTIFICATION
// ============================================

// Boot de l'admin par défaut si nécessaire
app.post('/api/auth/init', (req, res) => {
    if (NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Non disponible en production' });
    }

    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@2024';

    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    db.run(
        `INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`,
        [defaultUsername, hashedPassword],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erreur création admin' });
            }
            res.json({ message: 'Admin créé avec succès', username: defaultUsername });
        }
    );
});

// Connexion
app.post('/api/auth/login',
    [
        body('username').trim().notEmpty().escape(),
        body('password').notEmpty()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Chercher l'admin
        db.get(
            `SELECT id, username, password_hash FROM admins WHERE username = ?`,
            [username],
            (err, admin) => {
                if (err) {
                    logAction('login_error', null, err.message, req);
                    return res.status(500).json({ error: 'Erreur serveur' });
                }

                if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
                    logAction('login_failed', null, `Tentative avec ${username}`, req);
                    return res.status(401).json({ error: 'Identifiants incorrects' });
                }

                // Générer JWT
                const token = jwt.sign(
                    { adminId: admin.id, username: admin.username },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRE }
                );

                // Sauvegarder session
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                db.run(
                    `INSERT INTO sessions (admin_id, token, expires_at) VALUES (?, ?, ?)`,
                    [admin.id, token, expiresAt]
                );

                logAction('login_success', admin.id, null, req);

                res.json({
                    token,
                    username: admin.username,
                    expiresIn: JWT_EXPIRE
                });
            }
        );
    }
);

// Déconnexion
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    db.run(
        `DELETE FROM sessions WHERE admin_id = ?`,
        [req.adminId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur déconnexion' });
            }
            logAction('logout', req.adminId, null, req);
            res.json({ message: 'Déconnecté avec succès' });
        }
    );
});

// Changer le mot de passe
app.post('/api/auth/change-password',
    authenticateToken,
    [
        body('currentPassword').notEmpty(),
        body('newPassword').notEmpty().isLength({ min: 8 })
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Récupérer l'admin
        db.get(
            `SELECT password_hash FROM admins WHERE id = ?`,
            [req.adminId],
            (err, admin) => {
                if (err || !admin) {
                    return res.status(500).json({ error: 'Admin non trouvé' });
                }

                if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
                    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
                }

                const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

                db.run(
                    `UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [hashedNewPassword, req.adminId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Erreur mise à jour' });
                        }
                        logAction('password_changed', req.adminId, null, req);
                        res.json({ message: 'Mot de passe changé avec succès' });
                    }
                );
            }
        );
    }
);

// ============================================
// ROUTES MESSAGES
// ============================================

// Créer un message
app.post('/api/messages',
    authenticateToken,
    upload.array('images', 2),
    [
        body('message').trim().notEmpty().isLength({ min: 10, max: 5000 }),
        body('password').notEmpty().isLength({ min: 4 }),
        body('coupleName').trim().escape().optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { message, password, coupleName } = req.body;

            // Hacher le mot de passe
            const passwordHash = bcrypt.hashSync(password, 10);

            // Traiter les images
            let leftImageBlob = null;
            let rightImageBlob = null;

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const imageBuffer = await sharp(req.files[i].buffer)
                        .resize(400, 400, { fit: 'cover' })
                        .webp({ quality: 80 })
                        .toBuffer();

                    if (i === 0) {
                        leftImageBlob = imageBuffer;
                    } else if (i === 1) {
                        rightImageBlob = imageBuffer;
                    }
                }
            }

            // Sauvegarder le message
            db.run(
                `INSERT INTO messages (message_text, password_hash, couple_name, left_image, right_image, admin_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [message, passwordHash, coupleName || 'Anonyme', leftImageBlob, rightImageBlob, req.adminId],
                function(err) {
                    if (err) {
                        console.error('Erreur insertion:', err);
                        return res.status(500).json({ error: 'Erreur sauvegarde message' });
                    }

                    logAction('message_created', req.adminId, `Message ID: ${this.lastID}`, req);

                    res.status(201).json({
                        id: this.lastID,
                        message: 'Message créé avec succès'
                    });
                }
            );
        } catch (error) {
            console.error('Erreur traitement:', error);
            res.status(500).json({ error: 'Erreur du serveur' });
        }
    }
);

// Récupérer les messages de l'admin
app.get('/api/messages', authenticateToken, (req, res) => {
    db.all(
        `SELECT id, couple_name, message_text, views, created_at FROM messages WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50`,
        [req.adminId],
        (err, messages) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur récupération' });
            }
            res.json(messages || []);
        }
    );
});

// Récupérer un message (public, nécessite mot de passe)
app.get('/api/messages/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT id, couple_name, message_text, created_at, views FROM messages WHERE id = ?`,
        [id],
        (err, message) => {
            if (err || !message) {
                return res.status(404).json({ error: 'Message non trouvé' });
            }
            res.json(message);
        }
    );
});

// Déverrouiller un message (vérifier mot de passe)
app.post('/api/messages/:id/unlock',
    [
        body('password').notEmpty()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { password } = req.body;

        db.get(
            `SELECT id, message_text, password_hash, left_image, right_image FROM messages WHERE id = ?`,
            [id],
            (err, message) => {
                if (err || !message) {
                    return res.status(404).json({ error: 'Message non trouvé' });
                }

                if (!bcrypt.compareSync(password, message.password_hash)) {
                    return res.status(401).json({ error: 'Mot de passe incorrect' });
                }

                // Incrémenter les vues
                db.run(
                    `UPDATE messages SET views = views + 1 WHERE id = ?`,
                    [id]
                );

                // Convertir les blobs en base64
                let leftImage = null;
                let rightImage = null;

                if (message.left_image) {
                    leftImage = 'data:image/webp;base64,' + Buffer.from(message.left_image).toString('base64');
                }
                if (message.right_image) {
                    rightImage = 'data:image/webp;base64,' + Buffer.from(message.right_image).toString('base64');
                }

                logAction('message_unlocked', null, `Message ID: ${id}`, req);

                res.json({
                    messageText: message.message_text,
                    leftImage,
                    rightImage
                });
            }
        );
    }
);

// Supprimer un message
app.delete('/api/messages/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Vérifier que l'admin propriétaire
    db.get(
        `SELECT admin_id FROM messages WHERE id = ?`,
        [id],
        (err, message) => {
            if (err || !message) {
                return res.status(404).json({ error: 'Message non trouvé' });
            }

            if (message.admin_id !== req.adminId) {
                return res.status(403).json({ error: 'Accès refusé' });
            }

            db.run(
                `DELETE FROM messages WHERE id = ?`,
                [id],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erreur suppression' });
                    }
                    logAction('message_deleted', req.adminId, `Message ID: ${id}`, req);
                    res.json({ message: 'Message supprimé' });
                }
            );
        }
    );
});

// Statistiques
app.get('/api/stats', authenticateToken, (req, res) => {
    db.all(
        `SELECT 
            (SELECT COUNT(*) FROM messages WHERE admin_id = ?) as total_messages,
            (SELECT SUM(views) FROM messages WHERE admin_id = ?) as total_views,
            (SELECT COUNT(*) FROM messages WHERE admin_id = ? AND (left_image IS NOT NULL OR right_image IS NOT NULL)) as messages_with_photos
        `,
        [req.adminId, req.adminId, req.adminId],
        (err, stats) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur statistiques' });
            }
            res.json(stats[0] || {});
        }
    );
});

// ============================================
// FICHIERS STATIQUES
// ============================================

app.use(express.static(path.join(__dirname, 'public')));

// Fallback pour le routing client
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// ============================================
// GESTION ERREURS
// ============================================

app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    logAction('error', null, err.message, req);
    res.status(500).json({ error: 'Erreur serveur' });
});

// ============================================
// DÉMARRAGE
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  Application Messages d'Amour - V1.0   ║
║  Server démarré sur port ${PORT}         ║
║  Environnement: ${NODE_ENV}               ║
╚════════════════════════════════════════╝
    `);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
    console.error('Erreur non gérée:', err);
    process.exit(1);
});

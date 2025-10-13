const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configurado para aceitar qualquer origem (em produção)
app.use(cors({
    origin: true, // Aceita qualquer origem
    credentials: true
}));
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Criar/Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./rezende_energia.db', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        initDatabase();
    }
});

// Inicializar tabelas (MESMO CÓDIGO QUE VOCÊ JÁ TEM)
function initDatabase() {
    // Tabela de Requisições
    db.run(`CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        driver TEXT NOT NULL,
        plate TEXT NOT NULL,
        vehicle TEXT NOT NULL,
        city TEXT,
        gasStation TEXT,
        fuelType TEXT,
        fuelMethod TEXT,
        status TEXT DEFAULT 'pending',
        date TEXT,
        supervisor TEXT DEFAULT 'Pendente',
        estimatedValue TEXT,
        realValue TEXT,
        pricePerLiter REAL,
        liters TEXT,
        km INTEGER,
        priority TEXT,
        notes TEXT,
        createdAt TEXT
    )`);

    // Tabela de Veículos
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        plate TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        year TEXT,
        status TEXT DEFAULT 'Ativo',
        color TEXT,
        km INTEGER DEFAULT 0,
        lastFuel TEXT DEFAULT 'Nunca'
    )`);

    // Tabela de Registros de Abastecimento
    db.run(`CREATE TABLE IF NOT EXISTS fuel_records (
        requestId TEXT PRIMARY KEY,
        driver TEXT NOT NULL,
        vehicle TEXT NOT NULL,
        gasStation TEXT,
        fuelType TEXT,
        estimatedValue TEXT,
        realValue TEXT,
        pricePerLiter REAL,
        liters TEXT,
        status TEXT DEFAULT 'pending',
        date TEXT,
        notes TEXT
    )`);

    // Tabela de Preços de Combustível
    db.run(`CREATE TABLE IF NOT EXISTS fuel_prices (
        fuelType TEXT PRIMARY KEY,
        price REAL NOT NULL,
        lastUpdate TEXT
    )`);

    // Inserir veículos iniciais se não existirem
    db.get('SELECT COUNT(*) as count FROM vehicles', [], (err, row) => {
        if (row && row.count === 0) {
            insertInitialVehicles();
        }
    });

    // Inserir preços iniciais se não existirem
    db.get('SELECT COUNT(*) as count FROM fuel_prices', [], (err, row) => {
        if (row && row.count === 0) {
            insertInitialPrices();
        }
    });
}

// Inserir veículos iniciais (MESMO CÓDIGO QUE VOCÊ JÁ TEM)
function insertInitialVehicles() {
    const vehicles = [
        ['BCQ0937', 'F4000', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['JJB4E57', 'CARGO 1217', '2002', 'Ativo', 'Branco', 0, 'Nunca'],
        // ... (todos os veículos que você já tem)
    ];

    const stmt = db.prepare('INSERT INTO vehicles VALUES (?, ?, ?, ?, ?, ?, ?)');
    vehicles.forEach(v => stmt.run(v));
    stmt.finalize();
    console.log('✅ Veículos iniciais inseridos');
}

// Inserir preços iniciais (MESMO CÓDIGO QUE VOCÊ JÁ TEM)
function insertInitialPrices() {
    const prices = [
        ['Diesel S10', 6.69],
        ['Diesel Comum', 6.10],
        // ... (todos os preços que você já tem)
    ];

    const now = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO fuel_prices VALUES (?, ?, ?)');
    prices.forEach(p => stmt.run(p[0], p[1], now));
    stmt.finalize();
    console.log('✅ Preços iniciais inseridos');
}

// ==================== ROTAS API ====================

// GET - Buscar todas as requisições
app.get('/api/requests', (req, res) => {
    db.all('SELECT * FROM requests ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST - Criar nova requisição
app.post('/api/requests', (req, res) => {
    const {
        id, driver, plate, vehicle, city, gasStation, fuelType,
        fuelMethod, status, date, supervisor, estimatedValue,
        km, priority, notes, createdAt
    } = req.body;

    db.run(`INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?)`,
        [id, driver, plate, vehicle, city, gasStation, fuelType, fuelMethod,
         status, date, supervisor, estimatedValue, km, priority, notes, createdAt],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Criar registro de abastecimento associado
            db.run(`INSERT INTO fuel_records VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)`,
                [id, driver, vehicle, gasStation, fuelType, estimatedValue, status, date, notes || ''],
                (err) => {
                    if (err) console.error('Erro ao criar fuel_record:', err);
                }
            );

            res.json({ success: true, id: this.lastID });
        }
    );
});

// ... (TODAS AS SUAS OUTRAS ROTAS API PERMANECEM IGUAIS)

// Rota health check para Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Sistema Rezende Energia Online',
        timestamp: new Date().toISOString()
    });
});

// Rota raiz serve o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para qualquer outra URL servir o frontend (para SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 ========================================
   Sistema Rezende Energia - ONLINE
========================================
   🌐 Servidor rodando na porta: ${PORT}
   💾 Banco de dados: SQLite
   ✅ Sistema pronto para uso!
   📍 URL: http://0.0.0.0:${PORT}
========================================
    `);
});

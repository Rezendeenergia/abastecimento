const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
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

// Inicializar tabelas
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

    // SEMPRE inserir veículos iniciais (Render recria o banco)
    setTimeout(() => {
        insertInitialVehicles();
    }, 1000);

    // SEMPRE inserir preços iniciais
    setTimeout(() => {
        insertInitialPrices();
    }, 2000);
}

// Inserir veículos iniciais - SEMPRE executar
function insertInitialVehicles() {
    console.log('🔄 Inserindo veículos iniciais...');
    
    const vehicles = [
        ['BCQ0937', 'F4000', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['JJB4E57', 'CARGO 1217', '2002', 'Ativo', 'Branco', 0, 'Nunca'],
        ['NCF3078', 'L200 OUTDOOR', '2004', 'Ativo', 'Prata', 0, 'Nunca'],
        ['NFW2H74', 'CARGO 1317F', '2002', 'Ativo', 'Branco', 0, 'Nunca'],
        ['NRP2E59', 'L200 TRITON 3.2 D', '2016', 'Ativo', 'Prata', 0, 'Nunca'],
        ['OFP1B78', '13.190 CRM 4X2', '2020', 'Ativo', 'Branco', 0, 'Nunca'],
        ['OGI3J31', 'L200 TRITON 3.2 D', '2016', 'Ativo', 'Branco', 0, 'Nunca'],
        ['OLI7180', 'L200 TRITON GLS D', '2016', 'Ativo', 'Branco', 0, 'Nunca'],
        ['PHK5D53', 'STRADA FREEDOM CD13', '2022', 'Ativo', 'Prata', 0, 'Nunca'],
        ['PHL2H91', 'S10 LT', '2016', 'Ativo', 'Branco', 0, 'Nunca'],
        ['PHL8286', 'STRADA FREEDOM CD13', '2014', 'Ativo', 'Prata', 0, 'Nunca'],
        ['RXE8A01', 'SAVEIRO CS RB MF', '2018', 'Ativo', 'Branco', 0, 'Nunca'],
        ['PVA2J86', 'SAVEIRO CS RB MF', '2016', 'Ativo', 'Prata', 0, 'Nunca'],
        ['SHF6D51', 'TECTOR 170E21', '2023', 'Ativo', 'Branco', 0, 'Nunca'],
        ['SHK5E03', 'TECTOR 170E21', '2023', 'Ativo', 'Branco', 0, 'Nunca'],
        ['SYN1C01', 'TECTOR 170E21', '2023', 'Ativo', 'Branco', 0, 'Nunca'],
        ['TAU9G16', '17.210 CRM 4X2', '2024', 'Ativo', 'Branco', 0, 'Nunca'],
        ['TAU9G17', '17.210 CRM 4X2', '2024', 'Ativo', 'Branco', 0, 'Nunca'],
        ['TDT0133', 'STRADA FREEDOM CD13', '2022', 'Ativo', 'Branco', 0, 'Nunca'],
        ['TDT3G89', 'STRADA FREEDOM CD13', '2022', 'Ativo', 'Branco', 0, 'Nunca'],
        ['TDT3H12', 'STRADA FREEDOM CD13', '2022', 'Ativo', 'Branco', 0, 'Nunca'],
        ['TDT3H26', 'STRADA FREEDOM CD13', '2022', 'Ativo', 'Branco', 0, 'Nunca'],
        ['CATAMARÃ 1', 'CATAMARÃ', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['CATAMARÃ 2', 'CATAMARÃ', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['RETROESCAVADEIRA 1', 'RETROESCAVADEIRA', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['RETROESCAVADEIRA 2', 'RETROESCAVADEIRA', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['RETROESCAVADEIRA 3', 'RETROESCAVADEIRA', '2023', 'Ativo', 'Branca', 0, 'Nunca'],
        ['QZK5H16', 'S10 LTZ', '2024', 'Ativo', 'PRETA', 0, 'Nunca'],
        ['TGM0373', 'HILUX SRX', '2022', 'Ativo', 'PRETA', 0, 'Nunca'],
        ['QVN99H33', 'HB20', '2022', 'Ativo', 'BRANCA', 0, 'Nunca']
    ];

    // Primeiro limpar a tabela para evitar duplicatas
    db.run('DELETE FROM vehicles', (err) => {
        if (err) {
            console.error('Erro ao limpar veículos:', err);
        } else {
            console.log('✅ Tabela de veículos limpa');
            
            // Inserir todos os veículos
            const stmt = db.prepare('INSERT OR REPLACE INTO vehicles VALUES (?, ?, ?, ?, ?, ?, ?)');
            
            let insertedCount = 0;
            vehicles.forEach((vehicle) => {
                stmt.run(vehicle, (err) => {
                    if (err) {
                        console.error(`❌ Erro ao inserir veículo ${vehicle[0]}:`, err);
                    } else {
                        insertedCount++;
                        console.log(`✅ Veículo ${vehicle[0]} inserido`);
                    }
                    
                    // Finalizar após o último veículo
                    if (insertedCount === vehicles.length) {
                        stmt.finalize();
                        console.log(`🎉 ${vehicles.length} veículos inseridos com sucesso!`);
                    }
                });
            });
        }
    });
}

// Inserir preços iniciais - SEMPRE executar
function insertInitialPrices() {
    console.log('🔄 Inserindo preços iniciais...');
    
    const prices = [
        ['Diesel S10', 6.69],
        ['Diesel Comum', 6.10],
        ['Gasolina Comum', 6.43],
        ['Gasolina Aditivada', 7.18],
        ['Etanol', 4.39],
        ['GNV', 5.13]
    ];

    const now = new Date().toISOString();
    
    // Limpar tabela de preços
    db.run('DELETE FROM fuel_prices', (err) => {
        if (err) {
            console.error('Erro ao limpar preços:', err);
        } else {
            console.log('✅ Tabela de preços limpa');
            
            const stmt = db.prepare('INSERT OR REPLACE INTO fuel_prices VALUES (?, ?, ?)');
            
            let insertedCount = 0;
            prices.forEach((price) => {
                stmt.run(price[0], price[1], now, (err) => {
                    if (err) {
                        console.error(`❌ Erro ao inserir preço ${price[0]}:`, err);
                    } else {
                        insertedCount++;
                        console.log(`✅ Preço ${price[0]} inserido: R$ ${price[1]}`);
                    }
                    
                    // Finalizar após o último preço
                    if (insertedCount === prices.length) {
                        stmt.finalize();
                        console.log(`🎉 ${prices.length} preços inseridos com sucesso!`);
                    }
                });
            });
        }
    });
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

// PUT - Atualizar requisição (aprovar/rejeitar)
app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status, supervisor, realValue, pricePerLiter, liters } = req.body;

    let query = 'UPDATE requests SET status = ?, supervisor = ?';
    let params = [status, supervisor];

    if (realValue) {
        query += ', realValue = ?, pricePerLiter = ?, liters = ?';
        params.push(realValue, pricePerLiter, liters);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Atualizar fuel_record também
        if (realValue) {
            db.run(`UPDATE fuel_records SET status = ?, realValue = ?, pricePerLiter = ?, liters = ? WHERE requestId = ?`,
                [status, realValue, pricePerLiter, liters, id]);
        } else {
            db.run('UPDATE fuel_records SET status = ? WHERE requestId = ?', [status, id]);
        }

        res.json({ success: true, changes: this.changes });
    });
});

// GET - Buscar todos os veículos
app.get('/api/vehicles', (req, res) => {
    db.all('SELECT * FROM vehicles ORDER BY plate', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST - Criar novo veículo
app.post('/api/vehicles', (req, res) => {
    const { plate, model, year, status, color, km, lastFuel } = req.body;

    db.run(`INSERT INTO vehicles VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [plate, model, year || 'N/A', status || 'Ativo', color || 'N/A', km || 0, lastFuel || 'Nunca'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE - Excluir veículo
app.delete('/api/vehicles/:plate', (req, res) => {
    const { plate } = req.params;

    db.run('DELETE FROM vehicles WHERE plate = ?', [plate], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// GET - Buscar todos os registros de abastecimento
app.get('/api/fuel-records', (req, res) => {
    db.all('SELECT * FROM fuel_records ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// PUT - Completar registro de abastecimento
app.put('/api/fuel-records/:id', (req, res) => {
    const { id } = req.params;
    const { liters, pricePerLiter, realValue, status } = req.body;

    db.run(`UPDATE fuel_records SET liters = ?, pricePerLiter = ?, realValue = ?, status = ? WHERE requestId = ?`,
        [liters, pricePerLiter, realValue, status, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// GET - Buscar preços de combustível
app.get('/api/fuel-prices', (req, res) => {
    db.all('SELECT * FROM fuel_prices', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// PUT - Atualizar preços de combustível
app.put('/api/fuel-prices', (req, res) => {
    const prices = req.body;
    const now = new Date().toISOString();

    const stmt = db.prepare('UPDATE fuel_prices SET price = ?, lastUpdate = ? WHERE fuelType = ?');

    Object.entries(prices).forEach(([fuelType, price]) => {
        stmt.run(price, now, fuelType);
    });

    stmt.finalize((err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de saúde para verificar se o servidor está rodando
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Sistema Rezende Energia está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rota para forçar recriação dos dados iniciais
app.post('/api/reset-data', (req, res) => {
    insertInitialVehicles();
    insertInitialPrices();
    res.json({ success: true, message: 'Dados iniciais recriados' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
🚀 ========================================
   Sistema Rezende Energia - ONLINE
========================================
   🌐 Servidor rodando em: http://localhost:${PORT}
   💾 Banco de dados: SQLite (rezende_energia.db)
   🚗 Veículos: 30 cadastrados automaticamente
   ⛽ Preços: 6 combustíveis cadastrados
   ✅ Sistema pronto para uso!
========================================
    `);
});

// Fechar banco ao encerrar
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('\n👋 Banco de dados fechado. Até logo!');
        process.exit(0);
    });
});

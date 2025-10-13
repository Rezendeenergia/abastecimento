// ==================== CONFIGURAÇÃO API ====================
// URL dinâmica que funciona em desenvolvimento e produção
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

console.log('🔧 Configuração API:', {
    hostname: window.location.hostname,
    origin: window.location.origin,
    API_URL: API_URL
});

// Estado global da aplicação
let currentRole = '';
let isLoggedIn = false;
let currentDriverName = '';
let requests = [];
let vehicles = [];
let fuelRecords = [];
let fuelPrices = {};

// ... (TODO O RESTO DO SEU CÓDIGO PERMANECE IGUAL)

// ==================== FUNÇÕES API ====================

async function fetchData(endpoint) {
    try {
        console.log(`🔗 Buscando dados de: ${API_URL}${endpoint}`);
        const response = await fetch(`${API_URL}${endpoint}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Dados recebidos de ${endpoint}:`, data.length || data);
        return data;
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
        
        // Mensagem mais amigável para o usuário
        let errorMessage = 'Erro de conexão com o servidor';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Servidor não encontrado. O sistema pode estar em manutenção.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        }
        
        showNotification(`❌ ${errorMessage}`, 'error');
        return null;
    }
}

async function postData(endpoint, data) {
    try {
        console.log(`📤 Enviando dados para: ${API_URL}${endpoint}`, data);
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Dados enviados com sucesso:', result);
        return result;
    } catch (error) {
        console.error('❌ Erro ao enviar dados:', error);
        showNotification('❌ Erro ao enviar dados para o servidor', 'error');
        return null;
    }
}

// ... (AS OUTRAS FUNÇÕES updateData E deleteData TAMBÉM PRECISAM DO MESMO TRATAMENTO DE ERRO)

// Modificar a função loadAllData para melhor debug
async function loadAllData() {
    showLoading();

    try {
        console.log('🔄 Iniciando carregamento de todos os dados...');
        
        // Carregar requisições
        const reqData = await fetchData('/requests');
        if (reqData) {
            requests = reqData;
            console.log(`✅ ${requests.length} requisições carregadas`);
        }

        // Carregar veículos
        const vehData = await fetchData('/vehicles');
        if (vehData) {
            vehicles = vehData;
            console.log(`✅ ${vehicles.length} veículos carregados`);
        }

        // Carregar registros de abastecimento
        const fuelData = await fetchData('/fuel-records');
        if (fuelData) {
            fuelRecords = fuelData;
            console.log(`✅ ${fuelRecords.length} registros de abastecimento carregados`);
        }

        // Carregar preços
        const pricesData = await fetchData('/fuel-prices');
        if (pricesData) {
            fuelPrices = {};
            pricesData.forEach(p => {
                fuelPrices[p.fuelType] = {
                    price: p.price,
                    lastUpdate: p.lastUpdate
                };
            });
            console.log(`✅ ${Object.keys(fuelPrices).length} preços carregados`);
        }

        // Atualizar interface
        loadRecentActivities();
        loadAllRequests();
        loadFuelRecords();
        loadFuelPrices();
        loadVehicles();
        updateStats();
        populateSelects();
        
        console.log('✅ Todos os dados carregados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNotification('❌ Erro ao carregar dados do sistema', 'error');
    } finally {
        hideLoading();
    }
}

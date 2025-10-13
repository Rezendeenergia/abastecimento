// ==================== CONFIGURAÇÃO API ====================
const API_URL = 'http://localhost:3000/api';

// Estado global da aplicação
let currentRole = '';
let isLoggedIn = false;
let currentDriverName = '';
let requests = [];
let vehicles = [];
let fuelRecords = [];
let fuelPrices = {};

// Listas de dados do sistema
const cities = [
    'Santarém', 'Mojuí dos Campos', 'Lago Grande', 'Vila Gorete',
    'Juruti', 'Almeirim', 'Barcarena', 'Itaituba', 'Curuai',
    'Vila Brasil', 'Membeca', 'Ilha das Onças'
];

const gasStations = [
    'Posto Leal (Itaituba)', 'Posto Topázio (Juruti)',
    'Posto Nossa Senhora de Nazaré (Curuaí)', 'Posto Amanhecer (Barcarena)',
    'Posto Equador (Frente da base)', 'Posto Equador (Muiraquitã com Turiano)',
    'Auto Amanhecer (Muiraquitã Frente a Base)', 'Posto Petrogás (Almerim)',
    'Posto São João (Mojuí)'
];

const fuelTypes = [
    'Diesel S10', 'Diesel Comum', 'Gasolina Comum',
    'Gasolina Aditivada', 'Etanol', 'GNV'
];

const availableDrivers = [
    'AIRTON VINICIUS DOS SANTOS OLIVEIRA',
    'ALESSANDRO OZITIO CAMPELO',
    'ARLISON NESTOR DA CONCEIÇÃO',
    'CARLOS ALBERTO DOS SANTOS',
    'CIDARTA REGIS DE SOUZA',
    'DANIEL PINTO PEDROSO',
    'DARLEN WILSON FERREIRA SILVA',
    'DINEY RODRIGUES DOS PASSOS',
    'EDER JUNIOR PAPALEO DA SILVA',
    'EDINEI DA SILVA FERREIRA',
    'EDUARDO PINHEIRO RODRIGUES',
    'HELIO BARBOSA COSTA',
    'JACKSOM AMARAL DA SILVA',
    'JARLISSON FABIO SANTOS DE SOUSA',
    'JANILDO PORTILHO SANTOS FILHO',
    'JOÃO BATISTA DA SILVA BEZERRA',
    'JOELSON MONTEIRO PEREIRA',
    'JOSIVAN MACIEL DOS REIS',
    'JUAN FABRICIO RODRIGUES DE LIMA',
    'JUNIPERO MANOEL DA SILVA LOPES',
    'KLEBER JOSE DOS SANTOS PEREIRA',
    'LEONARDO NANTES ALVES',
    'MARCIO FERREIRA SABOIA',
    'MARCOS ANDRE MENDES PEREIRA',
    'MARIVALDO DE JESUS CORREA',
    'MARLISSON FEITOSA BEZERRA',
    'MATHEUS TRINDADE DE ALMEIDA',
    'MICHAEL LUAN DOS SANTOS SILVA',
    'NILTON MARCOS MOTA CAMPOS',
    'PEDRO HUEB TAPXURE CURRY',
    'RAFAEL REZENDE DA SILVA',
    'RENILDO FERREIRA LAVAREDA',
    'RIAN TEIXEIRA SIQUEIRA',
    'ROMÁRIO LIMA RIKER'
];

// ==================== FUNÇÕES API ====================

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error('Erro ao buscar dados');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao conectar com servidor', 'error');
        return null;
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao enviar dados');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao enviar dados', 'error');
        return null;
    }
}

async function updateData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar dados');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao atualizar dados', 'error');
        return null;
    }
}

async function deleteData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erro ao excluir dados');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao excluir dados', 'error');
        return null;
    }
}

function showLoading() {
    const loadingElement = document.getElementById('loading-overlay');
    if (loadingElement) {
        loadingElement.classList.add('active');
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading-overlay');
    if (loadingElement) {
        loadingElement.classList.remove('active');
    }
}

// ==================== FUNÇÕES DE CARREGAMENTO ====================

async function loadAllData() {
    showLoading();

    try {
        // Carregar requisições
        const reqData = await fetchData('/requests');
        if (reqData) requests = reqData;

        // Carregar veículos
        const vehData = await fetchData('/vehicles');
        if (vehData) vehicles = vehData;

        // Carregar registros de abastecimento
        const fuelData = await fetchData('/fuel-records');
        if (fuelData) fuelRecords = fuelData;

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
        }

        // Atualizar interface
        loadRecentActivities();
        loadAllRequests();
        loadFuelRecords();
        loadFuelPrices();
        loadVehicles();
        updateStats();
        populateSelects();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados do sistema', 'error');
    } finally {
        hideLoading();
    }
}

// Auto-refresh a cada 5 segundos
setInterval(async () => {
    if (isLoggedIn) {
        try {
            const reqData = await fetchData('/requests');
            if (reqData) {
                requests = reqData;
                loadRecentActivities();
                loadAllRequests();
                updateStats();
            }

            const fuelData = await fetchData('/fuel-records');
            if (fuelData) {
                fuelRecords = fuelData;
                if (document.getElementById('fuel-records').classList.contains('active')) {
                    loadFuelRecords();
                }
            }
        } catch (error) {
            console.error('Erro no auto-refresh:', error);
        }
    }
}, 5000);

// ==================== FUNÇÕES DE LOGIN ====================

function showDriverLogin() {
    const driverSelect = document.getElementById('driver-name');
    driverSelect.innerHTML = '<option value="">Selecione seu nome</option>';

    availableDrivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver;
        option.textContent = driver;
        driverSelect.appendChild(option);
    });

    document.getElementById('role-selection').style.display = 'none';
    document.getElementById('driver-login').style.display = 'block';
}

function loginAsDriver() {
    const selectedDriver = document.getElementById('driver-name').value;

    if (!selectedDriver) {
        showNotification('Por favor, selecione seu nome!', 'error');
        return;
    }

    currentRole = 'motorista';
    currentDriverName = selectedDriver;
    isLoggedIn = true;

    showMainApp();
    showNotification(`Bem-vindo, ${selectedDriver.split(' ')[0]}!`, 'success');
}

function showSupervisorLogin() {
    document.getElementById('role-selection').style.display = 'none';
    document.getElementById('supervisor-login').style.display = 'block';
}

function loginAsSupervisor() {
    const username = document.getElementById('supervisor-username').value;
    const password = document.getElementById('supervisor-password').value;

    const supervisors = {
        'Airton': '123',
        'Eduardo': '2025',
        'Pedro': '456'
    };

    if (supervisors[username] && supervisors[username] === password) {
        currentRole = 'supervisor';
        currentDriverName = username;
        isLoggedIn = true;
        showMainApp();
        showNotification(`Bem-vindo, Supervisor ${username}!`, 'success');
    } else {
        showNotification('Usuário ou senha incorretos!', 'error');
    }
}

function backToRoleSelection() {
    document.getElementById('role-selection').style.display = 'block';
    document.getElementById('driver-login').style.display = 'none';
    document.getElementById('supervisor-login').style.display = 'none';
}

function logout() {
    isLoggedIn = false;
    currentRole = '';
    currentDriverName = '';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';

    document.getElementById('supervisor-username').value = '';
    document.getElementById('supervisor-password').value = '';
    document.getElementById('driver-name').value = '';
    backToRoleSelection();

    showNotification('Logout realizado com sucesso!', 'success');
}

function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    setupUserInterface();
    updateCurrentDate();
    loadAllData();

    showNotification('Sistema carregado com sucesso!', 'success');
}

function setupUserInterface() {
    const userRoleDisplay = document.getElementById('user-role-display');
    const navVehicles = document.getElementById('nav-vehicles');
    const navReports = document.getElementById('nav-reports');
    const navFuelRecords = document.getElementById('nav-fuel-records');
    const navFuelPrices = document.getElementById('nav-fuel-prices');
    const actionReports = document.getElementById('action-reports');
    const actionExport = document.getElementById('action-export');
    const exportRequestsBtn = document.getElementById('export-requests-btn');
    const statsGrid = document.getElementById('stats-grid');
    const actionsHeader = document.getElementById('actions-header');
    const requestsActionsHeader = document.getElementById('requests-actions-header');

    if (currentRole === 'supervisor') {
        userRoleDisplay.textContent = `👨‍💼 Supervisor - ${currentDriverName}`;
        if (navVehicles) navVehicles.classList.remove('hidden');
        if (navReports) navReports.classList.remove('hidden');
        if (navFuelRecords) navFuelRecords.classList.remove('hidden');
        if (navFuelPrices) navFuelPrices.classList.remove('hidden');
        if (actionReports) actionReports.style.display = 'block';
        if (actionExport) actionExport.style.display = 'block';
        if (exportRequestsBtn) exportRequestsBtn.style.display = 'block';
        if (statsGrid) statsGrid.style.pointerEvents = 'auto';
        if (actionsHeader) actionsHeader.style.display = 'table-cell';
        if (requestsActionsHeader) requestsActionsHeader.style.display = 'table-cell';
    } else {
        userRoleDisplay.textContent = `🚛 Motorista - ${currentDriverName}`;
        if (navVehicles) navVehicles.classList.add('hidden');
        if (navReports) navReports.classList.add('hidden');
        if (navFuelRecords) navFuelRecords.classList.add('hidden');
        if (navFuelPrices) navFuelPrices.classList.add('hidden');
        if (actionReports) actionReports.style.display = 'none';
        if (actionExport) actionExport.style.display = 'none';
        if (exportRequestsBtn) exportRequestsBtn.style.display = 'none';
        if (statsGrid) statsGrid.style.pointerEvents = 'none';
        if (actionsHeader) actionsHeader.style.display = 'none';
        if (requestsActionsHeader) requestsActionsHeader.style.display = 'none';
    }
}

// ==================== FUNÇÕES DE REQUISIÇÕES ====================

async function createRequest() {
    const plate = document.getElementById('new-request-plate').value;
    const vehicleModel = document.getElementById('new-request-vehicle-model').value;
    const city = document.getElementById('new-request-city').value;
    const gasStation = document.getElementById('new-request-gas-station').value;
    const fuelType = document.getElementById('new-request-fuel-type').value;
    const km = document.getElementById('new-request-km').value;
    const fuelMethod = document.getElementById('new-request-fuel-method').value;
    const priority = document.getElementById('new-request-priority').value;
    const notes = document.getElementById('new-request-notes').value;

    if (!plate || !city || !gasStation || !fuelType || !km) {
        showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
        return;
    }

    // Calcular valor estimado baseado no preço do combustível
    let estimatedValue = 'A definir';
    if (fuelPrices[fuelType]) {
        const pricePerLiter = fuelPrices[fuelType].price;
        // Estimativa: tanque médio de 80 litros
        const estimatedLiters = fuelMethod === 'tanque' ? 80 : 20;
        const totalEstimated = pricePerLiter * estimatedLiters;
        estimatedValue = `R$ ${totalEstimated.toFixed(2)}`;
    }

    const newId = `REQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newRequest = {
        id: newId,
        driver: currentDriverName,
        plate: plate,
        vehicle: `${vehicleModel} - ${plate}`,
        city: city,
        gasStation: gasStation,
        fuelType: fuelType,
        fuelMethod: fuelMethod,
        status: 'pending',
        date: today,
        supervisor: 'Pendente',
        estimatedValue: estimatedValue,
        km: parseInt(km),
        priority: priority,
        notes: notes || 'Sem observações',
        createdAt: new Date().toISOString()
    };

    showLoading();
    const result = await postData('/requests', newRequest);
    hideLoading();

    if (result) {
        await loadAllData();
        closeModal('modal-new-request');
        clearForm('new-request');
        showNotification(`✅ Requisição ${newId} criada com sucesso!`, 'success');
    }
}

async function approveRequest(reqId) {
    if (currentRole !== 'supervisor') {
        showNotification('Apenas supervisores podem aprovar requisições!', 'error');
        return;
    }

    showLoading();
    const result = await updateData(`/requests/${reqId}`, {
        status: 'signed',
        supervisor: currentDriverName
    });
    hideLoading();

    if (result) {
        await loadAllData();
        showNotification(`✅ Requisição ${reqId} aprovada!`, 'success');
    }
}

async function rejectRequest(reqId) {
    if (currentRole !== 'supervisor') {
        showNotification('Apenas supervisores podem rejeitar requisições!', 'error');
        return;
    }

    showLoading();
    const result = await updateData(`/requests/${reqId}`, {
        status: 'rejected',
        supervisor: currentDriverName
    });
    hideLoading();

    if (result) {
        await loadAllData();
        showNotification(`⚠️ Requisição ${reqId} rejeitada!`, 'warning');
    }
}

async function completeFuelRecord(reqId) {
    const liters = prompt('Digite a quantidade de litros abastecida:');
    const pricePerLiter = prompt('Digite o preço por litro (R$):');

    if (liters && pricePerLiter) {
        const litersFloat = parseFloat(liters);
        const priceFloat = parseFloat(pricePerLiter);
        const totalValue = litersFloat * priceFloat;

        showLoading();

        // Atualizar fuel_record
        await updateData(`/fuel-records/${reqId}`, {
            liters: `${litersFloat.toFixed(2)} L`,
            pricePerLiter: priceFloat,
            realValue: `R$ ${totalValue.toFixed(2)}`,
            status: 'completed'
        });

        // Atualizar request
        await updateData(`/requests/${reqId}`, {
            status: 'completed',
            supervisor: currentDriverName,
            realValue: `R$ ${totalValue.toFixed(2)}`,
            pricePerLiter: priceFloat,
            liters: `${litersFloat.toFixed(2)} L`
        });

        hideLoading();

        await loadAllData();
        showNotification(`✅ Abastecimento ${reqId} registrado! Valor: R$ ${totalValue.toFixed(2)}`, 'success');
    }
}

async function editFuelRecord(reqId) {
    const fuelRecord = fuelRecords.find(record => record.requestId === reqId);
    if (!fuelRecord || fuelRecord.status !== 'completed') return;

    const currentLiters = fuelRecord.liters ? parseFloat(fuelRecord.liters.replace(' L', '')) : 0;
    const currentPrice = fuelRecord.pricePerLiter || 0;

    const liters = prompt(`Editar litros:\n(Atual: ${currentLiters.toFixed(2)} L)`, currentLiters);
    const pricePerLiter = prompt(`Editar preço/litro (R$):\n(Atual: R$ ${currentPrice.toFixed(2)})`, currentPrice);

    if (liters && pricePerLiter) {
        const litersFloat = parseFloat(liters);
        const priceFloat = parseFloat(pricePerLiter);
        const totalValue = litersFloat * priceFloat;

        showLoading();

        await updateData(`/fuel-records/${reqId}`, {
            liters: `${litersFloat.toFixed(2)} L`,
            pricePerLiter: priceFloat,
            realValue: `R$ ${totalValue.toFixed(2)}`,
            status: 'completed'
        });

        await updateData(`/requests/${reqId}`, {
            status: 'completed',
            supervisor: currentDriverName,
            realValue: `R$ ${totalValue.toFixed(2)}`,
            pricePerLiter: priceFloat,
            liters: `${litersFloat.toFixed(2)} L`
        });

        hideLoading();

        await loadAllData();
        showNotification(`✅ Registro ${reqId} atualizado! Novo valor: R$ ${totalValue.toFixed(2)}`, 'success');
    }
}

// ==================== FUNÇÕES DE VEÍCULOS ====================

function showNewVehicleModal() {
    if (currentRole !== 'supervisor') {
        showNotification('Apenas supervisores podem cadastrar veículos!', 'error');
        return;
    }

    // Limpar formulário
    document.getElementById('new-vehicle-plate').value = '';
    document.getElementById('new-vehicle-model').value = '';
    document.getElementById('new-vehicle-year').value = '';
    document.getElementById('new-vehicle-color').value = '';
    document.getElementById('new-vehicle-status').value = 'Ativo';
    document.getElementById('new-vehicle-km').value = '0';

    document.getElementById('modal-new-vehicle').classList.add('active');
}

async function createVehicle() {
    const plate = document.getElementById('new-vehicle-plate').value.toUpperCase();
    const model = document.getElementById('new-vehicle-model').value;
    const year = document.getElementById('new-vehicle-year').value;
    const color = document.getElementById('new-vehicle-color').value;
    const status = document.getElementById('new-vehicle-status').value;
    const km = document.getElementById('new-vehicle-km').value;

    if (!plate || !model) {
        showNotification('Por favor, preencha placa e modelo!', 'error');
        return;
    }

    // Verificar se a placa já existe
    const existingVehicle = vehicles.find(v => v.plate === plate);
    if (existingVehicle) {
        showNotification('Já existe um veículo com esta placa!', 'error');
        return;
    }

    const newVehicle = {
        plate: plate,
        model: model,
        year: year || 'N/A',
        status: status || 'Ativo',
        color: color || 'N/A',
        km: parseInt(km) || 0,
        lastFuel: 'Nunca'
    };

    showLoading();

    try {
        const response = await fetch(`${API_URL}/vehicles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newVehicle)
        });

        if (!response.ok) throw new Error('Erro ao cadastrar veículo');

        const result = await response.json();

        if (result.success) {
            await loadAllData();
            closeModal('modal-new-vehicle');
            showNotification(`✅ Veículo ${plate} cadastrado com sucesso!`, 'success');

            // Atualizar o select de placas no formulário de requisições
            updateVehiclePlatesSelect();
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao cadastrar veículo', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteVehicle(plate) {
    if (currentRole !== 'supervisor') {
        showNotification('Apenas supervisores podem excluir veículos!', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o veículo ${plate}?`)) {
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}/vehicles/${plate}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir veículo');

        const result = await response.json();

        if (result.success) {
            await loadAllData();
            showNotification(`✅ Veículo ${plate} excluído com sucesso!`, 'success');

            // Atualizar o select de placas no formulário de requisições
            updateVehiclePlatesSelect();
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao excluir veículo', 'error');
    } finally {
        hideLoading();
    }
}

// ==================== FUNÇÕES DE VISUALIZAÇÃO ====================

function loadRecentActivities() {
    const tbody = document.getElementById('recent-activities');
    if (!tbody) return;

    let recentRequests = requests.slice(0, 5);

    if (currentRole === 'motorista') {
        recentRequests = requests.filter(req => req.driver === currentDriverName).slice(0, 5);
    }

    if (recentRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 40px;">Nenhuma requisição encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = recentRequests.map(req => `
        <tr>
            <td><strong>${req.id}</strong></td>
            <td>${req.driver}</td>
            <td>${req.vehicle}</td>
            <td>${req.city || 'N/A'}</td>
            <td><span class="status-badge status-${req.status}">${getStatusText(req.status)}</span></td>
            <td>${formatDate(req.date)}</td>
            <td>${req.estimatedValue || 'N/A'}</td>
            <td>
                <button class="btn btn-small" onclick="viewRequest('${req.id}')">👁️</button>
                ${currentRole === 'supervisor' && req.status === 'pending' ? `
                    <button class="btn btn-small btn-success" onclick="approveRequest('${req.id}')">✅</button>
                    <button class="btn btn-small btn-danger" onclick="rejectRequest('${req.id}')">❌</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function loadAllRequests() {
    const tbody = document.getElementById('all-requests');
    if (!tbody) return;

    let filteredRequests = [...requests];

    if (currentRole === 'motorista') {
        filteredRequests = requests.filter(req => req.driver === currentDriverName);
    }

    if (filteredRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #64748b; padding: 40px;">Nenhuma requisição encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRequests.map(req => `
        <tr>
            <td><strong>${req.id}</strong></td>
            <td>${req.driver}</td>
            <td>${req.vehicle}</td>
            <td>${req.city || 'N/A'}</td>
            <td>${req.gasStation || 'N/A'}</td>
            <td>${req.fuelType || 'N/A'}</td>
            <td><span class="status-badge status-${req.status}">${getStatusText(req.status)}</span></td>
            <td>${formatDate(req.date)}</td>
            <td>${req.supervisor || 'N/A'}</td>
            <td>${req.estimatedValue || 'N/A'}</td>
            <td>${req.km ? req.km.toLocaleString() + ' km' : 'N/A'}</td>
            <td>
                <button class="btn btn-small" onclick="viewRequest('${req.id}')">👁️</button>
                ${currentRole === 'supervisor' && req.status === 'pending' ? `
                    <button class="btn btn-small btn-success" onclick="approveRequest('${req.id}')">✅</button>
                    <button class="btn btn-small btn-danger" onclick="rejectRequest('${req.id}')">❌</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function loadFuelRecords() {
    const tbody = document.getElementById('fuel-records-table');
    if (!tbody) {
        console.warn('Tabela fuel-records-table não encontrada');
        return;
    }

    if (!Array.isArray(fuelRecords)) {
        console.error('fuelRecords não é um array:', fuelRecords);
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #ef4444; padding: 40px;">Erro ao carregar registros</td></tr>';
        return;
    }

    if (fuelRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #64748b; padding: 40px;">Nenhum registro encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = fuelRecords.map(record => {
        const pricePerLiter = record.pricePerLiter ? `R$ ${parseFloat(record.pricePerLiter).toFixed(2)}` : 'N/A';
        const realValue = record.realValue || 'N/A';

        return `
        <tr>
            <td><strong>${record.requestId}</strong></td>
            <td>${record.driver}</td>
            <td>${record.vehicle}</td>
            <td>${record.gasStation}</td>
            <td>${record.fuelType}</td>
            <td>${record.estimatedValue}</td>
            <td>${pricePerLiter}</td>
            <td>${record.liters || 'N/A'}</td>
            <td><strong>${realValue}</strong></td>
            <td><span class="status-badge status-${record.status}">${getStatusText(record.status)}</span></td>
            <td>${formatDate(record.date)}</td>
            <td>
                <button class="btn btn-small" onclick="viewFuelRecord('${record.requestId}')">👁️</button>
                ${record.status === 'signed' ? `
                    <button class="btn btn-small btn-success" onclick="completeFuelRecord('${record.requestId}')">✅</button>
                ` : ''}
                ${record.status === 'completed' ? `
                    <button class="btn btn-small btn-warning" onclick="editFuelRecord('${record.requestId}')">✏️</button>
                ` : ''}
            </td>
        </tr>
    `;
    }).join('');

    console.log('✅ Fuel records carregados:', fuelRecords.length);
}

function loadFuelPrices() {
    const tbody = document.getElementById('fuel-prices-table');
    if (!tbody) {
        console.warn('Tabela fuel-prices-table não encontrada');
        return;
    }

    if (!fuelPrices || Object.keys(fuelPrices).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 40px;">Nenhum preço cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(fuelPrices).map(([fuelType, data]) => `
        <tr>
            <td><strong>${fuelType}</strong></td>
            <td id="price-display-${fuelType.replace(/\s+/g, '-')}">R$ ${parseFloat(data.price).toFixed(2)}</td>
            <td>${formatDate(data.lastUpdate)}</td>
            <td>
                ${currentRole === 'supervisor' ? `
                    <button class="btn btn-small btn-warning" onclick="editFuelPrice('${fuelType}', ${data.price})">✏️ Editar</button>
                ` : ''}
            </td>
        </tr>
    `).join('');

    console.log('✅ Fuel prices carregados:', Object.keys(fuelPrices).length);
}

function loadVehicles() {
    const tbody = document.getElementById('vehicles-table');
    if (!tbody) {
        console.warn('Tabela vehicles-table não encontrada');
        return;
    }

    if (!Array.isArray(vehicles)) {
        console.error('vehicles não é um array:', vehicles);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 40px;">Erro ao carregar veículos</td></tr>';
        return;
    }

    if (vehicles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 40px;">Nenhum veículo cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = vehicles.map(vehicle => `
        <tr>
            <td><strong>${vehicle.plate}</strong></td>
            <td>${vehicle.model}</td>
            <td>${vehicle.year}</td>
            <td><span class="status-badge ${vehicle.status === 'Ativo' ? 'status-signed' : vehicle.status === 'Manutenção' ? 'status-pending' : 'status-rejected'}">${vehicle.status}</span></td>
            <td>${vehicle.color}</td>
            <td>${parseInt(vehicle.km).toLocaleString()} km</td>
            <td>${vehicle.lastFuel}</td>
            <td>
                ${currentRole === 'supervisor' ? `
                    <button class="btn btn-small btn-danger" onclick="deleteVehicle('${vehicle.plate}')">🗑️</button>
                ` : ''}
            </td>
        </tr>
    `).join('');

    console.log('✅ Veículos carregados:', vehicles.length);
}

// ==================== NOVA FUNÇÃO: EDITAR PREÇO INDIVIDUAL ====================
async function editFuelPrice(fuelType, currentPrice) {
    const newPrice = prompt(`Editar preço de ${fuelType}:\n(Atual: R$ ${currentPrice.toFixed(2)})`, currentPrice.toFixed(2));

    if (newPrice === null) return; // Usuário cancelou

    const priceFloat = parseFloat(newPrice);

    if (isNaN(priceFloat) || priceFloat <= 0) {
        showNotification('Preço inválido!', 'error');
        return;
    }

    showLoading();

    const updatedPrices = {};
    updatedPrices[fuelType] = priceFloat;

    const result = await updateData('/fuel-prices', updatedPrices);
    hideLoading();

    if (result) {
        await loadAllData();
        showNotification(`✅ Preço de ${fuelType} atualizado para R$ ${priceFloat.toFixed(2)}!`, 'success');

        // Atualizar valores estimados das requisições pendentes
        await recalculateEstimatedValues(fuelType, priceFloat);
    }
}

// ==================== NOVA FUNÇÃO: RECALCULAR VALORES ESTIMADOS ====================
async function recalculateEstimatedValues(fuelType, newPrice) {
    // Buscar requisições pendentes com este tipo de combustível
    const pendingRequests = requests.filter(req =>
        req.fuelType === fuelType &&
        (req.status === 'pending' || req.status === 'signed')
    );

    if (pendingRequests.length === 0) return;

    showLoading();

    for (const req of pendingRequests) {
        // Estimativa: tanque médio de 80 litros ou galão de 20 litros
        const estimatedLiters = req.fuelMethod === 'tanque' ? 80 : 20;
        const totalEstimated = newPrice * estimatedLiters;
        const newEstimatedValue = `R$ ${totalEstimated.toFixed(2)}`;

        // Atualizar apenas o valor estimado
        await updateData(`/requests/${req.id}`, {
            status: req.status,
            supervisor: req.supervisor,
            estimatedValue: newEstimatedValue
        });
    }

    hideLoading();
    await loadAllData();

    showNotification(`📊 ${pendingRequests.length} requisição(ões) tiveram o valor estimado recalculado!`, 'success');
}

function showUpdatePricesModal() {
    const form = document.getElementById('fuel-prices-form');
    if (!form) return;

    if (!fuelPrices || Object.keys(fuelPrices).length === 0) {
        showNotification('Nenhum preço cadastrado ainda', 'warning');
        return;
    }

    form.innerHTML = Object.entries(fuelPrices).map(([fuelType, data]) => `
        <div class="form-group">
            <label>${fuelType}:</label>
            <input type="number" step="0.01" id="price-${fuelType.replace(/\s+/g, '-')}" value="${data.price}" placeholder="Preço por litro">
        </div>
    `).join('');

    document.getElementById('modal-update-prices').classList.add('active');
}

async function updateFuelPrices() {
    const updatedPrices = {};
    let hasChanges = false;

    Object.keys(fuelPrices).forEach(fuelType => {
        const input = document.getElementById(`price-${fuelType.replace(/\s+/g, '-')}`);
        if (input && input.value) {
            const newPrice = parseFloat(input.value);
            if (newPrice !== fuelPrices[fuelType].price) {
                updatedPrices[fuelType] = newPrice;
                hasChanges = true;
            }
        }
    });

    if (!hasChanges) {
        showNotification('Nenhum preço foi alterado', 'warning');
        return;
    }

    showLoading();
    const result = await updateData('/fuel-prices', updatedPrices);
    hideLoading();

    if (result) {
        await loadAllData();
        closeModal('modal-update-prices');
        showNotification('✅ Preços atualizados!', 'success');

        // Recalcular valores estimados para cada combustível alterado
        for (const [fuelType, newPrice] of Object.entries(updatedPrices)) {
            await recalculateEstimatedValues(fuelType, newPrice);
        }
    }
}

function generateReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const driver = document.getElementById('report-driver').value;
    const status = document.getElementById('report-status').value;

    let filteredRequests = [...requests];

    if (startDate) {
        filteredRequests = filteredRequests.filter(req => req.date >= startDate);
    }
    if (endDate) {
        filteredRequests = filteredRequests.filter(req => req.date <= endDate);
    }
    if (driver) {
        filteredRequests = filteredRequests.filter(req => req.driver === driver);
    }
    if (status) {
        filteredRequests = filteredRequests.filter(req => req.status === status);
    }

    document.getElementById('report-total').textContent = filteredRequests.length;
    document.getElementById('report-approved').textContent = filteredRequests.filter(req => req.status === 'signed').length;
    document.getElementById('report-fueled').textContent = filteredRequests.filter(req => req.status === 'fueled').length;
    document.getElementById('report-completed').textContent = filteredRequests.filter(req => req.status === 'completed').length;

    const tbody = document.getElementById('reports-table');
    if (filteredRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 40px;">Nenhuma requisição encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRequests.map(req => `
        <tr>
            <td><strong>${req.id}</strong></td>
            <td>${req.driver}</td>
            <td>${req.vehicle}</td>
            <td>${req.city || 'N/A'}</td>
            <td>${req.fuelType || 'N/A'}</td>
            <td><span class="status-badge status-${req.status}">${getStatusText(req.status)}</span></td>
            <td>${formatDate(req.date)}</td>
            <td>${req.estimatedValue || 'N/A'}</td>
        </tr>
    `).join('');

    showNotification('✅ Relatório gerado!', 'success');
}

function loadReportFilters() {
    const driverSelect = document.getElementById('report-driver');
    if (!driverSelect) return;

    driverSelect.innerHTML = '<option value="">Todos os motoristas</option>';

    const uniqueDrivers = [...new Set(requests.map(req => req.driver))];
    uniqueDrivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver;
        option.textContent = driver;
        driverSelect.appendChild(option);
    });
}

// ==================== EXPORTAÇÃO EXCEL ====================

function exportToExcel(type) {
    try {
        let data = [];
        let fileName = '';

        switch(type) {
            case 'requests':
                data = requests.map(req => ({
                    'ID': req.id,
                    'Motorista': req.driver,
                    'Veículo': req.vehicle,
                    'Cidade': req.city,
                    'Posto': req.gasStation,
                    'Combustível': req.fuelType,
                    'Status': getStatusText(req.status),
                    'Data': formatDate(req.date),
                    'Supervisor': req.supervisor,
                    'Valor Estimado': req.estimatedValue,
                    'Preço por Litro': req.pricePerLiter ? `R$ ${req.pricePerLiter.toFixed(2)}` : 'N/A',
                    'Litros': req.liters || 'N/A',
                    'Valor Real': req.realValue || 'N/A',
                    'KM': req.km,
                    'Prioridade': req.priority,
                    'Observações': req.notes
                }));
                fileName = 'requisicoes_abastecimento.xlsx';
                break;

            case 'fuel-records':
                data = fuelRecords.map(record => ({
                    'ID Requisição': record.requestId,
                    'Motorista': record.driver,
                    'Veículo': record.vehicle,
                    'Posto': record.gasStation,
                    'Combustível': record.fuelType,
                    'Valor Estimado': record.estimatedValue,
                    'Preço por Litro': record.pricePerLiter ? `R$ ${record.pricePerLiter.toFixed(2)}` : 'N/A',
                    'Litros': record.liters || 'N/A',
                    'Valor Real': record.realValue || 'N/A',
                    'Status': getStatusText(record.status),
                    'Data': formatDate(record.date),
                    'Observações': record.notes
                }));
                fileName = 'registros_abastecimento.xlsx';
                break;

            case 'vehicles':
                data = vehicles.map(vehicle => ({
                    'Placa': vehicle.plate,
                    'Modelo': vehicle.model,
                    'Ano': vehicle.year,
                    'Status': vehicle.status,
                    'Cor': vehicle.color,
                    'KM': vehicle.km,
                    'Último Abastecimento': vehicle.lastFuel
                }));
                fileName = 'frota_veiculos.xlsx';
                break;

            case 'all':
                const wb = XLSX.utils.book_new();

                const requestsData = requests.map(req => ({
                    'ID': req.id,
                    'Motorista': req.driver,
                    'Veículo': req.vehicle,
                    'Cidade': req.city,
                    'Posto': req.gasStation,
                    'Combustível': req.fuelType,
                    'Status': getStatusText(req.status),
                    'Data': formatDate(req.date),
                    'Supervisor': req.supervisor,
                    'Valor Estimado': req.estimatedValue,
                    'Preço por Litro': req.pricePerLiter ? `R$ ${req.pricePerLiter.toFixed(2)}` : 'N/A',
                    'Litros': req.liters || 'N/A',
                    'Valor Real': req.realValue || 'N/A',
                    'KM': req.km,
                    'Prioridade': req.priority,
                    'Observações': req.notes
                }));
                const ws1 = XLSX.utils.json_to_sheet(requestsData);
                XLSX.utils.book_append_sheet(wb, ws1, 'Requisições');

                const recordsData = fuelRecords.map(record => ({
                    'ID Requisição': record.requestId,
                    'Motorista': record.driver,
                    'Veículo': record.vehicle,
                    'Posto': record.gasStation,
                    'Combustível': record.fuelType,
                    'Valor Estimado': record.estimatedValue,
                    'Preço por Litro': record.pricePerLiter ? `R$ ${record.pricePerLiter.toFixed(2)}` : 'N/A',
                    'Litros': record.liters || 'N/A',
                    'Valor Real': record.realValue || 'N/A',
                    'Status': getStatusText(record.status),
                    'Data': formatDate(record.date)
                }));
                const ws2 = XLSX.utils.json_to_sheet(recordsData);
                XLSX.utils.book_append_sheet(wb, ws2, 'Registros Abastecimento');

                const vehiclesData = vehicles.map(vehicle => ({
                    'Placa': vehicle.plate,
                    'Modelo': vehicle.model,
                    'Ano': vehicle.year,
                    'Status': vehicle.status,
                    'Cor': vehicle.color,
                    'KM': vehicle.km,
                    'Último Abastecimento': vehicle.lastFuel
                }));
                const ws3 = XLSX.utils.json_to_sheet(vehiclesData);
                XLSX.utils.book_append_sheet(wb, ws3, 'Veículos');

                XLSX.writeFile(wb, 'sistema_abastecimento_completo.xlsx');
                showNotification('✅ Exportação completa realizada!', 'success');
                return;

            default:
                showNotification('Tipo de exportação não reconhecido!', 'error');
                return;
        }

        if (type !== 'all') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Dados');
            XLSX.writeFile(wb, fileName);
            showNotification(`✅ Exportado: ${fileName}`, 'success');
        }

    } catch (error) {
        console.error('Erro na exportação:', error);
        showNotification('Erro ao exportar!', 'error');
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

function updateCurrentDate() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = dateStr;
    }
}

function showScreen(screenId) {
    if (currentRole === 'motorista' && ['vehicles', 'reports', 'fuel-records', 'fuel-prices'].includes(screenId)) {
        showNotification('Acesso negado!', 'error');
        return;
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const screenElement = document.getElementById(screenId);
    if (screenElement) {
        screenElement.classList.add('active');
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.textContent.includes(getScreenName(screenId))) {
            item.classList.add('active');
        }
    });

    // Carregar dados específicos da tela
    console.log(`📺 Mudando para tela: ${screenId}`);

    switch(screenId) {
        case 'requests':
            loadAllRequests();
            break;
        case 'fuel-records':
            console.log('📄 Carregando fuel-records...');
            loadFuelRecords();
            break;
        case 'fuel-prices':
            console.log('📄 Carregando fuel-prices...');
            loadFuelPrices();
            break;
        case 'vehicles':
            console.log('📄 Carregando vehicles...');
            loadVehicles();
            break;
        case 'reports':
            loadReportFilters();
            generateReport();
            break;
    }
}

function getScreenName(screenId) {
    const screenNames = {
        'dashboard': '📊',
        'requests': '📋',
        'fuel-records': '⛽',
        'fuel-prices': '💰',
        'vehicles': '🚚',
        'reports': '📈'
    };
    return screenNames[screenId] || '';
}

function populateSelects() {
    // Popular cidade
    const citySelects = ['new-request-city'];
    citySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Selecione uma cidade</option>';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                select.appendChild(option);
            });
        }
    });

    // Popular postos
    const stationSelects = ['new-request-gas-station'];
    stationSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Selecione um posto</option>';
            gasStations.forEach(station => {
                const option = document.createElement('option');
                option.value = station;
                option.textContent = station;
                select.appendChild(option);
            });
        }
    });

    // Popular combustíveis
    const fuelSelects = ['new-request-fuel-type'];
    fuelSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Selecione o combustível</option>';
            fuelTypes.forEach(fuel => {
                const option = document.createElement('option');
                option.value = fuel;
                option.textContent = fuel;
                select.appendChild(option);
            });
        }
    });

    updateVehiclePlatesSelect();
    updateDriverName();
}

function updateVehiclePlatesSelect() {
    const plateSelect = document.getElementById('new-request-plate');
    if (!plateSelect) return;

    plateSelect.innerHTML = '<option value="">Selecione uma placa</option>';

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
        console.warn('Nenhum veículo disponível para popular select');
        return;
    }

    // Filtrar apenas veículos ativos para requisições
    const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'Ativo');

    activeVehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.plate;
        option.textContent = vehicle.plate;
        option.setAttribute('data-model', vehicle.model);
        plateSelect.appendChild(option);
    });

    console.log(`✅ ${activeVehicles.length} placas ativas adicionadas ao select`);
}

function updateDriverName() {
    const driverInput = document.getElementById('new-request-driver');
    if (driverInput) {
        driverInput.value = currentDriverName;
    }
}

function updateVehicleModel() {
    const plateSelect = document.getElementById('new-request-plate');
    const modelInput = document.getElementById('new-request-vehicle-model');

    if (plateSelect && modelInput) {
        const selectedOption = plateSelect.options[plateSelect.selectedIndex];
        if (selectedOption && selectedOption.getAttribute('data-model')) {
            modelInput.value = selectedOption.getAttribute('data-model');
        } else {
            modelInput.value = '';
        }
    }
}

function updateStats() {
    let filteredRequests = requests;

    if (currentRole === 'motorista') {
        filteredRequests = requests.filter(req => req.driver === currentDriverName);
    }

    const stats = {
        pending: filteredRequests.filter(req => req.status === 'pending').length,
        signed: filteredRequests.filter(req => req.status === 'signed').length,
        fueled: filteredRequests.filter(req => req.status === 'fueled').length,
        completed: filteredRequests.filter(req => req.status === 'completed').length
    };

    const statPending = document.getElementById('stat-pending');
    const statSigned = document.getElementById('stat-signed');
    const statFueled = document.getElementById('stat-fueled');
    const statCompleted = document.getElementById('stat-completed');

    if (statPending) statPending.textContent = stats.pending;
    if (statSigned) statSigned.textContent = stats.signed;
    if (statFueled) statFueled.textContent = stats.fueled;
    if (statCompleted) statCompleted.textContent = stats.completed;
}

function newRequest() {
    updateDriverName();
    document.getElementById('modal-new-request').classList.add('active');
}

function viewRequest(reqId) {
    const request = requests.find(req => req.id === reqId);
    if (!request) return;

    const priorityText = {
        'normal': 'Normal',
        'urgent': 'Urgente',
        'emergency': 'Emergência'
    };

    const fuelMethodText = {
        'tanque': 'Tanque Completo',
        'galao': 'Galão'
    };

    const realValueInfo = request.realValue ? `💰 Valor Real: ${request.realValue}\n` : '';
    const litersInfo = request.liters ? `⛽ Litros: ${request.liters}\n` : '';
    const priceInfo = request.pricePerLiter ? `💵 Preço/Litro: R$ ${request.pricePerLiter.toFixed(2)}\n` : '';

    alert(`
📋 DETALHES DA REQUISIÇÃO ${reqId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Motorista: ${request.driver}
🚚 Veículo: ${request.vehicle}
🏙️ Cidade: ${request.city || 'N/A'}
⛽ Posto: ${request.gasStation || 'N/A'}
🛢️ Combustível: ${request.fuelType || 'N/A'}
🔧 Tipo: ${fuelMethodText[request.fuelMethod] || 'N/A'}
📅 Data: ${formatDate(request.date)}
👨‍💼 Supervisor: ${request.supervisor}
💰 Valor Estimado: ${request.estimatedValue || 'N/A'}
${priceInfo}${litersInfo}${realValueInfo}🛣️ KM: ${request.km ? request.km.toLocaleString() + ' km' : 'N/A'}
⚡ Prioridade: ${priorityText[request.priority] || 'N/A'}
📊 Status: ${getStatusText(request.status)}
📝 Observações: ${request.notes}
    `);
}

function viewFuelRecord(reqId) {
    const record = fuelRecords.find(record => record.requestId === reqId);
    if (!record) return;

    const priceInfo = record.pricePerLiter ? `💵 Preço/Litro: R$ ${record.pricePerLiter.toFixed(2)}\n` : '';
    const litersInfo = record.liters ? `⛽ Litros: ${record.liters}\n` : '';
    const realValueInfo = record.realValue ? `💰 Valor Real: ${record.realValue}\n` : '';

    alert(`
⛽ REGISTRO DE ABASTECIMENTO ${reqId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Motorista: ${record.driver}
🚚 Veículo: ${record.vehicle}
⛽ Posto: ${record.gasStation}
🛢️ Combustível: ${record.fuelType}
💰 Valor Estimado: ${record.estimatedValue}
${priceInfo}${litersInfo}${realValueInfo}📊 Status: ${getStatusText(record.status)}
📅 Data: ${formatDate(record.date)}
${record.notes ? `📝 Observações: ${record.notes}` : ''}
    `);
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'signed': 'Aprovado',
        'rejected': 'Rejeitado',
        'fueled': 'Abastecido',
        'completed': 'Completo'
    };
    return statusMap[status] || status;
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === 'Nunca') return 'Nunca';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateStr;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function clearForm(prefix) {
    const inputs = document.querySelectorAll(`[id^="${prefix}"]`);
    inputs.forEach(input => {
        if (input.type === 'text' || input.type === 'number' || input.type === 'email' || input.tagName === 'TEXTAREA') {
            input.value = '';
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        }
    });
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function filterByStatus(status) {
    if (currentRole === 'motorista') {
        showNotification('Filtros disponíveis apenas para supervisores', 'warning');
        return;
    }
    showScreen('requests');
    showNotification(`Filtrando por: ${getStatusText(status)}`, 'success');
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema Rezende Energia SQLite - Iniciando...');

    setTimeout(() => {
        if (!isLoggedIn) {
            showNotification('🌐 Sistema pronto! Faça login para começar.', 'success');
        }
    }, 1000);
});

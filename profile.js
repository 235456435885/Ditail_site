// profile.js - Версия с загрузкой аватара

const API_URL = 'http://localhost:3000'; // Убрал /api, т.к. /uploads - в корне

document.addEventListener('DOMContentLoaded', function() {
    if (getCookie('userLoggedIn') !== 'true') {
        window.location.href = 'auth.html';
        return;
    }
    initializeProfilePage();
});

function initializeProfilePage() {
    console.log('Инициализация логики страницы профиля...');
    loadUserProfileData();
    initializeSideNavigation();
    initializeEditMode();
    initializeAvatarUpload(); // Эта функция теперь будет основной
    initializeOrdersFeature();
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

// ИЗМЕНЕНО: теперь функция загружает и аватар
function loadUserProfileData() {
    const userName = getCookie('userName') || 'Пользователь';
    const userEmail = getCookie('userEmail') || 'email@example.com';
    const userAvatar = getCookie('userAvatar');

    document.getElementById('usernameDisplay').textContent = userName;
    document.getElementById('profileUserEmail').textContent = userEmail;

    const avatarImg = document.getElementById('avatarImg');
    if (userAvatar) {
        avatarImg.src = `${API_URL}/${userAvatar.replace(/\\/g, '/')}`;
    } else {
        avatarImg.src = 'картинки/аватары/default-avatar.png';
    }

    const nameParts = userName.split(' ');
    document.getElementById('firstName').value = nameParts[0] || '';
    document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
    document.getElementById('email').value = userEmail;
}

// ИЗМЕНЕНО: Логика загрузки аватара
async function initializeAvatarUpload() {
    const avatarUploadBtn = document.getElementById('avatarUpload');
    const avatarInput = document.getElementById('avatarInput');
    const avatarImg = document.getElementById('avatarImg');
    
    avatarUploadBtn.addEventListener('click', () => avatarInput.click());
    
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Создаем FormData для отправки файла
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const userEmail = getCookie('userEmail'); // Получаем email из cookie
            if (!userEmail) {
                alert('Ошибка: не удалось определить пользователя. Пожалуйста, войдите снова.');
                return;
            }
            // Вставляем email прямо в URL
            const response = await fetch(`${API_URL}/api/avatar/upload/${userEmail}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Не удалось загрузить файл.');
            }

            // Успешная загрузка
            const newAvatarPath = data.filePath;
            avatarImg.src = `${API_URL}/${newAvatarPath.replace(/\\/g, '/')}`;

            // Обновляем cookie
            document.cookie = `userAvatar=${encodeURIComponent(newAvatarPath)}; path=/; max-age=86400`;
            alert('Аватар успешно обновлен!');

            // Обновляем аватар в шапке (если он там есть)
            const headerAvatar = document.querySelector('.user-profile-widget .avatar img');
            if (headerAvatar) {
                headerAvatar.src = `${API_URL}/${newAvatarPath.replace(/\\/g, '/')}`;
            }

        } catch (error) {
            console.error('Ошибка при загрузке аватара:', error);
            alert(`Ошибка: ${error.message}`);
        }
    });
}


// --- Остальной код profile.js без изменений ---
function initializeSideNavigation() { /* ... ваш код ... */ }
function initializeEditMode() { /* ... ваш код ... */ }
async function initializeOrdersFeature() { /* ... ваш код ... */ }
// ... и так далее
// (Скопируйте оставшиеся функции initializeSideNavigation, initializeEditMode, fetchOrders, renderOrders, initializeOrdersFeature из вашей рабочей версии)

function initializeSideNavigation() {
    const navItems = document.querySelectorAll('.profile-nav .nav-item');
    const tabContents = document.querySelectorAll('.profile-content .tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = item.getAttribute('data-tab');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            item.classList.add('active');
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}
function initializeEditMode() {
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const form = document.getElementById('personalDataForm');
    const formActions = document.getElementById('formActions');
    const inputs = form.querySelectorAll('input, select');
    
    const toggleEditMode = (isEditing) => {
        inputs.forEach(input => {
            if (input.id !== 'email') { // Email редактировать нельзя
                input.readOnly = !isEditing;
                input.disabled = !isEditing;
            }
        });
        editBtn.style.display = isEditing ? 'none' : 'block';
        formActions.style.display = isEditing ? 'flex' : 'none';
    };

    editBtn.addEventListener('click', () => toggleEditMode(true));
    
    cancelBtn.addEventListener('click', () => {
        toggleEditMode(false);
        loadUserProfileData(); // Возвращаем исходные данные
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newFullName = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`.trim();
        
        // В будущем здесь будет запрос к API для обновления данных в БД
        // А пока просто обновляем cookie
        document.cookie = `userName=${encodeURIComponent(newFullName)}; path=/; max-age=86400`;
        
        alert('Данные успешно сохранены!');
        toggleEditMode(false);
        loadUserProfileData(); // Обновляем отображение имени
    });
}
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/api/orders`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        // Сервер теперь всегда возвращает массив, так что дополнительная проверка не нужна
        return data || [];
    } catch (error) {
        console.error('Не удалось получить заказы:', error);
        const container = document.getElementById('ordersListContainer');
        if (container) container.innerHTML = `<p style="color:red; text-align:center;">Ошибка загрузки заказов. Убедитесь, что бэкенд запущен.</p>`;
        return [];
    }
}
function renderOrders(ordersToRender) {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;
    if (!ordersToRender || ordersToRender.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #aaa;">У вас пока нет заказов.</p>`;
        return;
    }

    container.innerHTML = ordersToRender.map(order => {
        let itemsArray = [];
        // Более надежная проверка перед парсингом JSON
        if (order.items && typeof order.items === 'string') {
            try {
                itemsArray = JSON.parse(order.items);
            } catch (e) {
                console.error(`Ошибка парсинга JSON для заказа №${order.id}:`, e);
                itemsArray = [];
            }
        } else if (Array.isArray(order.items)) {
            itemsArray = order.items;
        }

        const statusInfo = {
            delivered: { text: 'Доставлен', class: 'status-delivered' },
            processing: { text: 'В обработке', class: 'status-processing' },
            shipped: { text: 'Отправлен', class: 'status-shipped' },
            cancelled: { text: 'Отменен', class: 'status-cancelled' }
        };
        const currentStatus = statusInfo[order.status] || { text: 'Неизвестно', class: '' };

        const actionButtons = `
            <div class="order-actions">
                <button class="btn btn-outline btn-repeat-order" data-order-id="${order.id}">Повторить</button>
                ${order.status === 'processing' ? `<button class="btn btn-danger btn-cancel-order" data-order-id="${order.id}">Отменить</button>` : ''}
                ${order.status === 'delivered' || order.status === 'cancelled' ? `<button class="btn btn-secondary btn-hide-order" data-order-id="${order.id}">Удалить</button>` : ''}
            </div>
        `;

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-number">Заказ №${order.id}</div>
                    <div class="order-date">${new Date(order.date).toLocaleDateString('ru-RU')}</div>
                    <div class="order-status ${currentStatus.class}">${currentStatus.text}</div>
                </div>
                <div class="order-items">
                    ${itemsArray.map(item => `
                        <div class="order-item">
                            <img src="${item.img ? item.img.replace(/\\/g, '/') : 'placeholder.jpg'}" alt="${item.name}">
                            <div class="item-info"><h4>${item.name}</h4><p>Количество: ${item.quantity} шт.</p></div>
                            <div class="item-price">${(item.price * item.quantity).toFixed(2)} ₽</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <span>Итого: ${parseFloat(order.total).toFixed(2)} ₽</span>
                    ${actionButtons}
                </div>
            </div>`;
    }).join('');
}
async function initializeOrdersFeature() {
    const filter = document.getElementById('orderStatusFilter');
    const container = document.getElementById('ordersListContainer');
    let allOrders = [];

    const refreshOrders = async () => {
        showLoading(container, true);
        allOrders = await fetchOrders();
        showLoading(container, false);
        const selectedStatus = filter.value;
        const filtered = selectedStatus === 'all' ? allOrders : allOrders.filter(o => o.status === selectedStatus);
        renderOrders(filtered);
    };

    await refreshOrders();

    filter.addEventListener('change', () => {
        const selectedStatus = filter.value;
        const filtered = selectedStatus === 'all' ? allOrders : allOrders.filter(o => o.status === selectedStatus);
        renderOrders(filtered);
    });

    container.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const orderId = target.dataset.orderId;

        if (target.classList.contains('btn-repeat-order')) {
            if(!confirm(`Повторить заказ №${orderId}? Будет создан новый заказ с теми же товарами.`)) return;
            try {
                const response = await fetch(`${API_URL}/api/orders/${orderId}/repeat`, { method: 'POST' });
                if (!response.ok) throw new Error('Не удалось повторить заказ.');
                const result = await response.json();
                alert(`Заказ успешно повторен! Новый номер заказа: ${result.newOrderId}`);
                await refreshOrders();
            } catch (error) {
                alert(`Ошибка: ${error.message}`);
            }
        }
        
        if (target.classList.contains('btn-cancel-order')) {
            if (!confirm(`Вы уверены, что хотите отменить заказ №${orderId}?`)) return;
            try {
                const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, { method: 'PUT' });
                if (!response.ok) throw new Error('Не удалось отменить заказ.');
                alert('Заказ успешно отменен.');
                await refreshOrders();
            } catch (error) {
                alert(`Ошибка: ${error.message}`);
            }
        }

        if (target.classList.contains('btn-hide-order')) {
            if (!confirm(`Вы уверены, что хотите удалить заказ №${orderId} из истории? Это действие нельзя будет отменить.`)) return;
            try {
                const response = await fetch(`${API_URL}/api/orders/${orderId}/hide`, { method: 'PUT' });
                if (!response.ok) throw new Error('Не удалось удалить заказ из истории.');
                alert('Заказ удален из истории.');
                await refreshOrders();
            } catch (error) {
                alert(`Ошибка: ${error.message}`);
            }
        }
    });
}
function showLoading(container, isLoading) {
    if (isLoading) {
        container.innerHTML = `<p style="text-align: center; color: #aaa; padding: 2rem;">Загрузка заказов...</p>`;
    }
}
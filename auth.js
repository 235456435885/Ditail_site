// auth.js - ИСПРАВЛЕННАЯ И УПРОЩЕННАЯ ВЕРСИЯ
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';

    // --- Элементы страницы ---
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageContainer = document.getElementById('messageContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // --- 1. Инициализация переключения вкладок ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetFormId = tab.dataset.tab + 'Form';

            // Переключаем активные классы у вкладок и форм
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            forms.forEach(f => f.classList.remove('active'));
            document.getElementById(targetFormId).classList.add('active');

            // Сбрасываем сообщения
            clearMessages();
        });
    });

    // --- 2. Обработчики отправки форм ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // --- 3. Логика функций ---

    function showMessage(message, type = 'success') {
        const messageClass = type === 'error' ? 'error' : 'success';
        messageContainer.innerHTML = `<div class="message ${messageClass}">${message}</div>`;
    }

    function clearMessages() {
        messageContainer.innerHTML = '';
    }

    function showLoading(isLoading) {
        loadingIndicator.classList.toggle('show', isLoading);
    }
    
    function setFormDisabled(form, isDisabled) {
        const button = form.querySelector('button[type="submit"]');
        if (button) button.disabled = isDisabled;
    }

    async function handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;

        if (!email || !password) {
            return showMessage('Пожалуйста, заполните все поля.', 'error');
        }

        clearMessages();
        showLoading(true);
        setFormDisabled(form, true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Ошибка входа');
            
            // Успех
            showMessage('Успешный вход! Перенаправляем...', 'success');
            document.cookie = `userLoggedIn=true; path=/; max-age=86400`;
            document.cookie = `userName=${encodeURIComponent(data.username)}; path=/; max-age=86400`;
            document.cookie = `userEmail=${encodeURIComponent(data.email)}; path=/; max-age=86400`;

            if (data.avatarUrl) {
                document.cookie = `userAvatar=${encodeURIComponent(data.avatarUrl)}; path=/; max-age=86400`;
            }
            
            setTimeout(() => window.location.href = 'profile.html', 1500);

        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            showLoading(false);
            setFormDisabled(form, false);
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        const form = event.target;
        const username = form.querySelector('#registerUsername').value;
        const email = form.querySelector('#registerEmail').value;
        const password = form.querySelector('#registerPassword').value;
        const confirmPassword = form.querySelector('#confirmPassword').value;

        if (password.length < 6) {
             return showMessage('Пароль должен быть не менее 6 символов.', 'error');
        }
        if (password !== confirmPassword) {
            return showMessage('Пароли не совпадают.', 'error');
        }

        clearMessages();
        showLoading(true);
        setFormDisabled(form, true);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Ошибка регистрации');

            // Успех
            showMessage(data.message, 'success');
            form.reset();

        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            showLoading(false);
            setFormDisabled(form, false);
        }
    }
});
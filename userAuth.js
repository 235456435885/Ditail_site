// userAuth.js - УНИВЕРСАЛЬНАЯ ВЕРСИЯ

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://localhost:3000';

    // --- Утилиты для работы с cookie ---
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // --- Логика выхода из аккаунта ---
    function handleLogout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            deleteCookie('userLoggedIn');
            deleteCookie('userName');
            deleteCookie('userEmail');
            deleteCookie('userAvatar');
            window.location.href = 'auth.html';
        }
    }
    
    // --- Логика отображения виджета ---
    function checkUserAuthentication() {
        const isLoggedIn = getCookie('userLoggedIn') === 'true';
        const loginElement = document.querySelector('.account-login');

        if (!loginElement) return; // Если элемента для входа нет, ничего не делаем

        if (isLoggedIn) {
            const userName = getCookie('userName') || 'Пользователь';
            const userEmail = getCookie('userEmail') || 'email@example.com';
            const userAvatar = getCookie('userAvatar');
            
            let avatarHTML;
            if (userAvatar) {
                const avatarSrc = `${API_URL}/${userAvatar.replace(/\\/g, '/')}`;
                avatarHTML = `<img src="${avatarSrc}" alt="Аватар ${userName}">`;
            } else {
                avatarHTML = `<span class="user-initial">${userName.charAt(0).toUpperCase()}</span>`;
            }

            const userProfile = document.createElement('div');
            userProfile.className = 'user-profile';
            userProfile.innerHTML = `
                <div class="user-avatar">
                    ${avatarHTML}
                </div>
                <div class="user-dropdown">
                    <div class="user-info">
                        <div class="user-name">${userName}</div>
                        <div class="user-email">${userEmail}</div>
                    </div>
                    <hr class="dropdown-divider">
                    <a href="profile.html" class="dropdown-item"><span>👤</span>Профиль</a>
                    <a href="profile.html#orders" class="dropdown-item"><span>📦</span>Мои заказы</a>
                    <hr class="dropdown-divider">
                    <a href="#" class="dropdown-item logout"><span>🚪</span>Выйти</a>
                </div>`;
            
            loginElement.parentNode.replaceChild(userProfile, loginElement);
            
            // --- Обработчики для нового виджета ---
            const avatarDiv = userProfile.querySelector('.user-avatar');
            const dropdown = userProfile.querySelector('.user-dropdown');
            const logoutBtn = userProfile.querySelector('.logout');

            avatarDiv.addEventListener('click', () => dropdown.classList.toggle('show'));
            logoutBtn.addEventListener('click', handleLogout);

            document.addEventListener('click', (e) => {
                if (!userProfile.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });

        } else {
            // Если пользователь не вошел, убедимся, что ссылка ведет на auth.html
            loginElement.innerHTML = `<a href="auth.html" class="login-link">Вход в аккаунт</a>`;
        }
    }

    // Запускаем проверку
    checkUserAuthentication();
});
document.addEventListener('DOMContentLoaded', () => {
    // --- Поиск ---
    const searchToggleBtn = document.getElementById('searchToggle');
    const searchCloseBtn = document.getElementById('searchClose');
    const headerWrapper = document.querySelector('.header__wrapper');
    const searchInput = document.querySelector('.search-expanded__input');

    searchToggleBtn.addEventListener('click', () => {
        headerWrapper.classList.add('search-active');
        searchInput.setAttribute('aria-hidden', 'false');
        searchInput.focus();
    });

    searchCloseBtn.addEventListener('click', () => {
        headerWrapper.classList.remove('search-active');
        searchInput.value = '';
        searchInput.setAttribute('aria-hidden', 'true');
        searchToggleBtn.focus();
    });

    // --- Меню с подменю ---
    const submenuLinks = document.querySelectorAll(".dropdown-content .has-submenu");

    submenuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            const parentLi = link.parentElement;
            const isOpen = parentLi.classList.contains("open");

            submenuLinks.forEach(otherLink => {
                otherLink.parentElement.classList.remove("open");
            });

            if (!isOpen) {
                parentLi.classList.add("open");
            }
        });
    });

    const catalogDropdown = document.querySelector('.dropdown');
    if (catalogDropdown) {
        catalogDropdown.addEventListener('mouseleave', () => {
            submenuLinks.forEach(link => {
                link.parentElement.classList.remove("open");
            });
        });
    }

    // --- Карусель ---
    const track = document.querySelector('.promo-carousel__track');
    const prevBtn = document.querySelector('.promo-carousel__btn--prev');
    const nextBtn = document.querySelector('.promo-carousel__btn--next');

    if (track && prevBtn && nextBtn) {
        let position = 0;
        const items = track.querySelectorAll('li');
        if (items.length === 0) return;

        const gap = 16; // должен совпадать с CSS gap
        const itemWidth = items[0].offsetWidth + gap;
        const visibleCount = 3;

        const maxScroll = -(itemWidth * (items.length - visibleCount));

        prevBtn.addEventListener('click', () => {
            position += itemWidth;
            if (position > 0) position = 0;
            track.style.transform = `translateX(${position}px)`;
            track.style.transition = 'transform 0.4s ease';
        });

        nextBtn.addEventListener('click', () => {
            position -= itemWidth;
            if (position < maxScroll) position = maxScroll;
            track.style.transform = `translateX(${position}px)`;
            track.style.transition = 'transform 0.4s ease';
        });
    }
});

    // --- Поддержка: переключение вкладок ---
    const supportTabs = document.querySelectorAll('.tab-content');
    const supportMenuItems = document.querySelectorAll('.support-menu .menu-item');

    if (supportTabs.length && supportMenuItems.length) {
        supportMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                supportMenuItems.forEach(i => i.classList.remove('active'));
                supportTabs.forEach(tab => tab.classList.remove('active'));

                item.classList.add('active');
                const tabId = item.getAttribute('data-tab');
                const target = document.getElementById(tabId);
                if (target) target.classList.add('active');
            });
        });
    }


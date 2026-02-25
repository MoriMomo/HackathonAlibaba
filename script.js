document.addEventListener('DOMContentLoaded', function () {
    // Set current year in footer
    const y = new Date().getFullYear();
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = y;

    // Mobile menu toggle
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('siteNav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            if (nav.style.display === 'block') nav.style.display = '';
            else nav.style.display = 'block';
        });
    }
});

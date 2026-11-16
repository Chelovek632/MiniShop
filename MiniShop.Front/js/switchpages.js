import { initLoginPage, initRegisterPage, updateAuthButton, OnorOfPanel, checkAdmin} from "./Account.js";
import { GetAllProducts, AddProduct, DeleteProduct, EditProduct, AddToCart, ViewCart, InitCatalogToolbar, InitCategoryAdmin, InitImagePreview} from "./product.js";
import { Checkout, LoadOrders, AdminOrderStatus, LoadAdminOrders, UpdateCart} from "./Order.js";
import { showToast } from "./utils.js";

// Whitelist страниц — hash из URL не должен попадать в fetch/innerHTML без проверки
const ALLOWED_PAGES = new Set([
    "home", "product", "contacts", "cart",
    "login", "register", "profile", "adminpanel"
]);

function sanitizePage(page) {
    return ALLOWED_PAGES.has(page) ? page : "home";
}

// Глобальный перехватчик fetch — ловит 401 (протухший токен) во всех запросах
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    if (response.status === 401) {
        // Токен протух или недействителен — чистим сессию и отправляем на логин
        localStorage.removeItem("token");
        localStorage.removeItem("isAdmin");
        showToast("Сессия истекла. Пожалуйста, войдите снова.", "error");
        window.location.hash = "login";
    }

    return response;
};


document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");

    async function loadPage(rawPage) {
        const page = sanitizePage(rawPage);
        const content = document.getElementById("content");
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) {
            content.innerHTML = "<p>Страница не найдена.</p>";
            return;
        }
        content.innerHTML = await response.text();
        OnorOfPanel();
        updateAuthButton();
        if (page === "adminpanel") EditProduct();
        if (page === "adminpanel") DeleteProduct();
        if (page === "adminpanel") checkAdmin();
        if (page === "adminpanel") AdminOrderStatus();
        if (page === "adminpanel") LoadAdminOrders();
        if (page === "login") initLoginPage();
        if (page === "register") initRegisterPage();
        if (page === "product") {
            InitCatalogToolbar();
            GetAllProducts();
            AddToCart();
        }
        if (page === "cart") ViewCart();
        if (page === "cart") Checkout();
        if (page === "cart") UpdateCart();
        if (page === "adminpanel") AddProduct();
        if (page === "adminpanel") InitCategoryAdmin();
        if (page === "adminpanel") InitImagePreview();
        if (page === "profile") LoadOrders();
    }

    document.querySelectorAll("a.nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.getAttribute("href").substring(1);
            window.location.hash = page;
            loadPage(page);
        });
    });

    const currentPage = window.location.hash.substring(1) || "home";
    loadPage(currentPage);

    window.addEventListener("hashchange", () => {
        const page = window.location.hash.substring(1);
        loadPage(page);
    });
});
import { initLoginPage, initRegisterPage, updateAuthButton, OnorOfPanel, checkAdmin} from "./Account.js";
import { GetAllProducts, AddProduct, DeleteProduct, EditProduct, AddToCart, ViewCart} from "./product.js";
import { Checkout, LoadOrders} from "./Order.js";


document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");


async function loadPage(page) {
    const content = document.getElementById("content");
    const response = await fetch(`pages/${page}.html`);
    content.innerHTML = await response.text();
    OnorOfPanel();
    updateAuthButton();
    if (page === "adminpanel") EditProduct();
    if (page === "adminpanel") DeleteProduct();
    if (page === "adminpanel") checkAdmin();
    if (page === "login") initLoginPage();
    if (page === "register") initRegisterPage();
    if (page === "product") {
        GetAllProducts();
        AddToCart();
    }
    if (page === "cart") Checkout();
    if (page === "cart") ViewCart();
    if (page === "adminpanel") AddProduct();
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











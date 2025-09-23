import { initLoginPage, initRegisterPage, updateAuthButton, OnorOfPanel, checkAdmin} from "./Account.js";
import { GetAllProducts, AddProduct } from "./product.js";


document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");


async function loadPage(page) {
    const content = document.getElementById("content");
    const response = await fetch(`pages/${page}.html`);
    content.innerHTML = await response.text();
    OnorOfPanel();
    updateAuthButton();
    if (page === "adminpanel") checkAdmin();
    if (page === "login") initLoginPage();
    if (page === "register") initRegisterPage();
    if (page === "product") GetAllProducts();
    if (page === "adminpanel") AddProduct();
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











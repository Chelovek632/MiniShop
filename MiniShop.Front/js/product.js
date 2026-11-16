import { showToast, escapeHtml } from "./utils.js";


// customer functions

// Состояние каталога: поиск, категория, страница
const catalogState = { page: 1, pageSize: 9, search: "", category: "" };

// Инициализация панели фильтров + загрузка категорий в select
export function InitCatalogToolbar() {
    const searchInput = document.getElementById("product-search");
    const categorySelect = document.getElementById("product-category");
    const searchBtn = document.getElementById("product-search-btn");
    if (!searchInput || !categorySelect) return;

    // Сбрасываем состояние при каждом входе на страницу
    catalogState.page = 1;
    catalogState.search = "";
    catalogState.category = "";
    searchInput.value = "";

    const applyFilters = () => {
        catalogState.search = searchInput.value.trim();
        catalogState.category = categorySelect.value;
        catalogState.page = 1;
        GetAllProducts();
    };

    searchBtn?.addEventListener("click", applyFilters);
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") applyFilters();
    });
    categorySelect.addEventListener("change", applyFilters);

    // Загружаем список категорий (анонимный эндпоинт)
    fetch("http://localhost:5000/api/Category/all", { headers: { "Accept": "application/json" } })
        .then(r => r.ok ? r.json() : [])
        .then(categories => {
            categorySelect.innerHTML = '<option value="">Все категории</option>';
            categories.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.name;
                categorySelect.appendChild(opt);
            });
        })
        .catch(() => { /* категории не загрузились — фильтр просто без них */ });
}

export function GetAllProducts() {
    const container = document.getElementById("products-list");
    const paginationEl = document.getElementById("products-pagination");
    if (!container) return;

    const token = localStorage.getItem("token"); // проверяем авторизацию

    const params = new URLSearchParams({
        page: catalogState.page,
        pageSize: catalogState.pageSize
    });
    if (catalogState.search) params.set("search", catalogState.search);
    if (catalogState.category) params.set("category", catalogState.category);

    container.innerHTML = '<p class="text-muted">Загрузка...</p>';

    fetch(`http://localhost:5000/api/Product/all?${params}`, {
        headers: { "Accept": "application/json" }
    })
        .then(response => response.json())
        .then(data => {
            container.innerHTML = "";
            const items = data.items || [];
            const total = data.total || 0;

            if (items.length === 0) {
                container.innerHTML = "<p>Нет доступных товаров.</p>";
                if (paginationEl) paginationEl.innerHTML = "";
                return;
            }

            items.forEach(product => {
                const productCard = document.createElement("div");
                productCard.className = "col-md-4 mb-4";

                const cartButton = token
                    ? `<button data-id="${product.id}" data-name="${encodeURIComponent(product.name)}"
class="btn btn-warning btn-sm buy-btn">В корзину</button>`
                    : `<button class="btn btn-secondary btn-sm" disabled>Вы не вошли в аккаунт</button>`;

                const categoryBadge = product.categoryName
                    ? `<span class="badge bg-secondary">${escapeHtml(product.categoryName)}</span> `
                    : "";

                productCard.innerHTML = `
                <div class="card product-card shadow-sm">
                    <img src="${escapeHtml(product.imageurl)}" class="product-image card-img-top" alt="${escapeHtml(product.name)}">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(product.name)}</h5>
                        ${categoryBadge}
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="fw-bold text-success">${product.price} $</span>
                            <span class="badge bg-info text-dark">В наличии: ${product.stock}</span>
                            <span class="badge bg-warning text-dark" id="Product-id">Id${product.id}</span>
                            ${cartButton}
                        </div>  
                    </div>
                </div>`;

                container.appendChild(productCard);
            });

            renderPagination(paginationEl, data, total);
        })
        .catch(err => {
            console.error("Ошибка запроса:", err);
            container.innerHTML = "";
            showToast("Не удалось подключиться к серверу", "error");
        });
}

// Кнопки страниц внизу каталога
function renderPagination(paginationEl, data, total) {
    if (!paginationEl) return;

    const totalPages = Math.max(1, Math.ceil(total / (data.pageSize || catalogState.pageSize)));
    const current = data.page || 1;

    if (totalPages <= 1) {
        paginationEl.innerHTML = "";
        return;
    }

    const go = (page) => {
        catalogState.page = page;
        GetAllProducts();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    paginationEl.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "pagination justify-content-center mb-0";

    const li = (label, page, disabled, active) => {
        const el = document.createElement("li");
        el.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;
        const btn = document.createElement("button");
        btn.className = "page-link";
        btn.textContent = label;
        if (!disabled && !active) btn.addEventListener("click", () => go(page));
        el.appendChild(btn);
        return el;
    };

    ul.appendChild(li("«", current - 1, current <= 1, false));

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);
    for (let p = start; p <= end; p++) {
        ul.appendChild(li(String(p), p, false, p === current));
    }

    ul.appendChild(li("»", current + 1, current >= totalPages, false));

    paginationEl.appendChild(ul);
}


export function AddToCart() {
    const container = document.getElementById("products-list");
    if (!container) return;

    container.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("buy-btn")) return;

        const productId = parseInt(e.target.getAttribute("data-id"));
        const productName = decodeURIComponent(e.target.getAttribute("data-name"));

        const token = localStorage.getItem("token");
        if (!token) {
            showToast("Сначала войдите в систему!", "warning"); 
            window.location.hash = "login";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/Cart/create", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: [
                        {
                            productId: productId,
                            quantity: 1
                        }
                    ]
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Ошибка при добавлении в корзину");
            }

            const result = await response.json();
            console.log("✅ Обновлённая корзина:", result);
            showToast(`Товар "${productName}" добавлен в корзину!`, "warning"); 
        } catch (err) {
            console.error("Ошибка:", err);
            showToast("Товара не осталось на складе", "warning"); 
        }
    });
}



export async function ViewCart() {
    const container = document.getElementById("cart-items-container");
    const totalEl = document.getElementById("cart-total");
    const subtotalEl = document.getElementById("cart-subtotal");
    const updateBtn = document.getElementById("update-cart-btn");

    const token = localStorage.getItem("token");
    if (!token) {
        container.innerHTML = "<p>Пожалуйста, войдите в систему.</p>";
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/Cart/getCart", {
            headers: {
                "Authorization": `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) throw new Error("Ошибка при получении корзины");

        const cart = await res.json();

        if (!cart || !cart.items || cart.items.length === 0) {
            container.innerHTML = "<p>Ваша корзина пуста.</p>";
            totalEl.textContent = "$0.00";
            subtotalEl.textContent = "$0.00";
            return;
        }

        container.innerHTML = "";
        let total = 0;

        const itemsHtml = cart.items.map(item => {
            const price = Number(item.product?.price) || 0;
            const qty = Number(item.quantity) || 0;
            total += price * qty;

            return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${escapeHtml(item.product?.name || "Неизвестно")}</strong>
                        <small class="text-muted d-block">x${qty} • $${price.toFixed(2)} / шт</small>
                    </div>
                    <span class="fw-bold">$${(price * qty).toFixed(2)}</span>
                </li>
            `;
        }).join("");

        const row = document.createElement("div");
        row.className = "cart-item mb-3 p-2 border rounded";
        row.innerHTML = `<div class="card-body"><ul class="list-group mb-3">${itemsHtml}</ul></div>`;
        container.appendChild(row);

        totalEl.textContent = `$${total.toFixed(2)}`;
        subtotalEl.textContent = `$${total.toFixed(2)}`;
        if (updateBtn) updateBtn.disabled = false;

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Ошибка загрузки корзины.</p>";
    }
}






// admin functions


export function AddProduct() {
    const form = document.getElementById("addProductForm");
    if (!form) return;

    // Загружаем категории в select формы
    const categorySelect = document.getElementById("productCategory");
    if (categorySelect) {
        fetch("http://localhost:5000/api/Category/all", { headers: { "Accept": "application/json" } })
            .then(r => r.ok ? r.json() : [])
            .then(categories => {
                categorySelect.innerHTML = '<option value="">Без категории</option>';
                categories.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.id;
                    opt.textContent = c.name;
                    categorySelect.appendChild(opt);
                });
            })
            .catch(() => {});
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const price = parseFloat(document.getElementById("price").value);
        const stock = parseInt(document.getElementById("quantity").value);
        const imageurl = document.getElementById("imageurl").value.trim();
        const categoryValue = categorySelect?.value || "";
        const fileInput = document.getElementById("imagefile");
        const token = localStorage.getItem("token");
        if (!name) { showToast("Введите название товара.", "error"); return; }
        if (isNaN(price) || price <= 0) { showToast("Цена должна быть больше 0.", "error"); return; }
        if (isNaN(stock) || stock < 0) { showToast("Количество не может быть отрицательным.", "error"); return; }
        if (!token) {
            showToast("Пожалуйста, войдите в систему", "error");
            window.location.hash = "login";
            return;
        }
        try {
            let finalImageUrl = imageurl;

            // Если выбран файл — сначала загружаем его на сервер
            const file = fileInput?.files?.[0];
            if (file) {
                const uploadForm = new FormData();
                uploadForm.append("file", file);
                const uploadRes = await fetch("http://localhost:5000/api/Product/upload", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: uploadForm
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) {
                    showToast(`Ошибка загрузки: ${uploadData.error || "unknown"}`, "error");
                    return;
                }
                finalImageUrl = uploadData.url;
            }

            if (!finalImageUrl) {
                showToast("Укажите URL изображения или загрузите файл", "error");
                return;
            }

            const body = { name, price, stock, imageurl: finalImageUrl };
            if (categoryValue) body.categoryId = parseInt(categoryValue);

            const response = await fetch("http://localhost:5000/api/Product/create", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Продукт добавлен:", data);
                showToast("Продукт успешно добавлен", "success");
                form.reset();
                const preview = document.getElementById("image-preview");
                if (preview) preview.classList.add("d-none");
            }
            else {
                showToast(`Ошибка: ${data.error}`, "error");
            }   
        }
        catch (err) {
            console.error("Ошибка запроса:", err);
            showToast("Не удалось подключиться к серверу", "error");
        }   
    });
}

export function DeleteProduct() {
    const form = document.getElementById("deleteProductForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("productId").value;
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:5000/api/Product/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Accept': 'application/json'
                },

            });
            const data = await response.json();
            if (response.ok) {
                console.log("Продукт удален:", data);
                showToast("Продукт успешно удален", "success");
                form.reset();
            }
            else {
                showToast(`Ошибка: ${data.error}`, "error");
            }
        }
        catch (err) {
            console.error("Ошибка запроса:", err);
            showToast("Не удалось подключиться к серверу", "error");
        }
    });
}


export function EditProduct() {
    const form = document.getElementById("editProductForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("editProductId").value;
        const nameRaw = document.getElementById("editName").value.trim();
        const priceRaw = document.getElementById("editPrice").value;
        const stockRaw = document.getElementById("editQuantity").value;
        const imageurlRaw = document.getElementById("editImageUrl").value.trim();

        if (!id) { showToast("Введите ID продукта.", "error"); return; }

        // Собираем только заполненные поля
        const body = {};
        if (nameRaw) body.name = nameRaw;
        if (priceRaw !== "") {
            const price = parseFloat(priceRaw);
            if (isNaN(price) || price <= 0) { showToast("Цена должна быть больше 0.", "error"); return; }
            body.price = price;
        }
        if (stockRaw !== "") {
            const stock = parseInt(stockRaw);
            if (isNaN(stock) || stock < 0) { showToast("Количество не может быть отрицательным.", "error"); return; }
            body.stock = stock;
        }
        if (imageurlRaw) body.imageurl = imageurlRaw;

        if (Object.keys(body).length === 0) {
            showToast("Заполните хотя бы одно поле для обновления.", "error");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/Product/update/${id}`,
                {
                    method: "PUT",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                }
            );

            const data = await response.json();

            if (response.ok) {
                showToast("Продукт успешно обновлён", "success");
                form.reset();
            } else {
                showToast(`Ошибка: ${data.error}`, "error");
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            showToast("Не удалось подключиться к серверу", "error");
        }
    });
}


// --- Управление категориями (админка) ---

export function InitCategoryAdmin() {
    const listEl = document.getElementById("category-list");
    const createForm = document.getElementById("createCategoryForm");
    if (!listEl) return;

    const loadCategories = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/Category/all", {
                headers: { "Accept": "application/json" }
            });
            const categories = await res.json();
            if (!categories.length) {
                listEl.innerHTML = '<li class="list-group-item text-muted">Категорий пока нет</li>';
                return;
            }
            listEl.innerHTML = "";
            const token = localStorage.getItem("token");
            categories.forEach(c => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <span>${escapeHtml(c.name)} <small class="text-muted">(id: ${c.id})</small></span>
                    <button class="btn btn-outline-danger btn-sm" data-id="${c.id}" data-name="${encodeURIComponent(c.name)}">Удалить</button>`;
                listEl.appendChild(li);
            });
        } catch (err) {
            console.error("Ошибка загрузки категорий:", err);
        }
    };

    listEl.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-id]");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        const name = decodeURIComponent(btn.getAttribute("data-name"));
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:5000/api/Category/delete/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Категория "${name}" удалена`, "success");
                loadCategories();
            } else {
                showToast(`Ошибка: ${data.error}`, "error");
            }
        } catch (err) {
            showToast("Не удалось подключиться к серверу", "error");
        }
    });

    createForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("categoryName");
        const name = input.value.trim();
        if (!name) { showToast("Введите название категории", "error"); return; }
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/Category/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Категория "${name}" создана`, "success");
                input.value = "";
                loadCategories();
            } else {
                showToast(`Ошибка: ${data.error}`, "error");
            }
        } catch (err) {
            showToast("Не удалось подключиться к серверу", "error");
        }
    });

    loadCategories();
}


// Превью выбранного файла в админке
export function InitImagePreview() {
    const input = document.getElementById("imagefile");
    const preview = document.getElementById("image-preview");
    if (!input || !preview) return;
    input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.classList.remove("d-none");
        } else {
            preview.classList.add("d-none");
        }
    });
}

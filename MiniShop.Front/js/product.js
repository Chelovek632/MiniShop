import { showToast, escapeHtml } from "./utils.js";


// customer functions


export function GetAllProducts() {
    const container = document.getElementById("products-list");
    if (!container) return;

    const token = localStorage.getItem("token"); // проверяем авторизацию

        fetch('http://localhost:5000/api/Product/all', {
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            container.innerHTML = "";
            if (data.length === 0) {
                container.innerHTML = "<p>Нет доступных товаров.</p>";
            }
            data.forEach(product => {
                const productCard = document.createElement("div");
                productCard.className = "col-md-4 mb-4";

                const cartButton = token
                    ? `<button data-id="${product.id}" data-name="${encodeURIComponent(product.name)}"
class="btn btn-warning btn-sm buy-btn">В корзину</button>`
                    : `<button class="btn btn-secondary btn-sm" disabled>Вы не вошли в аккаунт</button>`;

                productCard.innerHTML = `
                <div class="card product-card shadow-sm">
                    <img src="${escapeHtml(product.imageurl)}" class="product-image card-img-top" alt="${escapeHtml(product.name)}">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(product.name)}</h5>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-success">${product.price} $</span>
                            <span class="badge bg-info text-dark">В наличии: ${product.stock}</span>
                            <span class="badge bg-warning text-dark" id="Product-id">Id${product.id}</span>
                            ${cartButton}
                        </div>  
                    </div>
                </div>`;

                container.appendChild(productCard);
            });
        })
        .catch(err => {
            console.error("Ошибка запроса:", err);
            showToast("Не удалось подключиться к серверу", "error");
        });
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
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const price = parseFloat(document.getElementById("price").value);
        const stock = parseInt(document.getElementById("quantity").value);
        const imageurl = document.getElementById("imageurl").value;
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
            const response = await fetch("http://localhost:5000/api/Product/create", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, price, stock, imageurl })
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Продукт добавлен:", data);
                showToast("Продукт успешно добавлен", "success");
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

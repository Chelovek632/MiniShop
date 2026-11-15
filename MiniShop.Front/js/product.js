function showToast(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <span style="margin-left: 10px; cursor: pointer; font-weight: bold;">&times;</span>
    `;

    toast.querySelector('span:last-child').onclick = () => toast.remove();
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


// customer functions


export function GetAllProducts() {
    const container = document.getElementById("products-list");
    if (!container) return;

    const token = localStorage.getItem("token"); // проверяем авторизацию

        fetch('http://localhost:5000/api/Product/all', {
            headers: {
                'ngrok-skip-browser-warning': 'true',
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
                    <img src="${product.imageurl}" class="product-image card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-success">${product.price} $</span>
                            <span class="badge bg-info text-dark">В наличии: ${product.stock}</span>
                            <span class="badge bg-warning text-dark" id="Product-id">Id${product.id}</span>
                            ${cartButton}
                        </div>  
                    </div>
                </div>`;
                console.log(product);

                container.appendChild(productCard);
            });
        })
        .catch(err => {
            console.error("Ошибка запроса:", err);
            alert("Не удалось подключиться к серверу");
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
                                    'ngrok-skip-browser-warning': 'true',
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
                'ngrok-skip-browser-warning': 'true',
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
                        <strong>${item.product?.name || "Неизвестно"}</strong>
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
        if (!name) { alert("Введите название товара."); return; }
        if (isNaN(price) || price <= 0) { alert("Цена должна быть больше 0."); return; }
        if (isNaN(stock) || stock < 0) { alert("Количество не может быть отрицательным."); return; }
        if (!token) {
            alert("Пожалуйста, войдите в систему");
            window.location.hash = "login";
            return;
        }
        try {
            const response = await fetch("http://localhost:5000/api/Product/create", {
                method: "POST",
                headers: {
                                    'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, price, stock, imageurl })
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Продукт добавлен:", data);
                alert("Продукт успешно добавлен");
                form.reset();
            }
            else {
                alert(`Ошибка: ${data.error}`);
            }   
        }
        catch (err) {
            console.error("Ошибка запроса:", err);
            alert("Не удалось подключиться к серверу");
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
                                    'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json'
                },

            });
            const data = await response.json();
            if (response.ok) {
                console.log("Продукт удален:", data);
                alert("Продукт успешно удален");
                form.reset();
            }
            else {
                alert(`Ошибка: ${data.error}`);
            }
        }
        catch (err) {
            console.error("Ошибка запроса:", err);
            alert("Не удалось подключиться к серверу");
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

        if (!id) { alert("Введите ID продукта."); return; }

        // Собираем только заполненные поля
        const body = {};
        if (nameRaw) body.name = nameRaw;
        if (priceRaw !== "") {
            const price = parseFloat(priceRaw);
            if (isNaN(price) || price <= 0) { alert("Цена должна быть больше 0."); return; }
            body.price = price;
        }
        if (stockRaw !== "") {
            const stock = parseInt(stockRaw);
            if (isNaN(stock) || stock < 0) { alert("Количество не может быть отрицательным."); return; }
            body.stock = stock;
        }
        if (imageurlRaw) body.imageurl = imageurlRaw;

        if (Object.keys(body).length === 0) {
            alert("Заполните хотя бы одно поле для обновления.");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/Product/update/${id}`,
                {
                    method: "PUT",
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Продукт успешно обновлён");
                form.reset();
            } else {
                alert(`Ошибка: ${data.error}`);
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            alert("Не удалось подключиться к серверу");
        }
    });
}














// export function initProductPage() {
//     const form = document.getElementById("product-form");
//     if (!form) return;
//     form.addEventListener("submit", async (e) => {
//         e.preventDefault(); // чтобы страница не перезагружалась

//         const name = document.getElementById("product-name").value;
//         const price = parseFloat(document.getElementById("product-price").value);
//         const description = document.getElementById("product-description").value;  
//         const token = localStorage.getItem("token");
//         if (!token) {
//             alert("Пожалуйста, войдите в систему");
//             window.location.hash = "login";
//             return;
//         }
//         try {
//             const response = await fetch("http://localhost:5000/api/Product/create", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${token}`
//                 },
//                 body: JSON.stringify({ name, price, description })
//             });
//             const data = await response.json();
//             if (response.ok) {
//                 console.log("Продукт добавлен:", data);
//                 alert("Продукт успешно добавлен");
//                 form.reset();
//             }
//             else {
//                 alert(`Ошибка: ${data.error}`);
//             }   
//         }
//         catch (err) {
//             console.error("Ошибка запроса:", err);
//             alert("Не удалось подключиться к серверу");
//         }
//     });
// }
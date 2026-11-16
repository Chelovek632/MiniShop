import { ViewCart } from "./product.js";
import { showToast, escapeHtml } from "./utils.js";

export function Checkout() {
    const btn = document.getElementById("checkout-btn");
    const addressInput = document.getElementById("delivery-address");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            showToast("Сначала войдите в систему!", "warning"); // ЗАМЕНА alert
            window.location.hash = "login";
            return;
        }

        const address = addressInput.value.trim();
        if (address.length < 10) {
            showToast("Введите полный адрес доставки (минимум 10 символов)", "warning");
            addressInput.focus();
            return;
        }

        try {
            const cartResponse = await fetch("http://localhost:5000/api/Cart/getCart", {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`
                }
            });
 
            const cart = await cartResponse.json();
            const allItems = cart?.items || [];
 
            if (allItems.length === 0) {
                showToast("Корзина пуста!", "warning");
                return;
            }
 
            const orderData = {
                address: addressInput.value.trim(),
                items: allItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            };
 
            const response = await fetch("http://localhost:5000/api/Orders/create", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
 
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Ошибка при оформлении заказа");
            }
 
            const result = await response.json();
            console.log("✅ Заказ оформлен:", result);
 
            showToast("Заказ успешно оформлен!", "success");
 
            await fetch("http://localhost:5000/api/Cart/clear", {
                method: "DELETE",
                headers: {
                    'Accept': 'application/json',
                    "Authorization": `Bearer ${token}`
                }
            });
 
            document.getElementById("cart-items-container").innerHTML = "<p>Ваша корзина пуста.</p>";
            document.getElementById("cart-total").textContent = "$0.00";
 
        } catch (err) {
            console.error("Ошибка при заказе:", err);
            showToast("Не удалось оформить заказ: " + err.message, "error");
        }
    });
}

export function LoadOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;

    const token = localStorage.getItem("token");
    if (!token) {
        container.innerHTML = "<p>Сначала войдите в систему.</p>";
        return;
    }

    container.innerHTML = "<p>Загрузка заказов...</p>";

    const statusLabels = {
        Pending:   { text: "В обработке", color: "warning"   },
        Paid:      { text: "Оплачен",      color: "success"   },
        Shipped:   { text: "Отправлен",    color: "primary"   },
        Delivered: { text: "Доставлен",    color: "secondary" },
        Canceled:  { text: "Отменён",      color: "danger"    },
    };

    fetch("http://localhost:5000/api/Orders/getorders", {
        headers: {
            'Accept': 'application/json',
            "Authorization": `Bearer ${token}`
        }
    })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(orders => {
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <p class="fs-5">У вас пока нет заказов.</p>
                    <span class="fst-italic">"Купи бумагу. Спаси офис." — Jim Halpert</span>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="accordion" id="ordersAccordion"></div>`;
        const accordion = document.getElementById("ordersAccordion");

        orders.forEach((order, i) => {
            const total = order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            const date = new Date(order.createdAt).toLocaleDateString("ru-RU");
            const status = statusLabels[order.status] || { text: order.status, color: "secondary" };

            const item = document.createElement("div");
            item.className = "accordion-item border-0 mb-3 shadow-sm";
            item.innerHTML = `
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed rounded" type="button"
                        data-bs-toggle="collapse" data-bs-target="#order-${order.id}">
                        <div class="d-flex justify-content-between align-items-center w-100 pe-3">
                            <div class="d-flex align-items-center gap-3">
                                <strong>Заказ #${order.id}</strong>
                                <span class="badge bg-${status.color} text-dark">${status.text}</span>
                                <small class="text-muted">${date}</small>
                            </div>
                            <span class="fw-bold text-success">$${total.toFixed(2)}</span>
                        </div>
                    </button>
                </h2>
                <div id="order-${order.id}" class="accordion-collapse collapse">
                    <div class="accordion-body pt-0">
                        <ul class="list-group list-group-flush mb-3">
                            ${order.items.map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${escapeHtml(item.product.name)}</strong>
                                        <small class="text-muted d-block">x${item.quantity} • $${item.product.price.toFixed(2)} / шт</small>
                                    </div>
                                    <span class="fw-bold">$${(item.product.price * item.quantity).toFixed(2)}</span>
                                </li>
                            `).join("")}
                        </ul>
                        <div class="d-flex justify-content-between align-items-center border-top pt-2">
                            <small class="text-muted">Адрес: ${escapeHtml(order.address ?? "—")}</small>
                            <strong class="text-success fs-5">Итого: $${total.toFixed(2)}</strong>
                        </div>
                        ${order.status === "Pending" ? `
                        <div class="text-end mt-2">
                            <button class="btn btn-success btn-sm pay-btn" data-id="${order.id}">
                                <i class="bi bi-credit-card me-1"></i>Оплатить (демо)
                            </button>
                        </div>` : ""}
                    </div>
                </div>
            `;
            accordion.appendChild(item);
        });

        // Оплата заказа (демо-заглушка: Pending -> Paid)
        accordion.addEventListener("click", async (e) => {
            const btn = e.target.closest(".pay-btn");
            if (!btn) return;

            const orderId = btn.getAttribute("data-id");
            const token = localStorage.getItem("token");
            btn.disabled = true;

            try {
                const response = await fetch(`http://localhost:5000/api/Orders/${orderId}/pay`, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    showToast(`Заказ #${orderId} оплачен`, "success");
                    LoadOrders();
                } else {
                    showToast(`Ошибка: ${data.error}`, "error");
                    btn.disabled = false;
                }
            } catch (err) {
                console.error("Ошибка оплаты:", err);
                showToast("Не удалось подключиться к серверу", "error");
                btn.disabled = false;
            }
        });
    })
    .catch(() => {
        container.innerHTML = "<p class='text-danger'>Ошибка при загрузке заказов.</p>";
    });
}

export function AdminOrderStatus() {
    const form = document.getElementById("updateOrderStatusForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const orderId = document.getElementById("orderId").value;
        const status = document.getElementById("orderStatus").value;
        const token = localStorage.getItem("token");

        if (!token) {
            showToast("Нет авторизации", "error");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/Orders/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ status })
                }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            showToast("Статус заказа обновлён", "success");
            form.reset();

        } catch (err) {
            showToast("Ошибка: " + err.message, "error");
        }
    });
}


export function LoadAdminOrders() {
    const container = document.getElementById("admin-orders-container");
    if (!container) return;

    const token = localStorage.getItem("token");
    if (!token) {
        container.innerHTML = "<p>Нет доступа</p>";
        return;
    }

    container.innerHTML = "<p>Загрузка заказов...</p>";

    fetch("http://localhost:5000/api/Orders/all", {
        headers: {
            'Accept': 'application/json',
            "Authorization": `Bearer ${token}`
        }
    })
    .then(r => r.json())
    .then(orders => {
        if (!orders || orders.length === 0) {
            container.innerHTML = "<p>Заказов нет</p>";
            return;
        }

        container.innerHTML = "";

        orders.forEach(order => {
            const div = document.createElement("div");
            div.className = "card mb-3 shadow-sm";

            div.innerHTML = `
                <div class="card-header d-flex justify-content-between">
                    <strong>Заказ #${order.id}</strong>
                    <span class="badge bg-info">${order.status}</span>
                </div>

                <div class="card-body">
                    <p><b>Пользователь:</b> ${escapeHtml(order.userLogin ?? "—")}</p> 
                    
                    <ul class="list-group mb-3">
                        ${order.items.map(i => `
                            <li class="list-group-item d-flex justify-content-between">
                                ${escapeHtml(i.productName)} x${i.quantity}
                                <span>$${(i.price * i.quantity).toFixed(2)}</span>
                            </li>
                        `).join("")}
                    </ul>

                    <div class="alert alert-light text-center border">
                        Статус: <b>${escapeHtml(order.status)}</b>
                    </div>
                </div>
            `;

            container.appendChild(div);
        });

        // Мы удалили вызов attachStatusHandlers, так как ты хочешь только показывать
    })
    .catch(err => {
        console.error("Ошибка загрузки:", err);
        container.innerHTML = "<p>Ошибка при загрузке данных</p>";
    });
}

export function UpdateCart() {
    const btn = document.getElementById('update-cart-btn');
    if (!btn) return;

    btn.addEventListener('click', async function() {
        btn.disabled = true;
        btn.textContent = "Обновляем...";

        await ViewCart();

        btn.disabled = false;
        btn.textContent = "Обновить корзину";
        showToast("Корзина обновлена", "success");
    });
}
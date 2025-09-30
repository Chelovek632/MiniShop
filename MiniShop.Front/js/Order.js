export function Checkout() {
    const btn = document.getElementById("checkout-btn");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
        e.preventDefault();

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (cart.length === 0) {
            alert("Корзина пуста!");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Сначала войдите в систему!");
            window.location.hash = "login";
            return;
        }

        // Преобразуем в формат DTO
        const orderData = {
            items: cart.map(item => ({
                productId: parseInt(item.id), // id → productId
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch("http://localhost:5000/api/Orders/create", {
                method: "POST",
                headers: {
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

            alert("Заказ успешно оформлен!");
            localStorage.removeItem("cart"); // очищаем корзину
            document.getElementById("cart-items-container").innerHTML = "<p>Ваша корзина пуста.</p>";
            document.getElementById("cart-total").textContent = "$0.00";
        } catch (err) {
            console.error("Ошибка при заказе:", err);
            alert("Не удалось оформить заказ 😔\n" + err.message);
        }
    });
}

export function LoadOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;
    const token = localStorage.getItem("token");
    if (!token) {
        container.innerHTML = "<p>Сначала войдите в систему, чтобы просмотреть заказы.</p>";
        return;
    }
    container.innerHTML = "<p>Загрузка заказов...</p>";
    fetch("http://localhost:5000/api/Orders/getorders", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Ошибка при загрузке заказов");
        }
        return response.json();
    })
    .then(orders => {
        if (orders.length === 0) {
            container.innerHTML = "<p>У вас нет заказов.</p>";
            return;
        }
        container.innerHTML = "";
        orders.forEach(order => {
            const orderDiv = document.createElement("div");
            orderDiv.className = "card mb-3";
            const orderDate = new Date(order.createdAt).toLocaleString();
            orderDiv.innerHTML = `
                <div class="card-header">
                    <strong>Заказ #${order.id}</strong> - ${orderDate}
                </div>
                <div class="card-body">
                    <ul class="list-group mb-3">
                        ${order.items.map(item => `
                            <li class="list-group-item d-flex justify-content-between align-items-center"></li>
                                ${item.product.name} (x${item.quantity}) - $${item.product.price} each
                                <span>$${(item.product.price * item.quantity)}</span>
                            </li>
                        `).join("")}
                    </ul>
                </div>
            `;
            container.appendChild(orderDiv);
        }
        );
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = "<p>Не удалось загрузить заказы.</p>";
    }); 
}
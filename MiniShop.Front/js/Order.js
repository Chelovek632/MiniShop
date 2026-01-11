export function Checkout() {
    const btn = document.getElementById("checkout-btn");
    const addressInput = document.getElementById("delivery-address");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Сначала войдите в систему!");
            window.location.hash = "login";
            return;
        }
 
        if (addressInput.value.trim() === "") {
            alert("Пожалуйста, введите адрес доставки.");
            return;
        }

        try {
            const cartResponse = await fetch("http://localhost:5000/api/Cart/getCarts", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            const carts = await cartResponse.json();
            
            // Собираем все товары из всех корзин
            const allItems = carts.flatMap(c => c.items);
            
            if (allItems.length === 0) {
                alert("Корзина пуста!");
                return;
            }
            
            const groupedItems = Object.values(
                allItems.reduce((acc, item) => {
                    if (!acc[item.productId]) {
                        acc[item.productId] = { productId: item.productId, quantity: item.quantity };
                    } else {
                        acc[item.productId].quantity += item.quantity;
                    }
                    return acc;
                }, {})
            );
            
            const orderData = {
                address: addressInput.value.trim(),
                items: groupedItems
            };
            
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


            await fetch("http://localhost:5000/api/Cart/clear", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            document.getElementById("cart-items-container").innerHTML = "<p>Ваша корзина пуста.</p>";
            document.getElementById("cart-total").textContent = "$0.00";

        } catch (err) {
            console.error("Ошибка при заказе:", err);
            alert("Не удалось оформить заказ " + err.message);
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
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-dunder text-white d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Заказ #${order.id}</strong>
                            <span class="ms-2 small text-light opacity-75">(${orderDate})</span>
                        </div>
                        <span class="badge bg-warning text-dark">Dunder Mifflin Order</span>
                    </div>
                    
                    <div class="card-body bg-white">
                        <ul class="list-group list-group-flush mb-3">
                            ${order.items.map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${item.product.name}</strong>
                                        <small class="text-muted d-block">x${item.quantity} • $${item.product.price.toFixed(2)} / шт</small>
                                    </div>
                                    <span class="fw-bold text-success">$${(item.product.price * item.quantity).toFixed(2)}</span>
                                </li>
                            `).join("")}
                        </ul>
                            
                        <div class="d-flex justify-content-between align-items-center border-top pt-3">
                            <span class="fw-bold text-dunder">Итого:</span>
                            <span class="fw-bold text-success fs-5">
                                $${order.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                            
                    <div class="card-footer text-center text-muted small">
                        “Спасибо, что выбираете Dunder Mifflin Paper Co.” 📄
                    </div>
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
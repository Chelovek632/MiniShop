// customer functions

export function GetAllProducts() {
    const container = document.getElementById("products-list");
    if (!container) return;

    const token = localStorage.getItem("token"); // проверяем авторизацию

    fetch("http://localhost:5000/api/Product/all")
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
                    : `<button class="btn btn-secondary btn-sm" disabled>Иди нафиг</button>`;

                productCard.innerHTML = `
                <div class="card product-card shadow-sm">
                    <img src="image/${product.imageurl}" class="product-image card-img-top" alt="${product.name}">
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
            alert("Сначала войдите в систему!");
            window.location.hash = "login";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/Cart/create", {
                method: "POST",
                headers: {
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

            alert(`Товар "${productName}" добавлен в корзину!`);
        } catch (err) {
            console.error("Ошибка:", err);
            alert("Не удалось добавить товар в корзину: " + err.message);
        }
    });
}



export async function ViewCart() {
    const container = document.getElementById("cart-items-container");
    const totalPriceElement = document.getElementById("cart-total");

    const token = localStorage.getItem("token");
    if (!token) {
        container.innerHTML = "<p>Пожалуйста, войдите в систему.</p>";
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/Cart/getCarts", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Ошибка при получении корзины");

        const carts = await res.json(); 

        if (!carts || carts.length === 0) {
            container.innerHTML = "<p>Ваша корзина пуста.</p>";
            totalPriceElement.textContent = "$0.00";
            return;
        }

        container.innerHTML = "";
        let total = 0;

        carts.forEach(cart => { 
            let cartTotal = 0;
            const itemsHtml = (cart.items || []).map(item => {
                const price = Number(item.product?.price) || 0;
                const quantity = Number(item.quantity) || 0;
                const itemTotal = price * quantity;
                cartTotal += itemTotal;
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${item.product?.name || "Неизвестно"} (x${quantity}) - $${price} each
                        <span>$${itemTotal}</span>
                    </li>
                `;
            }).join("");
            total += cartTotal;
            const row = document.createElement("div");
            row.className = "cart-item mb-3 p-2 border rounded";
            row.innerHTML = `
                <div class="card-body">
                    <ul class="list-group mb-3">
                        ${itemsHtml}
                    </ul>
                </div>
            `;
            container.appendChild(row);
        });
        totalPriceElement.textContent = `$${total.toFixed(2)}`;


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
        const name = document.getElementById("name").value;
        const price = document.getElementById("price").value;
        const stock = document.getElementById("quantity").value;
        const imageurl = document.getElementById("imageurl").value;
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Пожалуйста, войдите в систему");
            window.location.hash = "login";
            return;
        }
        try {
            const response = await fetch("http://localhost:5000/api/Product/create", {
                method: "POST",
                headers: {
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
                    "Authorization": `Bearer ${token}`
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
        const name = document.getElementById("editName").value;
        const price = document.getElementById("editPrice").value;
        const stock = document.getElementById("editQuantity").value;
        const imageurl = document.getElementById("editImageUrl").value;
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:5000/api/Product/update/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, price, stock, imageurl })
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Продукт обновлен:", data);
                alert("Продукт успешно обновлен");
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
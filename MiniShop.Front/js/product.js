// customer functions

export function GetAllProducts() {
    const container = document.getElementById("products-list");
    if (!container) return;

    const token = localStorage.getItem("token"); // проверяем авторизацию

    fetch("http://localhost:5000/api/Product/all")
        .then(response => response.json())
        .then(data => {
            container.innerHTML = "";
            data.forEach(product => {
                const productCard = document.createElement("div");
                productCard.className = "col-md-4 mb-4";

                const cartButton = token
                    ? `<button data-id="${product.id}" data-name="${encodeURIComponent(product.name)}" data-price="${product.price}" 
class="btn btn-success btn-sm buy-btn">В корзину</button>`
                    : `<button class="btn btn-secondary btn-sm" disabled>Иди нафиг</button>`;

                productCard.innerHTML = `
                <div class="card product-card shadow-sm">
                    <img src="image/${product.imageurl}" class="product-image card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-success">${product.price} $/кг</span>
                            <span class="badge bg-info text-dark">В наличии: ${product.stock} кг</span>
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
    container.addEventListener("click", (e) => {
        if (e.target.classList.contains("buy-btn")) {
            const productId = e.target.getAttribute("data-id");
            const productName = decodeURIComponent(e.target.getAttribute("data-name"));
            const productPrice = parseFloat(e.target.getAttribute("data-price")); // цена
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ 
                    id: productId, 
                    name: productName, 
                    price: productPrice, 
                    quantity: 1 
                });
            }
            localStorage.setItem("cart", JSON.stringify(cart));
            alert(`Добавлено в корзину: ${productName}`);
            console.log(cart);
        }
    });
}


export function ViewCart() {
    const cartform = document.getElementById("cart-form");
    if (!cartform) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartItemsContainer = document.getElementById("cart-items-container");
    const subtotalElement = document.getElementById("cart-subtotal");
    const totalElement = document.getElementById("cart-total");

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Ваша корзина пуста.</p>";
        subtotalElement.textContent = "$0.00";
        totalElement.textContent = "$0.00";
        return;
    }

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item mb-3 p-2 border rounded";
        itemElement.innerHTML = `
            <h5>${item.name}</h5>
            <p>Цена: $${item.price.toFixed(2)}</p>
            <p>Количество: ${item.quantity}</p>
            <p class="fw-bold">Итого: $${itemTotal.toFixed(2)}</p>
            <hr>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${subtotal.toFixed(2)}`; // если доставка бесплатная
}









// admin functions


export function AddProduct() {
    const form = document.getElementById("addProductForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // чтобы страница не перезагружалась
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
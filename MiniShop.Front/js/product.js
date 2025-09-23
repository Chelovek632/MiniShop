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

                // Если токен есть — показываем кнопку
                const cartButton = token
                    ? `<button class="btn btn-success btn-sm">В корзину</button>`
                    : "";

                productCard.innerHTML = `
                <div class="card product-card shadow-sm">
                    <img src="image/${product.imageurl}" class="product-image card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-success">${product.price} ₽/кг</span>
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
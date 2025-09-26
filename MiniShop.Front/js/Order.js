// export function BuyProduct() {
//     const buyButtons = document.getElementById("buy-product-form");
//     if (!buyButtons) return;
//     buyButtons.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         const productId = e.target.getAttribute("data-id");
//         const token = localStorage.getItem("token");
//         const quantity = document.getElementById("quantity").value;

//         if (!token) {
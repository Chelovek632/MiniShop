

export function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // чтобы страница не перезагружалась

        const login = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("http://localhost:5000/api/Account/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Успешный вход:", data);
                localStorage.setItem("token", data.token);
                localStorage.setItem("isAdmin", data.role); // сохраняем роль
                window.location.hash = "home";
            } else {
                alert(`Ошибка: ${data.error}`);
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            alert("Не удалось подключиться к серверу");
        }
    });
}
export function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // чтобы страница не перезагружалась
        const login = document.getElementById("register-login").value;
        const password = document.getElementById("register-password").value;
        try {
            const response = await fetch("http://localhost:5000/api/Account/register", {   
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password })
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Успешная регистрация:", data);
                window.location.hash = "login";
            }
            else {
                alert(`Ошибка: ${data.error}`);
            }
        }
        catch (err) {
            console.error("Ошибка запроса:", err);
            alert("Не удалось подключиться к серверу");
        }
    }
    )
}

export function updateAuthButton() {
    const authBtn = document.getElementById("auth-btn");
    if (!authBtn) return;

    const token = localStorage.getItem("token");

    if (token) {
        authBtn.textContent = "Выйти";
        authBtn.onclick = () => {
            localStorage.removeItem("token");
            window.location.hash = "login";
            updateAuthButton(); // обновляем снова
        };
    } else {
        authBtn.textContent = "Войти";
        authBtn.onclick = () => {
            window.location.hash = "login";
        };
    }
}

export function OnorOfPanel() {
    const adminBtn = document.getElementById("admin-btn");
    if (!adminBtn) return;
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin === "Admin") {
        adminBtn.classList.remove("d-none");
        adminBtn.onclick = () => {
            window.location.hash = "adminpanel";
        };
    } else {
        adminBtn.classList.add("d-none");
    }
}

export function checkAdmin() {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "Admin") {
        alert("У вас нет доступа к этой странице");
        window.location.hash = "home";
    }
    return isAdmin === "Admin";
}
import { showToast } from "./utils.js";

export function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const login = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("http://localhost:5000/api/Account/login", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("isAdmin", data.role);
                window.location.hash = "home";
            } else {
                showToast(`Ошибка: ${data.error}`, "error");
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            showToast("Не удалось подключиться к серверу", "error");
        }
    });
}

export function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const login = document.getElementById("register-login").value.trim();
        const password = document.getElementById("register-password").value;

        if (!login) {
            showToast("Логин не может быть пустым.", "error");
            return;
        }
        if (login.length < 3) {
            showToast("Логин должен содержать не менее 3 символов.", "error");
            return;
        }
        if (!password) {
            showToast("Пароль не может быть пустым.", "error");
            return;
        }
        if (password.length < 6) {
            showToast("Пароль должен содержать не менее 6 символов.", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/Account/register", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast("Регистрация успешна! Войдите в систему.", "success");
                setTimeout(() => { window.location.hash = "login"; }, 1500);
            } else {
                showToast(`Ошибка: ${data.error}`, "error");
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            showToast("Не удалось подключиться к серверу", "error");
        }
    });
}

export function updateAuthButton() {
    const authBtn = document.getElementById("auth-btn");
    const userIconBtn = document.getElementById("user-icon-btn");
    if (!authBtn) return;

    const token = localStorage.getItem("token");

    if (token) {
        authBtn.textContent = "Выйти";
        authBtn.onclick = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("isAdmin");
            window.location.hash = "login";
            updateAuthButton();
        };
    } else {
        authBtn.textContent = "Войти";
        authBtn.onclick = () => {
            window.location.hash = "login";
        };
    }

    if (userIconBtn) {
        if (token) {
            userIconBtn.classList.remove("d-none");
            userIconBtn.onclick = () => { window.location.hash = "profile"; };
        } else {
            userIconBtn.classList.add("d-none");
        }
    }
}

export function OnorOfPanel() {
    const adminBtn = document.getElementById("admin-btn");
    if (!adminBtn) return;
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin === "Admin") {
        adminBtn.classList.remove("d-none");
        adminBtn.onclick = () => { window.location.hash = "adminpanel"; };
    } else {
        adminBtn.classList.add("d-none");
    }
}

export function checkAdmin() {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "Admin") {
        showToast("У вас нет доступа к этой странице", "error");
        window.location.hash = "home";
    }
    return isAdmin === "Admin";
}
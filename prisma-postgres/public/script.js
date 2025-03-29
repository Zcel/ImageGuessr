document.addEventListener("DOMContentLoaded", () => {
    // Handle Registration Form
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            document.getElementById("message").textContent = data.message;

            if (res.ok) {
                window.location.href = data.redirect;
            }
        });
    }

    // Handle Login Form
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            document.getElementById("message").textContent = data.message;

            if (res.ok) {
                window.location.href = data.redirect;
            }
        });
    }
    // Fetch user data when on the dashboard
    async function fetchUserData() {
        try {
            const res = await fetch("/user-data", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                const userData = await res.json();
                document.getElementById("username").textContent = userData.username;
                document.getElementById("xp").textContent = userData.xp;
            } else {
                console.error("Failed to fetch user data");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    // Only call fetchUserData if the elements exist
    if (document.getElementById("username")) {
        fetchUserData();
    }
});

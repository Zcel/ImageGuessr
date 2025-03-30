async function joinGame() {
    const gameCode = document.getElementById("gameCodeInput").value; // Get the input value

    if (!gameCode) {
        document.getElementById("joinMessage").textContent = "Please enter a game code.";
        return;
    }

    try {
        const response = await fetch(`/join-game/${gameCode}`);
        const data = await response.json();

        if (response.ok) {
            // If the game is found and the user can join, redirect to the play page
            window.location.href = data.redirect;
        } else {
            // If there is an error (e.g., game not found or cannot join own game)
            document.getElementById("joinMessage").textContent = data.message;
        }
    } catch (error) {
        console.error("Error joining game:", error);
        document.getElementById("joinMessage").textContent = "Failed to join game. Please try again.";
    }
}
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
    //handle logout form
    async function logout() {
        try {
            const res = await fetch("/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                window.location.href = "/login.html"; // Redirect to login page
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    // Attach logout function to the button
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
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
    // Initialize Leaflet Map
    if (document.getElementById("map")) {
        const map = L.map("map").setView([51.505, -0.09], 13); // Default to London
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        let marker;

        map.on("click", function (e) {
            if (marker) map.removeLayer(marker);
            marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);

            document.getElementById("latitude").value = e.latlng.lat;
            document.getElementById("longitude").value = e.latlng.lng;
        });
    }
    //create game code
    const gameForm = document.getElementById("game-form");
    if (gameForm) {
        gameForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const imageFile = document.getElementById("image").files[0];
            const latitude = document.getElementById("latitude").value;
            const longitude = document.getElementById("longitude").value;
            const hint1 = document.getElementById("hint1").value;
            const hint2 = document.getElementById("hint2").value;
            const hint3 = document.getElementById("hint3").value;

            if (!imageFile || !latitude || !longitude) {
                alert("Please upload an image and select a location.");
                return;
            }

            const formData = new FormData();
            formData.append("image", imageFile);
            formData.append("latitude", latitude);
            formData.append("longitude", longitude);
            formData.append("hint1", hint1);
            formData.append("hint2", hint2);
            formData.append("hint3", hint3);

            const res = await fetch("/create-game", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            document.getElementById("game-link").textContent = `Game Code: ${data.gameCode}`;
        });
    }
});

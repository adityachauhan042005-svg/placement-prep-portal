// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const message = document.getElementById("login-message");

        message.textContent = "Logging in...";

        try {

            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.message || "Login failed";
                return;
            }

            // Save JWT token
            localStorage.setItem("token", data.token);

            // Save user information
            localStorage.setItem("user", JSON.stringify(data.user));

            message.textContent = "Login successful!";

            // Redirect to main application
            window.location.href = "index.html";

        } catch (error) {

            console.error("Login error:", error);

            message.textContent = "Unable to connect to server.";
        }
    });
}


// ===============================
// REGISTER
// ===============================

const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("register-name").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const message = document.getElementById("register-message");

        message.textContent = "Creating account...";

        try {

            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.message || "Registration failed";
                return;
            }

            message.textContent = "Registration successful! Redirecting to login...";

            setTimeout(function () {
                window.location.href = "login.html";
            }, 1000);

        } catch (error) {

            console.error("Register error:", error);

            message.textContent = "Unable to connect to server.";
        }
    });
}
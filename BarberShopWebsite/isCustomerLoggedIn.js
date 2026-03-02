import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {

    const navLink = document.getElementById("profile-login");
    const logoutButton = document.getElementById("logout-button");
    const registerButton = document.getElementById("home-register-button");
    const registerButtonText = document.getElementById("home-register-button-text");
    if (!navLink) return;

    onAuthStateChanged(auth, async (user) => {

        // Not logged in
        if (!user) {
            navLink.textContent = "Sign In";
            navLink.href = "customer-login.html";
            navLink.style.display = "inline";
            registerButton.href = "register.html";
            return;
        }

        try {
            const profile = await getUserProfile(user.uid);

            // If user exists but no profile OR not a customer
            if (!profile || profile.role !== "customer") {
                navLink.textContent = "Sign In";
                navLink.href = "customer-login.html";
                navLink.style.display = "inline";
                registerButton.href = "register.html";

                return;
            }

            // Logged in as customer
            navLink.textContent = "Profile";
            navLink.href = "customer-profile.html";
            navLink.style.display = "inline";

            registerButtonText.textContent = "Profile";
            registerButton.href = "customer-profile.html";

        } catch (error) {
            console.error("Auth state check failed:", error.code, error.message);
        }

    });

    if (logoutButton) {
        logoutButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                console.log("User logged out");
                window.location.href = "./"; // redirect after logout
            } catch (error) {
                console.error("Sign-out error:", error);
                alert("Failed to log out. Try again.");
            }
        });
    }

});
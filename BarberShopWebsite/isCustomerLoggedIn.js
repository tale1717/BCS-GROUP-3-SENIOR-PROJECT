import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { getUserProfile } from "./Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {

    const navLink = document.getElementById("profile-login");
    const logoutButton = document.getElementById("logout-button");
    const registerButton = document.getElementById("home-register-button");
    const registerButtonText = document.getElementById("home-register-button-text");
    const bookNowButton = document.getElementById("book-now");
    const bookAppointmentButton = document.getElementById("book-appointment-button");

    if (!navLink) return;

    function setGuestLinks() {
        navLink.textContent = "Sign In";
        navLink.href = "customer-login.html";
        navLink.style.display = "inline";

        if (registerButton) registerButton.href = "customer-register.html";
        if (bookNowButton) bookNowButton.href = "customer-login.html";
        if (bookAppointmentButton) bookAppointmentButton.href = "customer-login.html";
    }

    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            setGuestLinks();
            return;
        }

        try {
            const profile = await getUserProfile(user.uid);

            if (!profile || profile.role !== "customer") {
                setGuestLinks();
                return;
            }

            navLink.textContent = "Profile";
            navLink.href = "customer-profile.html";
            navLink.style.display = "inline";

            if (registerButtonText) registerButtonText.textContent = "Profile";
            if (registerButton) registerButton.href = "customer-profile.html";

            if (bookNowButton) bookNowButton.href = "appointment.html";
            if (bookAppointmentButton) bookAppointmentButton.href = "appointment.html";

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
                window.location.href = "./";
            } catch (error) {
                console.error("Sign-out error:", error);
                alert("Failed to log out. Try again.");
            }
        });
    }

});
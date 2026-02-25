import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {

    const navLink = document.getElementById("profile-login");
    const logoutLink = document.getElementById("logout-link"); // optional logout anchor
    if (!navLink) return;

    onAuthStateChanged(auth, async (user) => {

        // Not logged in
        if (!user) {
            navLink.textContent = "Sign In";
            navLink.href = "customer-login.html";
            navLink.style.display = "inline";

            if (logoutLink) logoutLink.style.display = "none";
            return;
        }

        try {
            const profile = await getUserProfile(user.uid);

            // If user exists but no profile OR not a customer
            if (!profile || profile.role !== "customer") {
                navLink.textContent = "Sign In";
                navLink.href = "customer-login.html";
                navLink.style.display = "inline";

                if (logoutLink) logoutLink.style.display = "none";
                return;
            }

            // Logged in as customer
            navLink.textContent = "Profile";
            navLink.href = "customer-profile.html";
            navLink.style.display = "inline";

            // Optional Logout Support
            if (logoutLink) {
                logoutLink.style.display = "inline";
                logoutLink.onclick = async function (e) {
                    e.preventDefault();
                    await signOut(auth);
                    window.location.href = "index.html";
                };
            }

        } catch (error) {
            console.error("Auth state check failed:", error.code, error.message);
        }

    });

});
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {
    const navLink = document.getElementById("profile-login");
    if (!navLink) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            navLink.textContent = "Sign In";
            navLink.href = "customer-login.html";
            navLink.onclick = null;
            return;
        }

        const profile = await getUserProfile(user.uid);

        if (!profile || profile.role !== "customer") {
            // If logged in but not a customer, treat as signed out for customer UI
            navLink.textContent = "Sign In";
            navLink.href = "customer-login.html";
            navLink.onclick = null;
            return;
        }

        // Customer is logged in
        navLink.textContent = "Profile";
        navLink.href = "customer-profile.html";
        navLink.onclick = null;
    });
});
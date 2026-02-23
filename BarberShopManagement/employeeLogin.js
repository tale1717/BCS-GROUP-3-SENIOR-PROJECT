import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("submit");
    if (!loginBtn) return;

    loginBtn.addEventListener("click", async function () {
        const email = document.getElementById("username").value.trim();
        const password = document.getElementById("loginpassword").value;

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);

            const profile = await getUserProfile(cred.user.uid);

            if (!profile) {
                await signOut(auth);
                alert("No user profile found. Contact a manager.");
                return;
            }

            if (profile.role !== "employee" && profile.role !== "manager") {
                await signOut(auth);
                alert("Access denied. Employee accounts only.");
                return;
            }

            window.location.href = "/BarberShopManagement/dashboard.html";
        } catch (error) {
            console.error("Login failed:", error.code, error.message);
            alert("Login failed: " + error.message);
        }
    });
});
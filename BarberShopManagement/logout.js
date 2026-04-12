import { auth } from "../BarberShopWebsite/firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault(); // stops page jump

        try {
            await signOut(auth);

            window.location.href = "employeeLogin1.html";

        } catch (error) {
            console.error("Logout error:", error);
        }

    });

});
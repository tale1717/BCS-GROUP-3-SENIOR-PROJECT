// js/login.js
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "./firebase.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form.auth-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "BarberShopManagement/index.html";
        } catch (error) {
            console.error("Login failed:", error.code, error.message);
            alert("Login failed: " + error.message);
        }
    });
});
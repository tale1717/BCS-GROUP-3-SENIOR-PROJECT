// js/register.js
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { createUserProfile } from "./userModel.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const firstName = document.getElementById("FirstName").value.trim();
        const lastName = document.getElementById("LastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const dob = document.getElementById("dob").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("ConfirmPassword").value;

        if (password !== confirmPassword) {
            const pwMsg = document.getElementById("pwMsg");
            if (pwMsg) pwMsg.textContent = "Passwords do not match.";
            alert("Passwords do not match.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await createUserProfile(userCredential.user, {
                firstName,
                lastName,
                dob
            });

            alert("Registration successful! Please sign in.");
            window.location.href = "logincustomer.html";
        } catch (error) {
            console.error("Registration failed:", error.code, error.message);
            alert("Registration failed: " + error.message);
        }
    });
});
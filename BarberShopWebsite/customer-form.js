import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { createUserProfile, getUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {

    // Login form (only runs on pages that actually have signin-form)
    const signinForm = document.getElementById("signin-form");
    if (signinForm) {
        signinForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("signin-email").value.trim();
            const password = document.getElementById("signin-password").value;

            try {
                const cred = await signInWithEmailAndPassword(auth, email, password);

                const profile = await getUserProfile(cred.user.uid);
                if (!profile) {
                    await signOut(auth);
                    alert("No profile found. Please register again.");
                    return;
                }

                if (profile.role !== "customer") {
                    await signOut(auth);
                    alert("This login is for customers only.");
                    return;
                }

                window.location.href = "customer-profile.html";
            } catch (error) {
                console.error("Login failed:", error.code, error.message);
                alert("Login failed: " + error.message);
            }
        });
    }

    // Register form (only runs on pages that actually have register-form)
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const firstName = document.getElementById("first-name").value.trim();
            const lastName = document.getElementById("last-name").value.trim();
            const email = document.getElementById("customer-email").value.trim();
            const dob = document.getElementById("customer-dob").value;
            const password = document.getElementById("customer-password").value;
            const confirmPassword = document.getElementById("ConfirmPassword").value;

            if (password !== confirmPassword) {
                const pwMsg = document.getElementById("pwMsg");
                if (pwMsg) pwMsg.textContent = "Passwords do not match.";
                alert("Passwords do not match.");
                return;
            }

            try {
                const cred = await createUserWithEmailAndPassword(auth, email, password);

                await createUserProfile(
                    cred.user,
                    { firstName, lastName, dob },
                    "customer"
                );

                alert("Registration successful! You can now log in.");
                window.location.href = "customer-login.html";
            } catch (error) {
                console.error("Registration failed:", error.code, error.message);
                alert("Registration failed: " + error.message);
            }
        });
    }

});
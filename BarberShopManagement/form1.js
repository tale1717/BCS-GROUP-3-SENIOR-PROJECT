// BarberShopWebsite/form.js
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { createUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {

    const regBtn = document.getElementById("reg-button");
    const loginPageBtn = document.getElementById("loginpage");

    if (regBtn) {
        regBtn.addEventListener("click", function () {
            document.getElementById("register-div").style.display = "inline";
            document.getElementById("login-div").style.display = "none";
        });
    }

    if (loginPageBtn) {
        loginPageBtn.addEventListener("click", function () {
            document.getElementById("register-div").style.display = "none";
            document.getElementById("login-div").style.display = "inline";
        });
    }

    const loginBtn = document.getElementById("submit");
    if (loginBtn) {
        loginBtn.addEventListener("click", async function () {
            const email = document.getElementById("username").value.trim();
            const password = document.getElementById("loginpassword").value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "BarberShopManagement/index.html";
            } catch (error) {
                console.error("Login failed:", error.code, error.message);
                alert("Login failed: " + error.message);
            }
        });
    }

    const signupBtn = document.getElementById("signup");
    if (signupBtn) {
        signupBtn.addEventListener("click", async function () {
            const email = document.getElementById("reg-email").value.trim();
            const password = document.getElementById("reg-password").value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Change "customer" to "employee" if this page is for employee accounts
                await createUserProfile(
                    userCredential.user,
                    { firstName: "", lastName: "", dob: "" },
                    "customer"
                );

                alert("Registration successful! You can now log in.");
                document.getElementById("register-div").style.display = "none";
                document.getElementById("login-div").style.display = "inline";
            } catch (error) {
                console.error("Registration failed:", error.code, error.message);
                alert("Registration failed: " + error.message);
            }
        });
    }

});
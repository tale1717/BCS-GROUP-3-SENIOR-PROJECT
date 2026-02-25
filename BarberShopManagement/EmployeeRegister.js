import { createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { createUserProfile, getUserProfile } from "/BarberShopWebsite/Collections/users.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registerForm");
    if (!form) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("You must be logged in as a manager.");
            window.location.href = "/BarberShopManagement/employeeLogin.html";
            return;
        }

        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "manager") {
            await signOut(auth);
            alert("Access denied. Managers only.");
            window.location.href = "/BarberShopManagement/employeeLogin.html";
        }
    });

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

            await createUserProfile(userCredential.user, { firstName, lastName, dob }, "employee");

            alert("Employee created. Manager will need to log back in.");
        } catch (error) {
            console.error("Registration failed:", error.code, error.message);
            alert("Registration failed: " + error.message);
        }
    });
});
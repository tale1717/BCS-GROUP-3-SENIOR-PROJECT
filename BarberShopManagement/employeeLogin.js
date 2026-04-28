import { signInWithEmailAndPassword, updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

const loginCard = document.getElementById("main-login");
const tempPwdCard = document.getElementById("temp-pwd");

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

            if (
                profile.role !== "employee" &&
                profile.role !== "barber" &&
                profile.role !== "receptionist" &&
                profile.role !== "manager"
            ) {
                await signOut(auth);
                alert("Access denied. Employee accounts only.");
                return;
            }

            // TEMP PASSWORD CHECK
            if (password === "temp123") {
                loginCard.style.display = "none";
                tempPwdCard.style.display = "block";
                return;
            }

            window.location.href = "/BarberShopManagement/dashboard.html";

        } catch (error) {
            console.error("Login failed:", error.code, error.message);
            alert("Login failed: " + error.message);
        }

    });

});

document.getElementById("change-password").addEventListener("click", async function () {
    loginCard.style.display = "none";
    tempPwdCard.style.display = "block";
});

document.getElementById("go-back").addEventListener("click", async function () {
    loginCard.style.display = "block";
    tempPwdCard.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("changePasswordBtn");

    btn.addEventListener("click", async () => {

        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        const user = auth.currentUser;

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(
                user.email,
                oldPassword
            );

            // verify old password
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);

            alert("Password updated successfully. Please sign in again.");

            await signOut(auth);

            loginCard.style.display = "block";
            tempPwdCard.style.display = "none";

        } catch (error) {

            if (error.code === "auth/wrong-password") {
                alert("Old password is incorrect.");
            } else {
                alert(error.message);
            }

        }

    });

});
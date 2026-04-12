import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetEmailInput = document.getElementById("resetEmail");
const resetMessage = document.getElementById("resetMessage");
const resetBtn = document.getElementById("resetBtn");

forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = resetEmailInput.value.trim();

    resetMessage.textContent = "";

    if (!email) {
        resetMessage.textContent = "Please enter your email.";
        resetMessage.style.color = "red";
        return;
    }

    try {
        resetBtn.disabled = true;
        resetBtn.textContent = "Sending...";

        await sendPasswordResetEmail(auth, email);

        resetMessage.textContent = "Password reset link sent. Please check your email.";
        resetMessage.style.color = "green";

        forgotPasswordForm.reset();
    } catch (error) {
        console.error("Forgot password error:", error);

        if (error.code === "auth/invalid-email") {
            resetMessage.textContent = "Please enter a valid email address.";
        } else if (error.code === "auth/user-not-found") {
            resetMessage.textContent = "No account found with that email.";
        } else if (error.code === "auth/too-many-requests") {
            resetMessage.textContent = "Too many attempts. Please try again later.";
        } else {
            resetMessage.textContent = "Something went wrong. Please try again.";
        }

        resetMessage.style.color = "red";
    } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = "Send Reset Link";
    }
});
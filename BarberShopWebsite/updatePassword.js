import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import { auth } from "/BarberShopWebsite/firebase.js";

const saveBtn = document.getElementById("savePWBtn");
const cancelBtn = document.getElementById("cancelPWBtn");
const passwordBtn = document.getElementById("pwBtn");
const passwordForm = document.getElementById("passwordForm");
const editForm = document.getElementById("editForm");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
    }
});

passwordBtn.addEventListener("click", function() {
    passwordForm.style.display = "block";
    editForm.style.display = "none";
});

cancelBtn.addEventListener("click", function() {
    passwordForm.style.display = "none";
})

saveBtn.addEventListener("click", function() {
    handleChangePassword();
})


function handleChangePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword === confirmPassword) {
        changePassword(currentPassword, newPassword);
    }
    else {
        alert("Passwords do not match!");
    }
}

async function changePassword(currentPassword, newPassword) {

    const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
    );

    try {
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        alert("Password updated!");
        console.log("Password updated successfully");

        try {
            await signOut(auth);

            window.location.href = "customer-login.html";

        } catch (error) {
            console.error("Logout error:", error);
        }

    } catch (error) {
        console.error(error.message);
    }
}
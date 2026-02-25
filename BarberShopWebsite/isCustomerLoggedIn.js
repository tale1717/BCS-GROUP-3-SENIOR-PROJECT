import { firebaseConfig } from "./firebaseConfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const a = document.getElementById("profile-login");

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        a.textContent = "Profile";
        a.href = "./customer-profile.html";
    } else {
        // User is not logged in
        a.textContent = "Sign In";
        a.href = "./customer-login.html";
    }
});
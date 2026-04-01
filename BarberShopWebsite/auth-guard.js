import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import {getUserProfile} from "./Collections/users.js";

const appointmentContainer = document.getElementById("appointment-container");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "customer-login.html";
        return;
    }

    const profile = await getUserProfile(user.uid);

    if (!profile || profile.role !== "customer") {
        window.location.href = "customer-login.html";
        return;
    }

    appointmentContainer.style.display = "block";
});
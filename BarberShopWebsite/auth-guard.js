import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import {getUserProfile} from "./Collections/users";

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

    document.body.style.display = "block";
});
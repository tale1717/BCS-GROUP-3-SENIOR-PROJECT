// BarberShopWebsite/appointment-select.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

function mustGet(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
}

document.addEventListener("DOMContentLoaded", () => {
    const confirmBtn = document.getElementById("confirm-appointment");
    if (!confirmBtn) return;

    onAuthStateChanged(auth, async (user) => {
        // Not logged in: send them to login first
        if (!user) {
            confirmBtn.addEventListener("click", () => {
                alert("Please sign in first.");
                window.location.href = "customer-login.html";
            });
            return;
        }

        // Logged in but not a customer: block
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "customer") {
            confirmBtn.addEventListener("click", () => {
                alert("This booking page is for customers only.");
            });
            return;
        }

        // Customer can book
        confirmBtn.addEventListener("click", async () => {
            try {
                const barber = mustGet("barber").value;
                const date = mustGet("date").value;   // yyyy-mm-dd
                const time = mustGet("time").value;   // HH:mm
                const service = mustGet("service").value;

                if (!barber || !date || !time || !service) {
                    alert("Please fill out barber, date, time, and service.");
                    return;
                }

                // Create appointment in Firestore
                const ref = await addDoc(collection(db, "appointments"), {
                    customerUid: user.uid,
                    customerEmail: user.email || "",
                    barber,
                    date,
                    time,
                    service,
                    status: "confirmed",
                    createdAt: serverTimestamp()
                });

                // Fallback storage in case URL param is lost
                sessionStorage.setItem("lastAppointmentId", ref.id);

                // Go to confirm page with the id
                window.location.href = `appointment-confirm.html?appointmentId=${encodeURIComponent(ref.id)}`;
            } catch (err) {
                console.error("Failed to create appointment:", err);
                alert("Failed to create appointment. Check console for details.");
            }
        });
    });
});
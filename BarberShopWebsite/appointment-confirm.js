// BarberShopWebsite/appointment-confirm.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function formatDate(yyyyMmDd) {
    // Input: "2026-02-26" -> Output: "February 26, 2026"
    const d = new Date(`${yyyyMmDd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return yyyyMmDd;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(hhmm) {
    // Input: "08:26" -> Output: "8:26 AM"
    const d = new Date(`1970-01-01T${hhmm}:00`);
    if (Number.isNaN(d.getTime())) return hhmm;
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

document.addEventListener("DOMContentLoaded", async () => {
    const detailsEl = document.getElementById("confirm-details");
    const viewLink = document.getElementById("view-appointment-link");

    if (!detailsEl) return;

    const appointmentId =
        qs("appointmentId") ||
        sessionStorage.getItem("lastAppointmentId");

    if (!appointmentId) {
        detailsEl.textContent = "Missing appointment details. Please book again.";
        if (viewLink) viewLink.style.display = "none";
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        // If you want confirm page to be viewable without login, remove this block.
        if (!user) {
            detailsEl.textContent = "Please sign in to view your appointment confirmation.";
            if (viewLink) viewLink.style.display = "none";
            return;
        }

        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "customer") {
            detailsEl.textContent = "This confirmation page is for customers only.";
            if (viewLink) viewLink.style.display = "none";
            return;
        }

        try {
            const snap = await getDoc(doc(db, "appointments", appointmentId));
            if (!snap.exists()) {
                detailsEl.textContent = "Appointment not found.";
                if (viewLink) viewLink.style.display = "none";
                return;
            }

            const a = snap.data();

            // Optional safety: only allow the owner to view it
            if (a.customerUid && a.customerUid !== user.uid) {
                detailsEl.textContent = "You don’t have access to this appointment.";
                if (viewLink) viewLink.style.display = "none";
                return;
            }

            const niceDate = formatDate(a.date || "");
            const niceTime = formatTime(a.time || "");
            const barber = a.barber || "your barber";
            const service = a.service || "your service";

            detailsEl.textContent = `You will be meeting with ${barber} at ${niceTime} on ${niceDate} for your ${service}!`;

            if (viewLink) {
                viewLink.href = `appointment-confirm.html?appointmentId=${encodeURIComponent(appointmentId)}`;
            }
        } catch (err) {
            console.error("Failed to load appointment:", err);
            detailsEl.textContent = "Could not load appointment details. Check console for details.";
            if (viewLink) viewLink.style.display = "none";
        }
    });
});
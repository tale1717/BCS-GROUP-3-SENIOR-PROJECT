import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";
import { createAppointment } from "/BarberShopWebsite/Collections/appointments.js";

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("confirm-appointment");
    if (!btn) return;

    // Preselect barber from ?barber=...
    const params = new URLSearchParams(window.location.search);
    const barberParam = params.get("barber");
    const barberSelect = document.getElementById("barber");
    if (barberParam && barberSelect) {
        barberSelect.value = barberParam;
    }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Please sign in to book an appointment.");
            window.location.href = "customer-login.html";
            return;
        }

        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "customer") {
            alert("Only customers can book appointments.");
            window.location.href = "index.html";
            return;
        }

        btn.addEventListener("click", async function () {
            const barber = document.getElementById("barber").value;
            const date = document.getElementById("date").value;
            const time = document.getElementById("time").value;
            const service = document.getElementById("service").value;

            if (!barber || !date || !time || !service) {
                alert("Please fill out barber, date, time, and service.");
                return;
            }

            try {
                const appointmentId = await createAppointment(user, { barber, date, time, service });
                window.location.href = `appointment-confirm.html?id=${encodeURIComponent(appointmentId)}`;
            } catch (error) {
                console.error("Create appointment failed:", error.code, error.message);
                alert("Could not create appointment: " + error.message);
            }
        });
    });
});
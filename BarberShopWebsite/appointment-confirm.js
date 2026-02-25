import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { auth } from "/BarberShopWebsite/firebase.js";
import { getAppointmentById } from "/BarberShopWebsite/Collections/appointments.js";

document.addEventListener("DOMContentLoaded", function () {
    const confirmText = document.getElementById("confirm-text");
    if (!confirmText) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        confirmText.textContent = "No appointment ID found. Please book again.";
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            confirmText.textContent = "Please sign in to view your appointment.";
            return;
        }

        try {
            const appt = await getAppointmentById(id);

            if (!appt) {
                confirmText.textContent = "Appointment not found.";
                return;
            }

            if (appt.customerUid !== user.uid) {
                confirmText.textContent = "You do not have permission to view this appointment.";
                return;
            }

            const barber = appt.barber || "a barber";
            const service = appt.service || "a service";
            const date = appt.date || "(date unknown)";
            const time = appt.time || "(time unknown)";

            confirmText.textContent = `You will be meeting with ${barber} at ${time} on ${date} for your ${service}!`;
        } catch (error) {
            console.error("Failed to load appointment:", error.code, error.message);
            confirmText.textContent = "Could not load your appointment. Please try again.";
        }
    });
});
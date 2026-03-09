// BarberShopWebsite/appointment-select.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

// Helper: get element by id or throw
function mustGet(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
}

document.addEventListener("DOMContentLoaded", () => {
    const confirmBtn = mustGet("confirm-appointment");

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            confirmBtn.addEventListener("click", (e) => {
                e.preventDefault();
                alert("Please sign in first.");
                window.location.href = "customer-login.html";
            });
            return;
        }

        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "customer") {
            confirmBtn.addEventListener("click", (e) => {
                e.preventDefault();
                alert("This booking page is for customers only.");
            });
            return;
        }

        // Customer can book
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault(); // stop default button navigation

            try {
                const barber = mustGet("barber").value.trim();
                const date = mustGet("date").value.trim();   // yyyy-mm-dd
                const time = mustGet("time").value.trim();   // HH:mm
                const service = mustGet("service").value.trim();

                console.log("Booking values:", barber, date, time, service, user.uid);

                if (!barber || !date || !time || !service) {
                    alert("Please fill out barber, date, time, and service.");
                    return;
                }

                // Deterministic document ID to prevent double bookings
                const appointmentId = `${barber}_${date}_${time}`;
                const ref = doc(db, "appointments", appointmentId); // collection/document (even segments!)

                // Check if this slot already exists
                const existing = await getDoc(ref);
                if (existing.exists()) {
                    alert("This time slot is already booked.");
                    return;
                }

                // Save appointment to Firestore
                await setDoc(ref, {
                    customerUid: user.uid,
                    customerEmail: user.email || "",
                    barber,
                    date,
                    time,
                    service,
                    status: "confirmed",
                    createdAt: serverTimestamp()
                });

                // Store last appointment ID for confirmation page
                sessionStorage.setItem("lastAppointmentId", appointmentId);

                // Redirect after successful booking
                window.location.href = `appointment-confirm.html?appointmentId=${encodeURIComponent(appointmentId)}`;
            } catch (err) {
                console.error("Failed to create appointment:", err);
                alert("Failed to create appointment. Check console for details.");
            }
        });
    });
});
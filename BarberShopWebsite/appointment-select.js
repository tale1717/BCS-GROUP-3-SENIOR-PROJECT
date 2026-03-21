import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";
import { getServices } from "/BarberShopWebsite/Collections/services.js";

let allServices = [];

function mustGet(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
}

document.addEventListener("DOMContentLoaded", async () => {
    const confirmBtn = mustGet("confirm-appointment");

    await loadServices();

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

        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            try {
                const barber = mustGet("barber").value.trim();
                const date = mustGet("date").value.trim();
                const time = mustGet("time").value.trim();
                const selectedServiceId = mustGet("service").value.trim();

                const selectedService = allServices.find(s => s.id === selectedServiceId);

                if (!barber || !date || !time || !selectedService) {
                    alert("Please fill out barber, date, time, and service.");
                    return;
                }

                const appointmentId = `${barber}_${date}_${time}`;
                const ref = doc(db, "appointments", appointmentId);

                const existing = await getDoc(ref);
                if (existing.exists()) {
                    alert("This time slot is already booked.");
                    return;
                }

                await setDoc(ref, {
                    customerUid: user.uid,
                    customerEmail: user.email || "",
                    barber,
                    date,
                    time,
                    serviceId: selectedService.id,
                    serviceName: selectedService.serviceName,
                    servicePrice: selectedService.price,
                    serviceDuration: selectedService.duration,
                    status: "upcoming",
                    createdAt: serverTimestamp()
                });

                sessionStorage.setItem("lastAppointmentId", appointmentId);

                window.location.href = `appointment-confirm.html?appointmentId=${encodeURIComponent(appointmentId)}`;
            } catch (err) {
                console.error("Failed to create appointment:", err);
                alert("Failed to create appointment. Check console for details.");
            }
        });
    });
});

async function loadServices() {
    allServices = await getServices();

    const serviceSelect = mustGet("service");
    serviceSelect.innerHTML = `<option value="">Select a service</option>`;

    allServices.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = `${service.serviceName} ($${service.price}, ${service.duration} min)`;
        serviceSelect.appendChild(option);
    });
}
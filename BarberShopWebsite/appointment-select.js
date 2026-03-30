import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, collection, query, where, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";
import { getServices } from "/BarberShopWebsite/Collections/services.js";
import { getAppointments } from "./Collections/appointments.js";

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

                if (!barber || barber==="Select Barber"
                    || !date
                    || !time || time==="Select Time"
                    || !selectedService) {
                    alert("Please fill out barber, date, time, and service.");
                    return;
                }

                const appointmentID = await generateAppointmentID();
                const appointmentsRef = collection(db, "appointments");

                const q = query(
                    appointmentsRef,
                    where("barber", "==", barber),
                    where("date", "==", date),
                    where("time", "==", time)
                );

                const existing = await getDocs(q);

                if (!existing.empty) {
                    alert("This time slot is already booked.");
                    return;
                }

                const appointmentRef = doc(db, "appointments", appointmentID);

                await setDoc(appointmentRef, {
                    appointmentID: appointmentID,
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

                sessionStorage.setItem("lastAppointmentId", appointmentID);

                window.location.href = `appointment-confirm.html?appointmentId=${encodeURIComponent(appointmentID)}`;
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

async function generateAppointmentID(){
    const appointments =
        await getAppointments();
    let max = 0;
    appointments.forEach(a=>{
        const id =
            a.appointmentID || a.id;
        if(!id) return;
// Only count IDs like A00001 because the previous one has different format
        if(!/^A\d{6}$/.test(id))
            return;
        const num =
            parseInt(id.slice(1));
        if(num > max)
            max = num;
    });
    return "A"+
        String(max + 1).padStart(6,'0');
}
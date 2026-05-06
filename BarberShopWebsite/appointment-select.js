import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, collection, query, where, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";
import { getServices } from "/BarberShopWebsite/Collections/services.js";
import { getStaff } from "/BarberShopWebsite/Collections/staff.js";
import { getAppointments } from "./Collections/appointments.js";

let allServices = [];
let allStaff = [];

function mustGet(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
}

async function getCustomerByEmail(email) {
    try {
        const customersRef = collection(db, "customers"); // your customers collection name
        const q = query(customersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        } else {
            console.warn("No customer found with email:", email);
            return null;
        }
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const confirmBtn = mustGet("confirm-appointment");

    await loadStaff();
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
                    const barberSelect = mustGet("barber");
                    const staffID = barberSelect.value.trim();
                    const barber = barberSelect.options[barberSelect.selectedIndex]?.textContent.trim() || "";
                    const date = mustGet("date").value.trim();
                    const time = mustGet("time").value.trim();
                    const serviceSelect = mustGet("service");
                    const selectedServiceIds = Array.from(serviceSelect.selectedOptions).map(o => o.value);
                    const selectedServices = allServices.filter(s => selectedServiceIds.includes(s.id));
                    const customerProfile = await getCustomerByEmail(user.email);

                    if (!staffID
                        || !barber
                        || !date
                        || !time
                        || time === "Select Time"
                        || selectedServices.length === 0) {
                        alert("Please fill out barber, date, time, and at least one service.");
                        return;
                    }

                    const appointmentID = await generateAppointmentID();
                    const appointmentsRef = collection(db, "appointments");

                    const q = query(
                        appointmentsRef,
                        where("staffID", "==", staffID),
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
                        customerID: customerProfile.customerID,
                        customerEmail: user.email || "",
                        staffID,
                        barber,
                        date,
                        time,
                        services: selectedServices.map(s => ({
                            serviceId: s.id,
                            serviceName: s.serviceName,
                            servicePrice: s.price,
                            serviceDuration: s.duration,
                        })),
                        serviceName: selectedServices.map(s => s.serviceName).join(", "),
                        totalCost: selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
                        totalPrice: selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
                        totalDuration: selectedServices.reduce((sum, s) => sum + Number(s.duration || 0), 0),
                        status: "confirmed",
                        createdAt: serverTimestamp()
                    });

                // SEND EMAIL so when user clicks confirm button it sends the email!
                try {
                    await emailjs.send("service_4siyc8o", "template_noefnqt", {
                        barber: barber,
                        date: date,
                        time: time,
                        service: selectedServices.map(s => s.serviceName).join(", "),
                        to_email: user.email
                    });

                    console.log("Email sent!");
                } catch (error) {
                    console.error("Email failed:", error);
                    alert("Appointment was saved, but the email could not be sent.");
                }

                sessionStorage.setItem("lastAppointmentId", appointmentID);
                window.location.href = `appointment-confirm.html?appointmentId=${encodeURIComponent(appointmentID)}`;


            } catch (err) {
                console.error("Failed to create appointment:", err);
                alert("Failed to create appointment. Check console for details.");
            }
        });
    });
});

async function loadStaff() {
    allStaff = await getStaff();

    const barberSelect = mustGet("barber");
    barberSelect.innerHTML = `<option value="">Select Barber</option>`;

    const barbers = allStaff.filter(staff =>
        String(staff.position || "").trim().toLowerCase() === "barber"
    );

    barbers.forEach(barber => {
        const option = document.createElement("option");
        option.value = barber.id;
        option.textContent = barber.name || "Unnamed Barber";

        if (barber.workingHours) {
            option.dataset.workingHours = JSON.stringify(barber.workingHours);
        }

        barberSelect.appendChild(option);
    });
}

async function loadServices() {
    allServices = await getServices();
    const serviceSelect = mustGet("service");
    serviceSelect.innerHTML = ""; // No default placeholder needed

    allServices.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = `${service.serviceName} ($${service.price}, ${service.duration} min)`;
        serviceSelect.appendChild(option);
    });

    serviceSelect.addEventListener("mousedown", function (e) {
        e.preventDefault();
        const option = e.target;
        if (option.tagName !== "OPTION") return;
        option.selected = !option.selected;
        serviceSelect.focus();
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

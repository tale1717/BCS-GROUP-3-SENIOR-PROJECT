console.log("appointmentsModule loaded");

import {
    createAppointment,
    getAppointments,
    updateAppointment,
    deleteAppointment
} from "../BarberShopWebsite/Collections/appointments.js";

import {
    getUserProfile
} from "../BarberShopWebsite/Collections/users.js";

import {
    getServices
} from "../BarberShopWebsite/Collections/services.js";

let allAppointments = [];
let allServices = [];
let userCache = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadServices();
    await loadAppointments();
    setupSearch();
    setupCreate();

    document.getElementById("cancelAppointment").onclick = () => {
        document.getElementById("appointmentModal").style.display = "none";
    };
}

async function loadServices() {
    allServices = await getServices();
    populateServiceDropdown();
}




// Generate Appointment ID (MMDDYY0001)
async function generateAppointmentID(){

    const appointments = await getAppointments();

    const today = new Date();

    const mm = String(today.getMonth()+1).padStart(2,'0');
    const dd = String(today.getDate()).padStart(2,'0');
    const yy = String(today.getFullYear()).slice(-2);

    const prefix = mm+dd+yy;

    let max = 0;

    appointments.forEach(a=>{

        const id = a.appointmentID || a.id;

        if(id && id.startsWith(prefix)){

            const num = parseInt(id.slice(6)) || 0;

            if(num > max) max = num;

        }

    });

    const next = max + 1;

    return prefix + String(next).padStart(4,'0');

}

function populateServiceDropdown() {
    const select = document.getElementById("a-service");
    if (!select) return;

    select.innerHTML = `<option value="">Select a service</option>`;

    allServices.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = `${service.serviceName} - $${service.price} - ${service.duration} min`;
        select.appendChild(option);
    });
}

async function loadAppointments() {
    allAppointments = await getAppointments();
    await renderTable(allAppointments);
}

async function renderTable(list) {
    const body = document.getElementById("appointment-body");
    body.innerHTML = "";

    for (const a of list) {
        if (a.customerUid && !userCache[a.customerUid]) {
            const user = await getUserProfile(a.customerUid);
            userCache[a.customerUid] = user
                ? user.firstName + " " + user.lastName
                : "Unknown";
        }

        const customerName = a.customerUid
            ? userCache[a.customerUid]
            : (a.customer || "Unknown");

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${a.appointmentID || a.id}</td>
            <td>${customerName}</td>
            <td>${a.barber || ""}</td>
            <td>${a.serviceName || a.service || ""}</td>
            <td>${a.date || ""}</td>
            <td>${a.time || ""}</td>
            <td><span class="status ${a.status || "upcoming"}">${a.status || "upcoming"}</span></td>
            <td>
                <button class="edit" data-id="${a.id}">Edit</button>
                <button class="delete" data-id="${a.id}">Cancel</button>
            </td>
        `;

        body.appendChild(row);
    }

    setupActions();
}

//searching function//
function setupSearch() {
    const input = document.getElementById("searchAppointment");
    if (!input) return;

    input.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();

        const filtered = allAppointments.filter(a => {
            const name = (userCache[a.customerUid] || a.customer || "").toLowerCase();

            return (
                name.includes(term) ||
                (a.barber || "").toLowerCase().includes(term) ||
                ((a.serviceName || a.service || "").toLowerCase().includes(term)) ||
                (a.date || "").toLowerCase().includes(term) ||
                (a.time || "").toLowerCase().includes(term)
            );
        });

        renderTable(filtered);
    });
}

//create
function setupCreate() {
    const btn = document.getElementById("createAppointmentBtn");
    const modal = document.getElementById("appointmentModal");

    if (!btn || !modal) {
        console.error("Create button or modal not found");
        return;
    }

    btn.onclick = () => {
        modal.style.display = "block";
    };

    const saveBtn = document.getElementById("saveAppointment");
    if (!saveBtn) return;

    saveBtn.onclick = async () => {
        console.log("Creating appointment..."); // safty check before save
        const selectedServiceId = document.getElementById("a-service").value;
        const selectedService = allServices.find(s => s.id === selectedServiceId);


        if (!selectedService) {
            alert("Please select a service.");
            return;
        }
        const appointmentID =
            await generateAppointmentID();
        console.log("Generated:",appointmentID);

        await createAppointment({

            appointmentID:appointmentID,
            customerID:
            document.getElementById("a-customer").value,
            staffID:
            document.getElementById("a-barber").value,
            serviceId:selectedService.id,
            date:
            document.getElementById("a-date").value,
            time:
            document.getElementById("a-time").value,
            status:
                document.getElementById("a-status").value || "upcoming"

        });



        modal.style.display = "none";
        loadAppointments();
    };
}

function setupActions() {
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Cancel this appointment?")) return;

            await deleteAppointment(btn.dataset.id);
            loadAppointments();
        };
    });
}
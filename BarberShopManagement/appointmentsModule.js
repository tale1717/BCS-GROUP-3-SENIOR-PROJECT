console.log("appointmentsModule loaded");

import {
    createAppointment,
    getAppointments,
    updateAppointment,
    deleteAppointment
} from "../BarberShopWebsite/Collections/appointments.js";

import {
    getCustomers
} from "../BarberShopWebsite/Collections/customers.js";

import {
    getStaff
} from "../BarberShopWebsite/Collections/staff.js";

import {
    getUserProfile
} from "../BarberShopWebsite/Collections/users.js";

import {
    getServices
} from "../BarberShopWebsite/Collections/services.js";

let allAppointments = [];
let allServices = [];
let userCache = {};
let allCustomers = [];
let allStaff = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadCustomers();
    await loadStaff();
    await loadServices();
    await loadAppointments();

    setupSearch();
    setupCreate();
    setupEdit();
    setupUpdateButton();
    setupCancelButtons();

    document.getElementById("cancelAppointment").onclick = () => {
        document.getElementById("appointmentModal").style.display = "none";
    };
}

async function loadServices() {
    allServices = await getServices();
    populateServiceDropdown();
}

async function loadCustomers() {
    allCustomers = await getCustomers();

    const select = document.getElementById("a-customer");
    if (!select) return;

    select.innerHTML = `<option value="">Select Customer</option>`;

    allCustomers.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        select.appendChild(option);
    });
}

async function loadStaff() {
    allStaff = await getStaff();

    const select = document.getElementById("a-barber");
    if (!select) return;

    select.innerHTML = `<option value="">Select Barber</option>`;

    allStaff
        .filter(s => s.position === "Barber")
        .forEach(b => {
            const option = document.createElement("option");
            option.value = b.id;
            option.textContent = b.name;
            select.appendChild(option);
        });
}

async function generateAppointmentID() {
    const appointments = await getAppointments();
    let max = 0;

    appointments.forEach(a => {
        const id = a.appointmentID || a.id;
        if (!id) return;

        if (!/^A\d{6}$/.test(id)) return;

        const num = parseInt(id.slice(1));
        if (num > max) max = num;
    });

    return "A" + String(max + 1).padStart(6, "0");
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
            <td>${a.notes || ""}</td>
            <td><span class="status ${a.status || "upcoming"}">${a.status || "upcoming"}</span></td>
            <td>
                <button class="edit" data-id="${a.id}">Edit</button>
                <button class="delete" data-id="${a.id}">Delete</button>
            </td>
        `;

        body.appendChild(row);
    }

    setupActions();
    setupEdit();
}

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
                (a.serviceName || a.service || "").toLowerCase().includes(term) ||
                (a.date || "").toLowerCase().includes(term) ||
                (a.time || "").toLowerCase().includes(term) ||
                (a.notes || "").toLowerCase().includes(term)
            );
        });

        renderTable(filtered);
    });
}

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
        const customerSelect = document.getElementById("a-customer");
        const barberSelect = document.getElementById("a-barber");
        const selectedServiceId = document.getElementById("a-service").value;

        const selectedService = allServices.find(s => s.id === selectedServiceId);

        if (!customerSelect.value) {
            alert("Please select a customer.");
            return;
        }

        if (!barberSelect.value) {
            alert("Please select a barber.");
            return;
        }

        if (!selectedService) {
            alert("Please select a service.");
            return;
        }

        const appointmentID = await generateAppointmentID();

        await createAppointment({
            appointmentID: appointmentID,
            customerID: customerSelect.value,
            customer: customerSelect.options[customerSelect.selectedIndex]?.text || "",
            staffID: barberSelect.value,
            barber: barberSelect.options[barberSelect.selectedIndex]?.text || "",
            serviceId: selectedService.id,
            serviceName: selectedService.serviceName,
            servicePrice: selectedService.price,
            serviceDuration: selectedService.duration,
            date: document.getElementById("a-date").value,
            time: document.getElementById("a-time").value,
            notes: document.getElementById("a-notes")?.value || "",
            status: document.getElementById("a-status").value || "upcoming"
        });

        modal.style.display = "none";
        await loadAppointments();
    };
}

function populateEditDropdowns() {
    const customerSelect = document.getElementById("edit-customer");
    customerSelect.innerHTML = `<option value="">Select Customer</option>`;

    allCustomers.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.name;
        customerSelect.appendChild(option);
    });

    const barberSelect = document.getElementById("edit-barber");
    barberSelect.innerHTML = `<option value="">Select Barber</option>`;

    allStaff
        .filter(s => s.position === "Barber")
        .forEach(b => {
            const option = document.createElement("option");
            option.value = b.id;
            option.textContent = b.name;
            barberSelect.appendChild(option);
        });

    const serviceSelect = document.getElementById("edit-service");
    serviceSelect.innerHTML = `<option value="">Select Service</option>`;

    allServices.forEach(s => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.serviceName;
        serviceSelect.appendChild(option);
    });
}

function setupEdit() {
    document.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = () => {
            const appointment = allAppointments.find(a => a.id === btn.dataset.id);
            if (!appointment) return;

            populateEditDropdowns();

            document.getElementById("edit-id").value = appointment.id;
            document.getElementById("edit-date").value = appointment.date || "";
            document.getElementById("edit-time").value = appointment.time || "";
            document.getElementById("edit-status").value = appointment.status || "upcoming";
            document.getElementById("edit-note").value = appointment.notes || "";

            document.getElementById("edit-customer").value = appointment.customerID || "";
            document.getElementById("edit-barber").value = appointment.staffID || "";
            document.getElementById("edit-service").value = appointment.serviceId || "";

            document.getElementById("editAppointmentModal").style.display = "block";
        };
    });
}

function setupUpdateButton() {
    const updateBtn = document.getElementById("updateAppointment");
    if (!updateBtn) return;

    updateBtn.onclick = async () => {
        const id = document.getElementById("edit-id").value;

        const customerSelect = document.getElementById("edit-customer");
        const barberSelect = document.getElementById("edit-barber");
        const serviceSelect = document.getElementById("edit-service");

        const selectedService = allServices.find(s => s.id === serviceSelect.value);

        if (!customerSelect.value) {
            alert("Please select a customer.");
            return;
        }

        if (!barberSelect.value) {
            alert("Please select a barber.");
            return;
        }

        if (!selectedService) {
            alert("Please select a service.");
            return;
        }

        try {
            await updateAppointment(id, {
                customerID: customerSelect.value,
                customer: customerSelect.options[customerSelect.selectedIndex]?.text || "",
                staffID: barberSelect.value,
                barber: barberSelect.options[barberSelect.selectedIndex]?.text || "",
                serviceId: selectedService.id,
                serviceName: selectedService.serviceName,
                servicePrice: selectedService.price,
                serviceDuration: selectedService.duration,
                date: document.getElementById("edit-date").value,
                time: document.getElementById("edit-time").value,
                notes: document.getElementById("edit-note").value || "",
                status: document.getElementById("edit-status").value
            });

            document.getElementById("editAppointmentModal").style.display = "none";
            await loadAppointments();
        } catch (error) {
            console.error("Failed to update appointment:", error);
            alert("Failed to update appointment.");
        }
    };
}

function setupCancelButtons() {
    const cancelEditBtn = document.getElementById("cancelEditAppointment");
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            document.getElementById("editAppointmentModal").style.display = "none";
        };
    }
}

function setupActions() {
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Delete this appointment?")) return;

            await deleteAppointment(btn.dataset.id);
            await loadAppointments();
        };
    });
}
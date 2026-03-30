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
    await loadServices();
    await loadAppointments();
    setupSearch();
    await loadCustomers();
    await loadStaff();
    setupCreate();
    setupActions();
    setupEdit()

    document.getElementById("cancelAppointment").onclick = () => {
        document.getElementById("appointmentModal").style.display = "none";
    };
}

async function loadServices() {
    allServices = await getServices();
    populateServiceDropdown();
}

//listdown customer name
async function loadCustomers(){
    allCustomers = await getCustomers();
    const select =
        document.getElementById("a-customer");
    select.innerHTML =
        `<option value="">Select Customer</option>`;
    allCustomers.forEach(c=>{
        const option =
            document.createElement("option");
        option.value = c.customerID;
        option.textContent = c.name;
        select.appendChild(option);
    });

}

//list down barber name
async function loadStaff(){
    allStaff = await getStaff();
    const select =
        document.getElementById("a-barber");
    if(!select) return;
    select.innerHTML =
        `<option value="">Select Barber</option>`;
    allStaff
        .filter(s=>s.position==="Barber")
        .forEach(b=>{
            const option =
                document.createElement("option");
            option.value = b.staffID;
            option.textContent = b.name;
            select.appendChild(option);
        });
}

//genertae ID
async function generateAppointmentID(){
    const appointments =
        await getAppointments();
    let max = 0;
    appointments.forEach(a=>{
        const id =
            a.appointmentID || a.id;
        if(!id) return;
// Only count IDs like A00001 because the prvious one has different format
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

//load appointments
async function loadAppointments() {
    allAppointments = await getAppointments();
    await renderTable(allAppointments);
}

//render table
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
                <button class="delete" data-id="${a.id}">Delete</button>
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

        const customerSelect =
            document.getElementById("a-customer");

        const barberSelect =
            document.getElementById("a-barber");

        const selectedServiceId =
            document.getElementById("a-service").value;

        const selectedService =
            allServices.find(
                s=>s.id===selectedServiceId
            );

        if(!selectedService){

            alert("Please select service");

            return;

        }

        const appointmentID =
            await generateAppointmentID();

        await createAppointment({

            appointmentID:appointmentID,

            customerID:
            customerSelect.value,

            customer:
            customerSelect.options[
                customerSelect.selectedIndex
                ].text,

            staffID:
            barberSelect.value,

            barber:
            barberSelect.options[
                barberSelect.selectedIndex
                ].text,

            serviceId:selectedService.id,

            serviceName:selectedService.serviceName,

            servicePrice:selectedService.price,

            serviceDuration:selectedService.duration,

            date:
            document.getElementById("a-date").value,

            time:
            document.getElementById("a-time").value,

            status:
            document.getElementById("a-status").value

        });

        modal.style.display="none";

        loadAppointments();

    };
}

//Edit Appointment
function setupEdit(){

    document.querySelectorAll(".edit")
        .forEach(btn=>{

            btn.onclick = ()=>{
                populateEditDropdowns();

                const appointment =
                    allAppointments.find(
                        a=>a.id===btn.dataset.id
                    );

                document.getElementById("edit-id").value =
                    appointment.id;
                document.getElementById("edit-date").value =
                    appointment.date;
                document.getElementById("edit-time").value =
                    appointment.time;
                document.getElementById("edit-status").value =
                    appointment.status;
// preselect values
                document.getElementById("edit-customer").value =
                    appointment.customerID;
                document.getElementById("edit-barber").value =
                    appointment.staffID;
                document.getElementById("edit-service").value =
                    appointment.serviceId;
                document.getElementById("editAppointmentModal")
                    .style.display="block";
            };
        });


}

//update appointment
document
    .getElementById("updateAppointment")
    .onclick = async ()=>{
    const id =
        document.getElementById("edit-id").value;
    await updateAppointment(id,{
        date:
        document.getElementById("edit-date").value,
        time:
        document.getElementById("edit-time").value,
        status:
        document.getElementById("edit-status").value
    });
    document.getElementById("editAppointmentModal")
        .style.display="none";
    loadAppointments();
};

//list down list of customer , barber and service in edit modal
function populateEditDropdowns(){
// customers
    const customerSelect =
        document.getElementById("edit-customer");
    customerSelect.innerHTML =
        `<option value="">Select Customer</option>`;
    allCustomers.forEach(c=>{
        const option =
            document.createElement("option");
        option.value = c.customerID;
        option.textContent = c.name;
        customerSelect.appendChild(option);
    });


// barbers
    const barberSelect =
        document.getElementById("edit-barber");
    barberSelect.innerHTML =
        `<option value="">Select Barber</option>`;
    allStaff
        .filter(s=>s.position==="Barber")
        .forEach(b=>{
            const option =
                document.createElement("option");
            option.value = b.staffID;
            option.textContent = b.name;
            barberSelect.appendChild(option);
        });

// services
    const serviceSelect =
        document.getElementById("edit-service");
    serviceSelect.innerHTML =
        `<option value="">Select Service</option>`;
    allServices.forEach(s=>{
        const option =
            document.createElement("option");
        option.value = s.id;
        option.textContent =
            s.serviceName;
        serviceSelect.appendChild(option);
    });
}

//cancel edit
document
    .getElementById("cancelEditAppointment")
    .onclick = ()=>{

    document.getElementById("editAppointmentModal")
        .style.display="none";

};

document
    .getElementById("cancelEditAppointment")
    .onclick = ()=>{

    document.getElementById("editAppointmentModal")
        .style.display="none";

};



function setupActions() {
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Cancel this appointment?")) return;

            await deleteAppointment(btn.dataset.id);
            loadAppointments();
        };
    });
}
import {
    createAppointment,
    getAppointments,
    updateAppointment,
    deleteAppointment
} from "../Collections/appointments.js";

let allAppointments = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {

    await loadAppointments();
    setupSearch();
    setupCreate();

}

async function loadAppointments() {

    allAppointments = await getAppointments();
    renderTable(allAppointments);

}

function renderTable(list){

    const body = document.getElementById("appointment-body");
    body.innerHTML = "";

    list.forEach(a => {

        const row = document.createElement("tr");

        row.innerHTML = `
<td>${a.customer}</td>
<td>${a.barber}</td>
<td>${a.service}</td>
<td>${formatDate(a.datetime)}</td>
<td>$${a.price}</td>
<td><span class="status ${a.status}">${a.status}</span></td>
<td>
<button class="edit" data-id="${a.id}">Edit</button>
<button class="delete" data-id="${a.id}">Cancel</button>
</td>
`;

        body.appendChild(row);

    });

    setupActions();

}

function formatDate(date){

    const d = new Date(date);

    return d.toLocaleString();

}


function setupSearch(){

    const input = document.getElementById("searchAppointment");

    input.addEventListener("input", e => {

        const term = e.target.value.toLowerCase();

        const filtered = allAppointments.filter(a =>
            a.customer.toLowerCase().includes(term) ||
            a.barber.toLowerCase().includes(term) ||
            a.service.toLowerCase().includes(term)
        );

        renderTable(filtered);

    });

}


function setupCreate(){

    const btn = document.getElementById("createAppointmentBtn");
    const modal = document.getElementById("appointmentModal");

    btn.onclick = () => modal.style.display = "block";

    document.getElementById("saveAppointment").onclick = async () => {

        await createAppointment({
            customer: document.getElementById("a-customer").value,
            barber: document.getElementById("a-barber").value,
            service: document.getElementById("a-service").value,
            price: document.getElementById("a-price").value,
            datetime: document.getElementById("a-datetime").value,
            status: document.getElementById("a-status").value
        });

        modal.style.display = "none";

        loadAppointments();

    };

}


function setupActions(){

    document.querySelectorAll(".delete").forEach(btn => {

        btn.onclick = async () => {

            if(!confirm("Cancel this appointment?")) return;

            await deleteAppointment(btn.dataset.id);

            loadAppointments();

        };

    });

}
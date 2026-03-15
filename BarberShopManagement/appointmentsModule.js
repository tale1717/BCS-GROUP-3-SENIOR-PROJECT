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

let allAppointments = [];
let userCache = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {

    await loadAppointments();
    setupSearch();
    setupCreate();

    // Close create new appointment modal when clicking Cancel
    document.getElementById("cancelAppointment").onclick = () => {
        document.getElementById("appointmentModal").style.display = "none";
    };

}

async function loadAppointments() {

    allAppointments = await getAppointments();
    await renderTable(allAppointments);

}

async function renderTable(list) {
    const body = document.getElementById("appointment-body");
    body.innerHTML = "";

    for (const a of list) {

        if (!userCache[a.customerUid]) {
            const user = await getUserProfile(a.customerUid);
            userCache[a.customerUid] = user
                ? user.firstName + " " + user.lastName
                : "Unknown";
        }

        const customerName = userCache[a.customerUid];

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${customerName}</td>
            <td>${a.barber}</td>
            <td>${a.service}</td>
            <td>${a.date}</td>
            <td>${a.time}</td>
            <td><span class="status ${a.status}">${a.status}</span></td>
            <td>
                <button class="edit" data-id="${a.id}">Edit</button>
                <button class="delete" data-id="${a.id}">Cancel</button>
            </td>
        `;

        body.appendChild(row);
    }

    setupActions();
}

function formatDate(date){

    const d = new Date(date);

    return d.toLocaleString();

}


function setupSearch(){

    const input = document.getElementById("searchAppointment");
    if(!input) return;

    input.addEventListener("input", e => {

        const term = e.target.value.toLowerCase();

        const filtered = allAppointments.filter(a => {

            const name = (userCache[a.customerUid] || "").toLowerCase();

            return (
                name.includes(term) ||
                (a.barber || "").toLowerCase().includes(term) ||
                (a.service || "").toLowerCase().includes(term) ||
                (a.date || "").toLowerCase().includes(term) ||
                (a.time || "").toLowerCase().includes(term)
            );

        });

        renderTable(filtered);

    });

}


function setupCreate(){

    const btn = document.getElementById("createAppointmentBtn");
    const modal = document.getElementById("appointmentModal");

    if(!btn || !modal){
        console.error("Create button or modal not found");
        return;
    }

    btn.onclick = () => {
        modal.style.display = "block";
    };

    const saveBtn = document.getElementById("saveAppointment");

    if(!saveBtn) return;

    saveBtn.onclick = async () => {

        await createAppointment({
            customer: document.getElementById("a-customer").value,
            barber: document.getElementById("a-barber").value,
            service: document.getElementById("a-service").value,
            date: document.getElementById("a-date").value,
            time: document.getElementById("a-time").value,
            status: document.getElementById("a-status").value
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
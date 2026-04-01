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
    setupEdit();

    document.getElementById("cancelAppointment").onclick = ()=>{
        document.getElementById("appointmentModal").style.display="none";
    };

    document.getElementById("cancelEditAppointment").onclick = ()=>{
        document.getElementById("editAppointmentModal").style.display="none";
    };

}

//load service
async function loadServices(){
    allServices = await getServices();
    populateServiceDropdown();
}

//load customer
async function loadCustomers(){

    allCustomers = await getCustomers();

    const select =
        document.getElementById("a-customer");

    select.innerHTML =
        `<option value="">Select Customer</option>`;

    allCustomers.forEach(c=>{

        const option =
            document.createElement("option");

        option.value = String(c.customerID);
        option.textContent = c.name;

        select.appendChild(option);

    });

}

//load staff
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

            option.value = String(b.staffID);
            option.textContent = b.name;

            select.appendChild(option);

        });

}

//generate ID with format A######
async function generateAppointmentID(){

    const appointments =
        await getAppointments();

    let max = 0;

    appointments.forEach(a=>{

        const id =
            a.appointmentID || a.id;

        if(!id) return;

        if(!/^A\d{6}$/.test(id))
            return;

        const num =
            parseInt(id.slice(1));

        if(num > max)
            max = num;

    });

    return "A"+
        String(max+1).padStart(6,'0');

}

//service dropdown
function populateServiceDropdown(){

    const select =
        document.getElementById("a-service");

    if(!select) return;

    select.innerHTML =
        `<option value="">Select a service</option>`;

    allServices.forEach(service=>{

        const option =
            document.createElement("option");

        option.value = service.id;

        option.textContent =
            `${service.serviceName} - $${service.price} - ${service.duration} min`;

        select.appendChild(option);

    });

}


//load Appointment
async function loadAppointments(){

    allAppointments =
        await getAppointments();

    renderTable(allAppointments);

}

//render table
async function renderTable(list){

    const body =
        document.getElementById("appointment-body");

    body.innerHTML="";

    for(const a of list){

        if(a.customerUid && !userCache[a.customerUid]){

            const user =
                await getUserProfile(a.customerUid);

            userCache[a.customerUid] =
                user ?
                    user.firstName+" "+user.lastName :
                    "Unknown";

        }

        const customerName =
            a.customerUid ?
                userCache[a.customerUid] :
                (a.customer || "Unknown");

        const row =
            document.createElement("tr");

        row.innerHTML=`

        <td>${a.appointmentID || a.id}</td>
        <td>${customerName}</td>
        <td>${a.barber || ""}</td>
        <td>${a.serviceName || ""}</td>
        <td>${a.date || ""}</td>
        <td>${a.time || ""}</td>
        <td>${a.notes || ""}</td>

        <td>
        <span class="status ${a.status || "upcoming"}">
        ${a.status || "upcoming"}
        </span>
        </td>

        <td>
        <button class="edit" data-id="${a.id}">
        Edit
        </button>

        <button class="delete" data-id="${a.id}">
        Delete
        </button>
        </td>

        `;

        body.appendChild(row);

    }

    setupActions();
    setupEdit();

}

//search function
function setupSearch(){

    const input =
        document.getElementById("searchAppointment");

    if(!input) return;

    input.addEventListener("input",e=>{

        const term =
            e.target.value.toLowerCase();

        const filtered =
            allAppointments.filter(a=>{

                const name =
                    (a.customer || "")
                        .toLowerCase();

                return(
                    name.includes(term) ||
                    (a.barber||"").toLowerCase().includes(term) ||
                    (a.serviceName||"").toLowerCase().includes(term) ||
                    (a.date||"").includes(term) ||
                    (a.time||"").includes(term)
                );

            });

        renderTable(filtered);

    });

}


//create new appointment
function setupCreate(){

    const btn =
        document.getElementById("createAppointmentBtn");

    const modal =
        document.getElementById("appointmentModal");

    if(!btn || !modal) return;

    btn.onclick = ()=>{
        modal.style.display="block";
    };

    document.getElementById("saveAppointment")
        .onclick = async ()=>{

        const customerSelect =
            document.getElementById("a-customer");

        const barberSelect =
            document.getElementById("a-barber");

        const serviceId =
            document.getElementById("a-service").value;

        const service =
            allServices.find(
                s=>s.id===serviceId
            );

        if(!service){
            alert("Select service");
            return;
        }

        const appointmentID =
            await generateAppointmentID();

        await createAppointment({

            appointmentID,

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

            serviceId:service.id,
            serviceName:service.serviceName,
            servicePrice:service.price,
            serviceDuration:service.duration,

            date:
            document.getElementById("a-date").value,

            time:
            document.getElementById("a-time").value,

            notes:
                document.getElementById("a-notes")?.value || "",

            status:
            document.getElementById("a-status").value

        });

        modal.style.display="none";

        loadAppointments();

    };

}

//edit appointment
function setupEdit(){

    document
        .querySelectorAll(".edit")
        .forEach(btn=>{

            btn.onclick=()=>{

                const appointment =
                    allAppointments.find(
                        a=>a.id===btn.dataset.id
                    );

                if(!appointment){
                    console.error("Appointment not found");
                    return;
                }

                populateEditDropdowns(appointment);

                document.getElementById("edit-id").value =
                    appointment.id;

                document.getElementById("edit-date").value =
                    appointment.date || "";

                document.getElementById("edit-time").value =
                    appointment.time || "";

                document.getElementById("edit-status").value =
                    appointment.status || "";

                document.getElementById("edit-notes").value =
                    appointment.notes || "";

                document.getElementById("editAppointmentModal")
                    .style.display="block";

            };

        });

}

//dropdown function in edit
function populateEditDropdowns(appointment){

    const customerSelect =
        document.getElementById("edit-customer");

    customerSelect.innerHTML =
        `<option value="">Select Customer</option>`;

    allCustomers.forEach(c=>{

        const option =
            document.createElement("option");

        option.value = String(c.customerID);
        option.textContent = c.name;

        customerSelect.appendChild(option);

    });

    const barberSelect =
        document.getElementById("edit-barber");

    barberSelect.innerHTML =
        `<option value="">Select Barber</option>`;

    allStaff
        .filter(s=>s.position==="Barber")
        .forEach(b=>{

            const option =
                document.createElement("option");

            option.value = String(b.staffID);
            option.textContent = b.name;

            barberSelect.appendChild(option);

        });

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

    customerSelect.value =
        String(appointment.customerID || "");

    barberSelect.value =
        String(appointment.staffID || "");

    serviceSelect.value =
        String(appointment.serviceId || "");

}

document.getElementById("updateAppointment")
    .onclick = async ()=>{

    const id =
        document.getElementById("edit-id").value;

    const customerSelect =
        document.getElementById("edit-customer");

    const barberSelect =
        document.getElementById("edit-barber");

    const serviceSelect =
        document.getElementById("edit-service");

    const service =
        allServices.find(
            s=>s.id===serviceSelect.value
        );

    await updateAppointment(id,{

        customerID:customerSelect.value,

        customer:
            customerSelect.selectedIndex>=0 ?
                customerSelect.options[customerSelect.selectedIndex].text :
                "",

        staffID:barberSelect.value,

        barber:
            barberSelect.selectedIndex>=0 ?
                barberSelect.options[barberSelect.selectedIndex].text :
                "",

        serviceId:serviceSelect.value,

        serviceName:service?.serviceName||"",
        servicePrice:service?.price||0,
        serviceDuration:service?.duration||0,

        date:
        document.getElementById("edit-date").value,

        time:
        document.getElementById("edit-time").value,

        notes:
            document.getElementById("edit-notes")?.value||"",

        status:
        document.getElementById("edit-status").value

    });

    document.getElementById("editAppointmentModal")
        .style.display="none";

    loadAppointments();

};

function setupActions(){

    document
        .querySelectorAll(".delete")
        .forEach(btn=>{

            btn.onclick = async ()=>{

                if(!confirm("Cancel appointment?"))
                    return;

                await deleteAppointment(
                    btn.dataset.id
                );

                loadAppointments();

            };

        });

}
import {
    createStaff,
    getStaff,
    deleteStaff
} from "../BarberShopWebsite/Collections/staff.js";
import {
    getServices
} from "../BarberShopWebsite/Collections/services.js";

let allStaff=[];
document.addEventListener(
    "DOMContentLoaded",
    init
);

async function init(){
    await loadStaff();
    setupCreate();
    setupSearch();
    setupPositionLogic();

    formatPhoneNumber(document.getElementById("s-phone"));
    formatPhoneNumber(document.getElementById("edit-phone"));
    setupEditPositionLogic();
    setupStaffTableEvents()
    setupUpdateButton();
    setupCancelButtons();
}



//
// Generate E00001
async function generateStaffID(){
    const staff=
        await getStaff();
    let max=0;
    staff.forEach(s=>{
        if(s.staffID){
            const num=
                parseInt(
                    s.staffID.substring(1)
                );
            if(num>max)
                max=num;
        }
    });
    const next=max+1;
    return "E"+
        String(next)
            .padStart(5,'0');
}

//Load staff information
async function loadStaff(){
    allStaff = await getStaff();
    allStaff.sort((a, b) => {
        const idA = a.staffID || ""; // fallback if undefined
        const idB = b.staffID || "";
        return idA.localeCompare(idB);
    });
    renderTable(allStaff);



}

function renderTable(list) {
    const body = document.getElementById("staff-body");
    body.innerHTML = "";

    list.forEach(s => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${s.staffID || ""}</td>
            <td>${s.name || ""}</td>
            <td>${s.phone || ""}</td>
            <td>${s.email || ""}</td>
            <td>${s.address || ""}</td>
            <td>${s.position || ""}</td>
            <td>${Array.isArray(s.services) ? s.services.join(", ") : ""}</td>
            <td>$${s.salary || ""}</td>
            <td>${Array.isArray(s.workingDays) ? s.workingDays.join(", ") : ""}</td>
            <td>${s.startDate || ""}</td>
            <td>${s.endDate || "Active"}</td>
            <td>${s.bankAccount || ""}</td>
            <td>
                <button class="edit" data-id="${s.id}">Edit</button>
                <button class="delete" data-id="${s.id}">Delete</button>
            </td>
        `;

`;
        body.appendChild(row);
    });
    setupDelete();

}

//
// Phone number formatter
//
function formatPhoneNumber(input){

    if(!input) return;

    input.addEventListener("input", function(){

        let numbers = this.value.replace(/\D/g,'');

        if(numbers.length > 10){
            numbers = numbers.substring(0,10);
        }

        if(numbers.length > 6){
            this.value =
                numbers.substring(0,3) + "-" +
                numbers.substring(3,6) + "-" +
                numbers.substring(6);
        }
        else if(numbers.length > 3){
            this.value =
                numbers.substring(0,3) + "-" +
                numbers.substring(3);
        }
        else{
            this.value = numbers;
        }

    });

}


function setupCreate() {
    const modal = document.getElementById("createStaffModal");
    const createBtn = document.getElementById("createStaffBtn");
    const saveBtn = document.getElementById("saveStaff");
    const cancelBtn = document.getElementById("cancelStaff");

    if (createBtn) {
        createBtn.onclick = () => {
            clearCreateForm();
            modal.style.display = "block";
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const id = await generateStaffID();

            const position = document.getElementById("s-position").value;
            const services = position === "Barber"
                ? Array.from(document.getElementById("s-services").selectedOptions).map(o => o.value)
                : [];

            await createStaff({
                staffID: id,
                name: document.getElementById("s-name").value,
                phone: document.getElementById("s-phone").value,
                email: document.getElementById("s-email").value,
                address: document.getElementById("s-address").value,
                position: position,
                services: services,
                salary: document.getElementById("s-salary").value,
                startDate: document.getElementById("s-startDate").value,
                endDate: document.getElementById("s-endDate").value || null,
                workingDays: Array.from(document.querySelectorAll(".workday:checked")).map(cb => cb.value),
                bankAccount: document.getElementById("s-bank").value
            });

            modal.style.display = "none";
            await loadStaff();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = "none";
        };
    }
}
//Delete//
function setupDelete(){
    document.querySelectorAll(".delete")
        .forEach(btn=>{

            btn.onclick=async()=>{
                if(!confirm(
                    "Delete staff?"
                )) return;
                await deleteStaff(
                    btn.dataset.id
                );
                loadStaff();
            };
        });

}

//load service box//
async function loadServices(){
    const services=
        await getServices();
    const select=
        document.getElementById(
            "s-services"
        );

    services.forEach(service=>{
        const option=
            document.createElement("option");
        option.value=
            service.serviceID;
        option.textContent=
            service.serviceName;
        select.appendChild(option);
    });
}

//search//
function setupSearch() {
    const input =
        document.getElementById(
            "searchStaff"
        );
    if (!input) return;
    input.addEventListener(
        "input",
        e => {
            const term =
                e.target.value
                    .toLowerCase();
            const filtered =
                allStaff.filter(s =>
                    s.name
                        .toLowerCase()
                        .includes(term)
                    ||
                    (s.phone || "")
                        .includes(term)
                );
            renderTable(filtered);
        });
}
    //setup position logic, when position is Barber, the service box is appeared
    function setupPositionLogic(){

        const positionSelect =
            document.getElementById("s-position");

        const serviceBox =
            document.getElementById("servicesSection");

        if(!positionSelect || !serviceBox)
            return;

        positionSelect.onchange = e => {

            if(e.target.value === "Barber"){

                serviceBox.style.display="block";

            }else{

                serviceBox.style.display="none";

            }

        };

    }


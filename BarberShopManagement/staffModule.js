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

    loadServices();

}


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


async function loadStaff(){

    allStaff=
        await getStaff();

    renderTable(allStaff);

}


function renderTable(list){

    const body=
        document.getElementById("staff-body");

    body.innerHTML="";

    list.forEach(s=>{

        const row=
            document.createElement("tr");

        row.innerHTML=`

<td>${s.staffID}</td>

<td>${s.name}</td>

<td>${s.phone}</td>

<td>${s.email}</td>

<td>${s.role}</td>

<td>
${s.services?.join(", ") || ""}
</td>

<td>
${s.startTime || ""}
-
${s.endTime || ""}
</td>

<td>

<button
class="delete"
data-id="${s.id}">

Delete

</button>

</td>

`;

        body.appendChild(row);

    });

    setupDelete();

}


function setupCreate(){

    const modal=
        document.getElementById(
            "createStaffModal"
        );

    document
        .getElementById(
            "createStaffBtn"
        )
        .onclick=()=>{

        modal.style.display="block";

    };


    document
        .getElementById(
            "saveStaff"
        )
        .onclick=async()=>{

        const id=
            await generateStaffID();

        await createStaff({

            staffID:id,

            name:
            document.getElementById("s-name").value,

            phone:
            document.getElementById("s-phone").value,

            email:
            document.getElementById("s-email").value,

            address:
            document.getElementById("s-address").value,

            role:
            document.getElementById("s-role").value,

            salary:
            document.getElementById("s-salary").value,

            commission:
            document.getElementById("s-commission").value,

            startTime:
            document.getElementById("s-startTime").value,

            endTime:
            document.getElementById("s-endTime").value,

            startDate:
            document.getElementById("s-startDate").value,

            endDate:
            document.getElementById("s-endDate").value,

            bankAccount:
            document.getElementById("s-bank").value,

            services:
                Array.from(

                    document.getElementById("s-services")
                        .selectedOptions

                ).map(o=>o.value)

        });

        modal.style.display="none";

        loadStaff();

    };


    document
        .getElementById(
            "cancelStaff"
        )
        .onclick=()=>{

        modal.style.display="none";

    };

}


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


function setupSearch(){

    const input=
        document.getElementById(
            "searchStaff"
        );

    if(!input) return;

    input.addEventListener(
        "input",
        e=>{

            const term=
                e.target.value
                    .toLowerCase();

            const filtered=
                allStaff.filter(s=>

                    s.name
                        .toLowerCase()
                        .includes(term)

                    ||

                    (s.phone||"")
                        .includes(term)

                );

            renderTable(filtered);

        });

}
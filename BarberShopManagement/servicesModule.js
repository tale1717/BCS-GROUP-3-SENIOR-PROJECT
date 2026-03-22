import {
    createService,
    getServices,
    deleteService
} from "../BarberShopWebsite/Collections/services.js";

let allServices = [];

document.addEventListener("DOMContentLoaded", init);


async function init(){

    await loadServices();
    setupCreate();

}


async function loadServices(){

    allServices = await getServices();

    renderServices(allServices);

}

// Generate Service ID (A00001)
async function generateServiceID(){

    const services = await getServices();

    let max = 0;

    services.forEach(s=>{

        if(s.serviceID){

            const num = parseInt(
                s.serviceID.substring(1)
            );

            if(num > max) max = num;

        }

    });

    const next = max + 1;

    return "A"+String(next).padStart(5,'0');

}

//render table//
function renderServices(list){

    const body = document.getElementById("service-body");

    body.innerHTML="";

    list.forEach(s=>{

        const row=document.createElement("tr");



        row.innerHTML = `
<td>${s.serviceID}</td>
<td>${s.serviceName}</td>
<td>$${s.price}</td>
<td>${s.duration}</td>

<td>
<button class="edit" data-id="${s.id}">Edit</button>
<button class="delete" data-id="${s.id}">Delete</button>
</td>
`;

        body.appendChild(row);

    });

    setupDelete();

}


function setupCreate(){

    const modal=document.getElementById("serviceModal");

    document.getElementById("createServiceBtn").onclick=()=>{
        modal.style.display="block";
    };

    document.getElementById("cancelService").onclick=()=>{
        modal.style.display="none";
    };

    document.getElementById("saveService").onclick=async()=>{
        const serviceID = await generateServiceID();

        await createService({
            serviceID:serviceID,
            serviceName:document.getElementById("s-name").value,
            price:document.getElementById("s-price").value,
            duration:document.getElementById("s-duration").value

        });

        modal.style.display="none";

        loadServices();

    };

}

function setupEdit(){

    document.querySelectorAll(".edit").forEach(btn=>{

        btn.onclick=()=>{

            const service=allServices.find(
                s=>s.id===btn.dataset.id
            );

            document.getElementById("edit-id").value=service.id;
            document.getElementById("edit-name").value=service.serviceName;
            document.getElementById("edit-price").value=service.price;
            document.getElementById("edit-duration").value=service.duration;

            document.getElementById("editServiceModal").style.display="block";

        };

    });

}

function setupDelete(){

    document.querySelectorAll(".delete").forEach(btn=>{

        btn.onclick=async()=>{

            await deleteService(btn.dataset.id);

            loadServices();

        };

    });

}
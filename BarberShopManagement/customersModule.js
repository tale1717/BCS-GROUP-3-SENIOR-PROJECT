import {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer

} from "../BarberShopWebsite/Collections/customers.js";

//Load Customer
let allCustomers=[];

document.addEventListener("DOMContentLoaded",init);

async function init(){

    await loadCustomers();
    setupCreate();
    setupSearch();
    setupUpdate();
    setupCancelEdit();

    formatPhoneNumber(document.getElementById("c-phone"));
    formatPhoneNumber(document.getElementById("edit-phone"));

    //Take data from Firebase
}async function loadCustomers(){

    allCustomers=await getCustomers();

    renderTable(allCustomers);

}

// Generate Customer ID (000001 format)
async function generateCustomerID() {

    const customers = await getCustomers();

    let max = 0;

    customers.forEach(c => {

        if (c.customerID) {

            const num = parseInt(c.customerID);

            if (num > max) max = num;

        }

    });

    const next = max + 1;

    return String(next).padStart(6, '0');
}

//Edit  logic
function renderTable(list){

    const body=document.getElementById("customer-body");

    body.innerHTML="";

    list.forEach(c=>{

        const row=document.createElement("tr");

        row.innerHTML=`
<td>${c.customerID}</td>
<td>${c.name}</td>
<td>${c.phone}</td>
<td>${c.email}</td>

<td>
<button class="edit" data-id="${c.id}">
Edit
</button>

<button class="delete" data-id="${c.id}">
Delete
</button>
</td>

`;

        body.appendChild(row);

    });

    setupActions();
    setupEdit();

}


//
// Search function
//
function setupSearch() {

    const searchInput =
        document.getElementById("searchCustomer");

    if (!searchInput) return;

    searchInput.addEventListener("input", e => {

        const term=e.target.value.toLowerCase();

        const filtered=allCustomers.filter(c=>

            (c.name || "")
                .toLowerCase()
                .includes(term) ||

            (c.phone || "")
                .includes(term) ||

            (c.email || "")
                .toLowerCase()
                .includes(term)

        );

        renderTable(filtered);

    });

}

//Change format of phone number
//
function formatPhoneNumber(input){

    input.addEventListener("input", function(){

        let numbers = this.value.replace(/\D/g,'');

        if(numbers.length>10){
            numbers=numbers.substring(0,10);
        }

        if(numbers.length>6){
            this.value=`(${numbers.substring(0,3)}) ${numbers.substring(3,6)}-${numbers.substring(6)}`;
        }
        else if(numbers.length>3){
            this.value=`(${numbers.substring(0,3)}) ${numbers.substring(3)}`;
        }
        else if(numbers.length>0){
            this.value=`(${numbers}`;
        }

    });

}

//
// Create
//
function setupCreate() {
    const createBtn = document.getElementById("createCustomerBtn");
    const createModal = document.getElementById("createModal");
    const saveCreate = document.getElementById("saveCreate");

    if (!createBtn || !createModal || !saveCreate) return;

    createBtn.addEventListener("click", () => {
        createModal.style.display = "block";
    });

    saveCreate.addEventListener("click", async () => {
        const name = document.getElementById("c-name").value;
        const phone = document.getElementById("c-phone").value;
        const email = document.getElementById("c-email").value;

        if (!name || !phone) {
            alert("Name and phone are required.");
            return;
        }

        const customerID = await generateCustomerID();

        await createCustomer({

            customerID:customerID,
            name:name,
            phone:phone,
            email:email

        });

        createModal.style.display = "none";
        clearCreateFields();
        await loadCustomers();
    });
    // Cancel button
    cancelCreate.addEventListener("click", () => {

        createModal.style.display = "none";

        clearCreateFields();

    });
}



function clearCreateFields() {
    document.getElementById("c-name").value = "";
    document.getElementById("c-phone").value = "";
    document.getElementById("c-email").value = "";
}

//
// edit
//
function setupEdit(){

    document.querySelectorAll(".edit").forEach(btn=>{

        btn.onclick=()=>{

            const customer=allCustomers.find(
                c=>c.id===btn.dataset.id
            );

            document.getElementById("edit-id").value=customer.id;
            document.getElementById("edit-name").value=customer.name;
            document.getElementById("edit-phone").value=customer.phone;
            document.getElementById("edit-email").value=customer.email;

            document.getElementById("editModal").style.display="block";

        };

    });

}


// update button
function setupUpdate(){

    const updateBtn=document.getElementById("updateCustomer");

    if(!updateBtn) return;

    updateBtn.onclick=async()=>{

        await updateCustomer(

            document.getElementById("edit-id").value,

            {
                name:document.getElementById("edit-name").value,
                phone:document.getElementById("edit-phone").value,
                email:document.getElementById("edit-email").value
            }

        );

        document.getElementById("editModal").style.display="none";

        loadCustomers();

    };

}


// cancel edit
function setupCancelEdit(){

    const cancelBtn=document.getElementById("cancelEdit");

    if(!cancelBtn) return;

    cancelBtn.onclick=()=>{

        document.getElementById("editModal").style.display="none";

    };

}


// delete
function setupActions(){

    document.querySelectorAll(".delete").forEach(btn=>{

        btn.onclick=async()=>{

            if(!confirm("Delete customer?")) return;

            await deleteCustomer(btn.dataset.id);

            loadCustomers();

        };

    });

}
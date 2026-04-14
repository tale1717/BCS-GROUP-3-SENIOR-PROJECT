import {
    createCustomer  ,
    getCustomers,
    updateCustomer,
    deleteCustomer
} from "../BarberShopWebsite/Collections/customers.js";

//Load Customer
let allCustomers = [];
let sortState = { column: null, direction: "asc" }

document.addEventListener("DOMContentLoaded", init);

async function init(){

    await loadCustomers();
    setupCreate();
    setupSearch();
    setupUpdate();
    setupCancelEdit();
    setupSorting();

    formatPhoneNumber(document.getElementById("c-phone"));
    formatPhoneNumber(document.getElementById("edit-phone"));
}


//Load customers from Firebase
async function loadCustomers(){

    allCustomers = await getCustomers();
    allCustomers.sort((a, b) => {
        const idA = a.customerID || ""; // fallback if undefined
        const idB = b.customerID || "";
        return idA.localeCompare(idB);
    });


    renderTable(allCustomers);

}


// Generate Customer ID (000001 format)
async function generateCustomerID() {

    const customers = await getCustomers();

    let max = 0;

    customers.forEach(c => {

        if (c.customerID) {

            const num = parseInt(c.customerID.replace("C",""));

            if (num > max) max = num;

        }

    });

    const next = max + 1;

    return "C" + String(next).padStart(6,'0');

}


// Render table
function renderTable(list){

    const body = document.getElementById("customer-body");

    body.innerHTML = "";

    list.forEach(c => {

        const row = document.createElement("tr");

        row.innerHTML = `
<td>${c.customerID}</td>
<td>${c.firstName} ${c.lastName}</td>
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

    const searchInput = document.getElementById("searchCustomer");

    if (!searchInput) return;

    searchInput.addEventListener("input", e => {

        const term = e.target.value.toLowerCase();

        const filtered = allCustomers.filter(c =>

            ((c.firstName || "") + " " + (c.lastName || ""))
                .toLowerCase()
                .includes(term) ||

            (c.phone || "")
                .includes(term) ||

            (c.email || "")
                .toLowerCase()
                .includes(term)

        );

        filtered.sort((a, b) => a.customerID.localeCompare(b.customerID));

        const sorted = sortState.column
            ? sortCustomers(filtered, sortState.column, sortState.direction)
            : filtered;

        renderTable(sorted);

        // renderTable(filtered);

    });

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
            this.value = `(${numbers.substring(0,3)}) ${numbers.substring(3,6)}-${numbers.substring(6)}`;
        }
        else if(numbers.length > 3){
            this.value = `(${numbers.substring(0,3)}) ${numbers.substring(3)}`;
        }
        else if(numbers.length > 0){
            this.value = `(${numbers}`;
        }

    });

}



//
// Create customer
//
function setupCreate() {

    const createBtn = document.getElementById("createCustomerBtn");
    const createModal = document.getElementById("createModal");
    const saveCreate = document.getElementById("saveCreate");
    const cancelCreate = document.getElementById("cancelCreate");

    if (!createBtn || !createModal || !saveCreate) return;

    createBtn.addEventListener("click", () => {

        createModal.style.display = "block";

    });

    saveCreate.addEventListener("click", async () => {

        const firstName = document.getElementById("c-firstName").value;
        const lastName = document.getElementById("c-lastName").value;
        const phone = document.getElementById("c-phone").value;
        const email = document.getElementById("c-email").value;

        if (!firstName || !phone) {

            alert("First name and phone are required.");
            return;

        }

        const customerID = await generateCustomerID();

        await createCustomer({

            customerID: customerID,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email

        });

        createModal.style.display = "none";

        clearCreateFields();

        await loadCustomers();

    });

    cancelCreate.addEventListener("click", () => {

        closeModal("createModal");

        clearCreateFields();

    });

}


// Clear create fields
function clearCreateFields(){

    document.getElementById("c-firstName").value = "";
    document.getElementById("c-lastName").value = "";
    document.getElementById("c-phone").value = "";
    document.getElementById("c-email").value = "";

}



//
// Edit customer
//
function setupEdit(){

    document.querySelectorAll(".edit").forEach(btn => {

        btn.onclick = () => {

            const customer = allCustomers.find(
                c => c.id === btn.dataset.id
            );

            document.getElementById("edit-id").value = customer.id;
            document.getElementById("edit-firstName").value = customer.firstName;
            document.getElementById("edit-lastName").value = customer.lastName;
            document.getElementById("edit-phone").value = customer.phone;
            document.getElementById("edit-email").value = customer.email;

            document.getElementById("editModal").style.display = "block";

        };

    });

}



//
// Update customer
//
function setupUpdate(){

    const updateBtn = document.getElementById("updateCustomer");

    if(!updateBtn) return;

    updateBtn.onclick = async () => {

        await updateCustomer(

            document.getElementById("edit-id").value,

            {

                firstName: document.getElementById("edit-firstName").value,
                lastName: document.getElementById("edit-lastName").value,
                phone: document.getElementById("edit-phone").value,
                email: document.getElementById("edit-email").value

            }

        );

        closeModal("editModal");

        loadCustomers();

    };

}



//
// Cancel edit
//
function setupCancelEdit(){

    const cancelBtn = document.getElementById("cancelEdit");

    if(!cancelBtn) return;

    cancelBtn.onclick = () => {

        closeModal("editModal");

    };

}



//
// Delete customer
//
function setupActions(){

    document.querySelectorAll(".delete").forEach(btn => {

        btn.onclick = async () => {

            if(!confirm("Delete customer?")) return;

            await deleteCustomer(btn.dataset.id);

            loadCustomers();

        };

    });

}

function sortCustomers(list, column, direction) {
    return [...list].sort((a, b) => {
        let valA = "";
        let valB = "";

        switch (column) {
            case "id":
                valA = a.customerID || "";
                valB = b.customerID || "";
                break;
            case "name":
                valA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
                valB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
                break;
            case "phone":
                valA = a.phone || "";
                valB = b.phone || "";
                break;
            case "email":
                valA = a.email || "";
                valB = b.email || "";
                break;
            default:
                return 0;
        }

        return direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
    });
}

function getCurrentFilteredList() {
    const input = document.getElementById("searchCustomer");
    const term = input?.value.toLowerCase() || "";

    if (!term) return allCustomers;

    return allCustomers.filter(c =>
        ((c.firstName || "") + " " + (c.lastName || "")).toLowerCase().includes(term) ||
        (c.phone || "").includes(term) ||
        (c.email || "").toLowerCase().includes(term)
    );
}

function setupSorting() {
    const headers = document.querySelectorAll("th[data-sort]");

    headers.forEach(th => {
        th.style.cursor = "pointer";

        th.addEventListener("click", () => {
            const column = th.dataset.sort;

            if (sortState.column === column) {
                sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
            } else {
                sortState.column = column;
                sortState.direction = "asc";
            }

            headers.forEach(h => {
                const arrow = h.querySelector(".sort-arrow");
                if (arrow) arrow.textContent = "";
            });

            const activeArrow = th.querySelector(".sort-arrow");
            if (activeArrow) {
                activeArrow.textContent = sortState.direction === "asc" ? " ▲" : " ▼";
            }

            const sorted = sortCustomers(getCurrentFilteredList(), sortState.column, sortState.direction);
            renderTable(sorted);
        });
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    modal.classList.add("fade-out");

    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("fade-out");
    }, 150);
}
import {
    createCustomer,
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
    setupCancelButtons();
    setupSorting();

    formatPhoneNumber(document.getElementById("c-phone"));
    formatPhoneNumber(document.getElementById("edit-phone"));

    // run history buttons after load
    setTimeout(addHistoryButtons, 500);
}


//Load customers
async function loadCustomers(){
    allCustomers = await getCustomers();
    allCustomers.sort((a, b) => {
        return (a.customerID || "").localeCompare(b.customerID || "");
    });

    renderTable(allCustomers);

    // refresh buttons after reload
    setTimeout(addHistoryButtons, 300);
}


// Generate ID
async function generateCustomerID() {
    const customers = await getCustomers();
    let max = 0;

    customers.forEach(c => {
        if (c.customerID) {
            const num = parseInt(c.customerID.replace("C",""));
            if (num > max) max = num;
        }
    });

    return "C" + String(max + 1).padStart(6,'0');
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
<td>${formatHistory(c.history)}</td>
<td>
<div class="action">
<button class="edit" data-id="${c.id}">&#9998;</button>
<button class="delete" data-id="${c.id}">&#10006;</button>
</div>
</td>
`;

        body.appendChild(row);
    });

    setupActions();
    setupEdit();
}


// Format history
function formatHistory(history){
    if(!history || history.length === 0) return "";
    return history.map(h => `${h.date}: ${h.note}`).join("<br>");
}


// Search
function setupSearch(){
    const input = document.getElementById("searchCustomer");
    if (!input) return;

    input.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();

        const filtered = allCustomers.filter(c =>
            ((c.firstName || "") + " " + (c.lastName || "")).toLowerCase().includes(term)
            || (c.phone || "").includes(term)
            || (c.email || "").toLowerCase().includes(term)
        );

        filtered.sort((a, b) => a.customerID.localeCompare(b.customerID));

        const sorted = sortState.column
            ? sortCustomers(filtered, sortState.column, sortState.direction)
            : filtered;

        renderTable(sorted);

        // renderTable(filtered);

    });
}


// Phone format
function formatPhoneNumber(input){
    if(!input) return;

    input.addEventListener("input", function(){
        let numbers = this.value.replace(/\D/g,'');

        if(numbers.length > 10){
            numbers = numbers.substring(0,10);
        }

        if(numbers.length > 6){
            this.value = `(${numbers.substring(0,3)}) ${numbers.substring(3,6)}-${numbers.substring(6)}`;
        } else if(numbers.length > 3){
            this.value = `(${numbers.substring(0,3)}) ${numbers.substring(3)}`;
        } else if(numbers.length > 0){
            this.value = `(${numbers}`;
        }
    });
}


// Create
function setupCreate(){

    const btn = document.getElementById("createCustomerBtn");
    const modal = document.getElementById("createModal");

    btn.onclick = () => modal.style.display = "block";

    document.getElementById("saveCreate").onclick = async () => {

        const id = await generateCustomerID();

        await createCustomer({
            customerID: id,
            firstName: document.getElementById("c-firstName").value,
            lastName: document.getElementById("c-lastName").value,
            phone: document.getElementById("c-phone").value,
            email: document.getElementById("c-email").value,
            history: [],
            createdAt: new Date().toISOString()
        });

        closeModal("createModal");
        loadCustomers();
    };
}


// Edit
function setupEdit(){
    document.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = () => {

            const c = allCustomers.find(x => x.id === btn.dataset.id);

            document.getElementById("edit-id").value = c.id;
            document.getElementById("edit-firstName").value = c.firstName;
            document.getElementById("edit-lastName").value = c.lastName;
            document.getElementById("edit-phone").value = c.phone;
            document.getElementById("edit-email").value = c.email;

            document.getElementById("editModal").style.display = "block";
        };
    });
}


// Update
function setupUpdate(){
    document.getElementById("updateCustomer").onclick = async () => {

        const id = document.getElementById("edit-id").value;

        const customer = allCustomers.find(c => c.id === id);

        //  manual history add
        const note = document.getElementById("history-input").value;

        if(note){
            customer.history = customer.history || [];

            customer.history.push({
                date: new Date().toISOString().split("T")[0],
                note: note,
                staff: "Manual"
            });

            document.getElementById("history-input").value = "";
        }

        await updateCustomer(id, {
            ...customer,
            firstName: document.getElementById("edit-firstName").value,
            lastName: document.getElementById("edit-lastName").value,
            phone: document.getElementById("edit-phone").value,
            email: document.getElementById("edit-email").value,
            history: customer.history
        });

        closeModal("editModal");

        loadCustomers();
    };
}


// Cancel
function setupCancelButtons(){
    document.getElementById("cancelCreate").onclick = () => {
        closeModal("createModal");
    };
    document.getElementById("cancelEdit").onclick = () => {
        closeModal("editModal");
    }
}


// Delete
function setupActions(){
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            if(!confirm("Delete?")) return;
            await deleteCustomer(btn.dataset.id);
            loadCustomers();
        };
    });
}



// POPUP FEATURE

let currentCustomerId = null;

// add popup button
function addHistoryButtons(){

    document.querySelectorAll("#customer-body tr").forEach(row => {

        const btn = row.querySelector(".edit");
        if(!btn) return;

        const id = btn.dataset.id;

        row.children[4].innerHTML =
            `<button class="history-btn" data-id="${id}">👁️</button>`;
    });
}


// open popup
document.addEventListener("click", (e)=>{

    if(e.target.classList.contains("history-btn")){

        const customer = allCustomers.find(c=>c.id===e.target.dataset.id);
        if(!customer) return;

        currentCustomerId = customer.id;

        renderHistoryPopup(customer);

        document.getElementById("historyModal").style.display = "block";
    }
});


// render popup
function renderHistoryPopup(customer){

    const box = document.getElementById("history-list");
    box.innerHTML = "";

    (customer.history || []).forEach(h=>{
        const div = document.createElement("div");

        loadCustomers();

        div.innerHTML = `
<strong>${h.date}</strong> - ${h.staff}<br>
${h.note}
<hr>
`;

        box.appendChild(div);
    });
}


// add note from popup
document.getElementById("saveHistoryNote")?.addEventListener("click", async ()=>{

    const note = document.getElementById("new-history-note").value;
    if(!note) return;

    const customer = allCustomers.find(c=>c.id===currentCustomerId);
    if(!customer) return;

    customer.history = customer.history || [];

    customer.history.push({
        date: new Date().toISOString().split("T")[0],
        note,
        staff: "Manual"
    });

    await updateCustomer(currentCustomerId, customer);

    document.getElementById("new-history-note").value = "";

    loadCustomers();
});


// close popup
const closeBtn = document.getElementById("closeHistoryModal");

if(closeBtn){
    closeBtn.onclick = ()=>{
        closeModal("historyModal");
    };
}

//appoint hook (get note from appointment)

async function addNoteToCustomer(customerId, entry){

    const customers = await getCustomers();
    const customer = customers.find(c => c.id === customerId);

    if(!customer) return;

    const history = customer.history || [];
    history.push(entry);

    await updateCustomer(customerId, {
        ...customer,
        history
    });

    window.addNoteToCustomer = addNoteToCustomer;
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

import {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
} from "../BarbershopWebsite/Collections/customers.js";
import {
    getAllUsers
} from "../BarberShopWebsite/Collections/users.js";

let allCustomers = [];
let selectedId = null;

document.addEventListener("DOMContentLoaded", () => {
    const cancelCreate = document.getElementById("cancelCreate");
    if (cancelCreate) {
        cancelCreate.onclick = () => {
            document.getElementById("createModal").style.display = "none";
        };
    }

    const cancelEdit = document.getElementById("cancelEdit");
    if (cancelEdit) {
        cancelEdit.onclick = () => {
            document.getElementById("editModal").style.display = "none";
        };
    }

    initialize();
});

async function initialize() {
    await loadCustomers();
    setupSearch();
    setupCreate();
    setupEdit();
    setupDelete();
}

//
// Customer list
//
async function loadCustomers() {
    const users = await getAllUsers();
    allCustomers = users.filter(u => u.role === "customer");
    await renderTable(allCustomers);
}

async function renderTable(list) {
    const body = document.getElementById("customer-body");
    if (!body) return;

    body.innerHTML = "";

    for (const c of list) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="radio" name="selectCustomer" value="${c.uid}"></td>
            <td>${c.firstName + " " + c.lastName}</td>
            <td>${c.phone}</td>
            <td>${c.email || ""}</td>
        `;

        body.appendChild(row);

    }

    document.querySelectorAll("input[name='selectCustomer']").forEach(radio => {
        radio.addEventListener("change", e => {
            selectedId = e.target.value;
        });
    });
}

//
// Search
//
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();

        const filtered = allCustomers.filter(c =>
            (c.firstName || "").toLowerCase().includes(term) ||
            (c.lastName || "").toLowerCase().includes(term) ||
            (c.phone || "").includes(term) ||
            (c.email || "").toLowerCase().includes(term)
        );

        renderTable(filtered);
    });
}

//
// Create
//
function setupCreate() {
    const createBtn = document.getElementById("createBtn");
    const createModal = document.getElementById("createModal");
    const saveCreate = document.getElementById("saveCreate");

    if (!createBtn || !createModal || !saveCreate) return;

    createBtn.addEventListener("click", () => {
        createModal.style.display = "block";
    });

    saveCreate.addEventListener("click", async () => {
        const name = document.getElementById("c-name").value.trim();
        const phone = document.getElementById("c-phone").value.trim();
        const email = document.getElementById("c-email").value.trim();

        if (!name || !phone) {
            alert("Name and phone are required.");
            return;
        }

        await createCustomer({ name, phone, email });

        createModal.style.display = "none";
        clearCreateFields();
        await loadCustomers();
    });
}

function clearCreateFields() {
    const name = document.getElementById("c-name");
    const phone = document.getElementById("c-phone");
    const email = document.getElementById("c-email");

    if (name) name.value = "";
    if (phone) phone.value = "";
    if (email) email.value = "";
}

//
// Edit
//
function setupEdit() {
    const editBtn = document.getElementById("editBtn");
    const editModal = document.getElementById("editModal");
    const saveEdit = document.getElementById("saveEdit");

    if (!editBtn || !editModal || !saveEdit) return;

    editBtn.addEventListener("click", () => {
        if (!selectedId) {
            alert("Please select a customer first.");
            return;
        }

        const customer = allCustomers.find(c => c.id === selectedId);
        if (!customer) return;

        document.getElementById("e-name").value = getDisplayName(customer);
        document.getElementById("e-phone").value = customer.phone || "";
        document.getElementById("e-email").value = customer.email || "";

        editModal.style.display = "block";
    });

    saveEdit.addEventListener("click", async () => {
        const name = document.getElementById("e-name").value.trim();
        const phone = document.getElementById("e-phone").value.trim();
        const email = document.getElementById("e-email").value.trim();

        if (!selectedId) return;

        await updateCustomer(selectedId, { name, phone, email });

        editModal.style.display = "none";
        selectedId = null;
        await loadCustomers();
    });
}

//
// Delete
//
function setupDelete() {
    const deleteBtn = document.getElementById("deleteBtn");
    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", async () => {
        if (!selectedId) {
            alert("Please select a customer first.");
            return;
        }

        if (!confirm("Are you sure you want to delete this customer?")) return;

        await deleteCustomer(selectedId);
        selectedId = null;
        await loadCustomers();
    });
}
import {
    createStaff,
    getStaff,
    updateStaff,
    deleteStaff
} from "../BarberShopWebsite/Collections/staff.js";

import {
    getServices
} from "../BarberShopWebsite/Collections/services.js";

let allStaff = [];
let allServices = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadServices();
    await loadStaff();

    setupCreate();
    setupSearch();
    setupPositionLogic();
    setupEditPositionLogic();
    setupUpdateButton();
    setupCancelButtons();
}

async function generateStaffID() {
    const staff = await getStaff();
    let max = 0;

    staff.forEach(s => {
        if (s.staffID) {
            const num = parseInt(s.staffID.substring(1));
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    });

    const next = max + 1;
    return "E" + String(next).padStart(5, "0");
}

async function loadStaff() {
    allStaff = await getStaff();
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

        body.appendChild(row);
    });

    setupEdit();
    setupDelete();
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

function setupEdit() {
    document.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = () => {
            const staff = allStaff.find(s => s.id === btn.dataset.id);
            if (!staff) return;

            document.getElementById("edit-id").value = staff.id;
            document.getElementById("edit-name").value = staff.name || "";
            document.getElementById("edit-phone").value = staff.phone || "";
            document.getElementById("edit-email").value = staff.email || "";
            document.getElementById("edit-address").value = staff.address || "";
            document.getElementById("edit-salary").value = staff.salary || "";
            document.getElementById("edit-position").value = staff.position || "";
            document.getElementById("edit-startDate").value = staff.startDate || "";
            document.getElementById("edit-endDate").value = staff.endDate || "";
            document.getElementById("edit-bank").value = staff.bankAccount || "";

            const selectedWorkingDays = Array.isArray(staff.workingDays) ? staff.workingDays : [];
            document.querySelectorAll(".edit-workday").forEach(cb => {
                cb.checked = selectedWorkingDays.includes(cb.value);
            });

            populateEditServices(staff.services || []);
            toggleEditServicesSection(staff.position || "");

            document.getElementById("editStaffModal").style.display = "block";
        };
    });
}

function setupUpdateButton() {
    const updateBtn = document.getElementById("updateStaff");
    if (!updateBtn) return;

    updateBtn.onclick = async () => {
        const id = document.getElementById("edit-id").value;
        const position = document.getElementById("edit-position").value;

        const services = position === "Barber"
            ? Array.from(document.getElementById("edit-services").selectedOptions).map(o => o.value)
            : [];

        try {
            await updateStaff(id, {
                name: document.getElementById("edit-name").value,
                phone: document.getElementById("edit-phone").value,
                email: document.getElementById("edit-email").value,
                address: document.getElementById("edit-address").value,
                position: position,
                services: services,
                salary: document.getElementById("edit-salary").value,
                startDate: document.getElementById("edit-startDate").value,
                endDate: document.getElementById("edit-endDate").value || null,
                workingDays: Array.from(document.querySelectorAll(".edit-workday:checked")).map(cb => cb.value),
                bankAccount: document.getElementById("edit-bank").value
            });

            document.getElementById("editStaffModal").style.display = "none";
            await loadStaff();
        } catch (error) {
            console.error("Failed to update staff:", error);
            alert("Failed to update staff.");
        }
    };
}

function setupDelete() {
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Delete staff?")) return;

            await deleteStaff(btn.dataset.id);
            await loadStaff();
        };
    });
}

async function loadServices() {
    allServices = await getServices();

    const createSelect = document.getElementById("s-services");
    const editSelect = document.getElementById("edit-services");

    if (createSelect) {
        createSelect.innerHTML = "";
        allServices.forEach(service => {
            const option = document.createElement("option");
            option.value = service.serviceName;
            option.textContent = service.serviceName;
            createSelect.appendChild(option);
        });
    }

    if (editSelect) {
        editSelect.innerHTML = "";
        allServices.forEach(service => {
            const option = document.createElement("option");
            option.value = service.serviceName;
            option.textContent = service.serviceName;
            editSelect.appendChild(option);
        });
    }
}

function populateEditServices(selectedServices) {
    const editSelect = document.getElementById("edit-services");
    if (!editSelect) return;

    Array.from(editSelect.options).forEach(option => {
        option.selected = selectedServices.includes(option.value);
    });
}

function setupSearch() {
    const input = document.getElementById("searchStaff");
    if (!input) return;

    input.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();

        const filtered = allStaff.filter(s =>
            (s.name || "").toLowerCase().includes(term) ||
            (s.phone || "").toLowerCase().includes(term) ||
            (s.email || "").toLowerCase().includes(term) ||
            (s.position || "").toLowerCase().includes(term)
        );

        renderTable(filtered);
    });
}

function setupPositionLogic() {
    const positionSelect = document.getElementById("s-position");
    if (!positionSelect) return;

    positionSelect.onchange = e => {
        toggleCreateServicesSection(e.target.value);
    };
}

function setupEditPositionLogic() {
    const editPositionSelect = document.getElementById("edit-position");
    if (!editPositionSelect) return;

    editPositionSelect.onchange = e => {
        toggleEditServicesSection(e.target.value);
    };
}

function toggleCreateServicesSection(position) {
    const serviceBox = document.getElementById("servicesSection");
    if (!serviceBox) return;

    if (position === "Barber") {
        serviceBox.style.display = "block";
    } else {
        serviceBox.style.display = "none";
        const select = document.getElementById("s-services");
        if (select) {
            Array.from(select.options).forEach(option => {
                option.selected = false;
            });
        }
    }
}

function toggleEditServicesSection(position) {
    const serviceBox = document.getElementById("editServicesSection");
    if (!serviceBox) return;

    if (position === "Barber") {
        serviceBox.style.display = "block";
    } else {
        serviceBox.style.display = "none";
        const select = document.getElementById("edit-services");
        if (select) {
            Array.from(select.options).forEach(option => {
                option.selected = false;
            });
        }
    }
}

function setupCancelButtons() {
    const cancelEditBtn = document.getElementById("cancelEditStaff");
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            document.getElementById("editStaffModal").style.display = "none";
        };
    }
}

function clearCreateForm() {
    document.getElementById("s-name").value = "";
    document.getElementById("s-phone").value = "";
    document.getElementById("s-email").value = "";
    document.getElementById("s-address").value = "";
    document.getElementById("s-salary").value = "";
    document.getElementById("s-position").value = "";
    document.getElementById("s-startDate").value = "";
    document.getElementById("s-endDate").value = "";
    document.getElementById("s-bank").value = "";

    document.querySelectorAll(".workday").forEach(cb => {
        cb.checked = false;
    });

    const servicesSelect = document.getElementById("s-services");
    if (servicesSelect) {
        Array.from(servicesSelect.options).forEach(option => {
            option.selected = false;
        });
    }

    toggleCreateServicesSection("");
}
import {
    createService,
    getServices,
    updateService,
    deleteService
} from "../BarberShopWebsite/Collections/services.js";

let allServices = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadServices();

    setupCreate();
    setupSearch();
    setupUpdateButton();
    setupCancelButtons();
}

async function loadServices() {
    allServices = await getServices();
    renderServices(allServices);
}

async function generateServiceID() {
    const services = await getServices();
    let max = 0;

    services.forEach(s => {
        if (s.serviceID) {
            const num = parseInt(s.serviceID.substring(1));
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    });

    const next = max + 1;
    return "S" + String(next).padStart(5, "0");
}

function renderServices(list) {
    const body = document.getElementById("service-body");
    body.innerHTML = "";

    list.forEach(s => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${s.serviceID || ""}</td>
            <td>${s.serviceName || ""}</td>
            <td>$${s.price || ""}</td>
            <td>${s.duration || ""}</td>
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
    const modal = document.getElementById("serviceModal");
    const createBtn = document.getElementById("createServiceBtn");
    const saveBtn = document.getElementById("saveService");
    const cancelBtn = document.getElementById("cancelService");

    if (createBtn) {
        createBtn.onclick = () => {
            clearCreateForm();
            modal.style.display = "block";
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = "none";
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const serviceName = document.getElementById("s-name").value.trim();
            const price = document.getElementById("s-price").value.trim();
            const duration = document.getElementById("s-duration").value.trim();

            if (!serviceName || !price || !duration) {
                alert("Please fill out all service fields.");
                return;
            }

            const serviceID = await generateServiceID();

            await createService({
                serviceID: serviceID,
                serviceName: serviceName,
                price: price,
                duration: duration
            });

            modal.style.display = "none";
            await loadServices();
        };
    }
}

function setupEdit() {
    document.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = () => {
            const service = allServices.find(s => s.id === btn.dataset.id);
            if (!service) return;

            document.getElementById("edit-id").value = service.id;
            document.getElementById("edit-name").value = service.serviceName || "";
            document.getElementById("edit-price").value = service.price || "";
            document.getElementById("edit-duration").value = service.duration || "";

            document.getElementById("editModal").style.display = "block";
        };
    });
}

function setupUpdateButton() {
    const updateBtn = document.getElementById("updateService");
    if (!updateBtn) return;

    updateBtn.onclick = async () => {
        const id = document.getElementById("edit-id").value;
        const serviceName = document.getElementById("edit-name").value.trim();
        const price = document.getElementById("edit-price").value.trim();
        const duration = document.getElementById("edit-duration").value.trim();

        if (!serviceName || !price || !duration) {
            alert("Please fill out all service fields.");
            return;
        }

        try {
            await updateService(id, {
                serviceName: serviceName,
                price: price,
                duration: duration
            });

            document.getElementById("editModal").style.display = "none";
            await loadServices();
        } catch (error) {
            console.error("Failed to update service:", error);
            alert("Failed to update service.");
        }
    };
}

function setupDelete() {
    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            if (!confirm("Delete this service?")) return;

            await deleteService(btn.dataset.id);
            await loadServices();
        };
    });
}

function setupSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();

        const filtered = allServices.filter(s =>
            (s.serviceID || "").toLowerCase().includes(term) ||
            (s.serviceName || "").toLowerCase().includes(term) ||
            String(s.price || "").toLowerCase().includes(term) ||
            String(s.duration || "").toLowerCase().includes(term)
        );

        renderServices(filtered);
    });
}

function setupCancelButtons() {
    const cancelEditBtn = document.getElementById("cancelEdit");
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            document.getElementById("editModal").style.display = "none";
        };
    }
}

function clearCreateForm() {
    document.getElementById("s-name").value = "";
    document.getElementById("s-price").value = "";
    document.getElementById("s-duration").value = "";
}
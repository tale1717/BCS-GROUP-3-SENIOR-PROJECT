import {
    createService,
    getServices,
    updateService,
    deleteService
} from "../BarberShopWebsite/Collections/services.js";

let allServices = [];
let sortState = { column: null, direction: "asc" };

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadServices();

    setupCreate();
    setupSearch();
    setupUpdateButton();
    setupCancelButtons();
    setupSorting();

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
                <div class="action">
                <button class="edit" data-id="${s.id}">&#9998;</button>
                <button class="delete" data-id="${s.id}">&#10006;</button>
                </div>
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

            closeModal("editModal");
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

        const sorted = sortState.column
            ? sortServices(filtered, sortState.column, sortState.direction)
            : filtered;

        renderServices(sorted);
    });
}

function setupCancelButtons() {
    const cancelEditBtn = document.getElementById("cancelEdit");
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            closeModal("editModal");
        };
    }
}

function clearCreateForm() {
    document.getElementById("s-name").value = "";
    document.getElementById("s-price").value = "";
    document.getElementById("s-duration").value = "";
}

function sortServices(list, column, direction) {
    return [...list].sort((a, b) => {
        switch (column) {
            case "id":
                return direction === "asc"
                    ? (a.serviceID || "").localeCompare(b.serviceID || "")
                    : (b.serviceID || "").localeCompare(a.serviceID || "");
            case "name":
                return direction === "asc"
                    ? (a.serviceName || "").localeCompare(b.serviceName || "")
                    : (b.serviceName || "").localeCompare(a.serviceName || "");
            case "price":
                return direction === "asc"
                    ? (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
                    : (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
            case "duration":
                return direction === "asc"
                    ? (parseFloat(a.duration) || 0) - (parseFloat(b.duration) || 0)
                    : (parseFloat(b.duration) || 0) - (parseFloat(a.duration) || 0);
            default:
                return 0;
        }
    });
}

function getCurrentFilteredList() {
    const input = document.getElementById("searchInput");
    const term = input?.value.toLowerCase() || "";

    if (!term) return allServices;

    return allServices.filter(s =>
        (s.serviceID || "").toLowerCase().includes(term) ||
        (s.serviceName || "").toLowerCase().includes(term) ||
        String(s.price || "").toLowerCase().includes(term) ||
        String(s.duration || "").toLowerCase().includes(term)
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

            const sorted = sortServices(getCurrentFilteredList(), sortState.column, sortState.direction);
            renderServices(sorted);
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
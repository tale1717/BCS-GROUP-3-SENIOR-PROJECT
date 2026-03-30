import { getServices } from "/BarberShopWebsite/Collections/services.js";

let allServices = [];

export function mustGet(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: #${id}`);
    return el;
}

export async function loadServices() {
    allServices = await getServices();

    const serviceSelect = mustGet("service");

    serviceSelect.innerHTML = `<option value="">Select a service</option>`;

    allServices.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent =
            `${service.serviceName} ($${service.price}, ${service.duration} min)`;
        serviceSelect.appendChild(option);
    });
}

export function getSelectedService(serviceId) {
    return allServices.find(s => s.id === serviceId);
}

export function getFormData() {
    return {
        barber: mustGet("barber").value.trim(),
        date: mustGet("date").value.trim(),
        time: mustGet("time").value.trim(),
        serviceId: mustGet("service").value.trim()
    };
}

export function populateForm(data) {
    mustGet("barber").value = data.barber;
    mustGet("date").value = data.date;
    mustGet("time").value = data.time;
    mustGet("service").value = data.serviceId;
}
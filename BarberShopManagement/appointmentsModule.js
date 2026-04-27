console.log("appointmentsModule loaded");

import {
    createAppointment,
    getAppointments,
    updateAppointment,
    deleteAppointment
} from "../BarberShopWebsite/Collections/appointments.js";

import {
    getCustomers
} from "../BarberShopWebsite/Collections/customers.js";

import {
    getStaff
} from "../BarberShopWebsite/Collections/staff.js";

import {
    getUserProfile
} from "../BarberShopWebsite/Collections/users.js";

import {
    getServices
} from "../BarberShopWebsite/Collections/services.js";

import {
    getSupplies,
    updateSupply
} from "../BarberShopWebsite/Collections/inventory.js";

let allAppointments = [];
let allServices = [];
let userCache = {};
let allCustomers = [];
let allStaff = [];
let sortState = { column: null, direction: "asc" };

document.addEventListener("DOMContentLoaded", () => {
    init();
});


function setupToggleMultiSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.addEventListener("mousedown", (e) => {
        if (e.target.tagName.toLowerCase() !== "option") return;

        e.preventDefault();
        e.target.selected = !e.target.selected;
        select.dispatchEvent(new Event("change"));
    });
}
async function init() {
    await loadCustomers();
    await loadStaff();
    await loadServices();
    await loadAppointments();

    setupToggleMultiSelect("a-service");
    setupToggleMultiSelect("edit-service");

    setupSearch();
    setupCreate();
    setupTableEvents()
    setupUpdateButton();
    setupCancelButtons();

    // hookup history
    hookCreateHistory();
    hookUpdateHistory();
    setupSorting();

    createMiniCalendar("a-calendar", "a-date", "a-date-display", "a-barber", "a-time", "a-service");
    createMiniCalendar("edit-calendar", "edit-date", "edit-date-display", "edit-barber", "edit-time", "edit-service");
}

// customer autocomplete (for create/edit appointment)
function setupCustomerAutocomplete(inputId, boxId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    if (!input || !box) return;

    function showSuggestions(value = "") {
        const search = value.toLowerCase();
        box.innerHTML = "";

        const filtered = allCustomers.filter(c => {
            const name =
                c.name ||
                [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                c.customerName ||
                "";

            return name.toLowerCase().includes(search);
        });

        filtered.forEach(c => {
            const name =
                c.name ||
                [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                c.customerName ||
                "Unknown";

            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = name;

            div.onclick = () => {
                input.value = name;
                input.dataset.id = c.id;
                box.innerHTML = "";
            };

            box.appendChild(div);
        });
    }
    //show customer list
    input.onfocus = () => showSuggestions("");
    input.oninput = () => showSuggestions(input.value);

    document.onclick = (e) => {
        if (!input.contains(e.target) && !box.contains(e.target)) {
            box.innerHTML = "";
        }
    };
}



async function loadServices() {
    allServices = await getServices();
    populateServiceDropdown();
}

async function loadCustomers() {
    allCustomers = await getCustomers();
    //load suggestion when input
    setupCustomerAutocomplete("a-customer", "customer-suggestions");
    setupCustomerAutocomplete("edit-customer", "edit-customer-suggestions");


}

async function loadStaff() {
    allStaff = await getStaff();

    const select = document.getElementById("a-barber");
    if (!select) return;

    select.innerHTML = `<option value="">Select Barber</option>`;

    allStaff
        .filter(s => s.position === "Barber")
        .forEach(b => {
            const option = document.createElement("option");
            option.value = b.id;
            option.textContent = b.name || "Unnamed Barber";
            select.appendChild(option);
        });
}

//generate ID automatically
async function generateAppointmentID() {
    const appointments = await getAppointments();
    let max = 0;

    appointments.forEach(a => {
        const id = a.appointmentID || a.id;
        if (!id) return;

        if (!/^A\d{6}$/.test(id)) return;

        const num = parseInt(id.slice(1));
        if (num > max) max = num;
    });

    return "A" + String(max + 1).padStart(6, "0");
}

function populateServiceDropdown() {
    const select = document.getElementById("a-service");
    if (!select) return;

    select.innerHTML = `<option value="">Select a service</option>`;

    allServices.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = `${service.serviceName} - $${service.price} - ${service.duration} min`;
        select.appendChild(option);
    });
}

async function loadAppointments() {
    allAppointments = await getAppointments();
    await renderTable(allAppointments);
}

async function renderTable(list) {
    const body = document.getElementById("appointment-body");
    if (!body) return;

    body.innerHTML = "";

    for (const a of list) {
        if (a.customerUid && !userCache[a.customerUid]) {
            const user = await getUserProfile(a.customerUid);
            userCache[a.customerUid] = user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "Unknown";
        }

        const customerName = a.customerUid
            ? userCache[a.customerUid]
            : (a.customer || "Unknown");

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${a.appointmentID || a.id}</td>
            <td>${customerName}</td>
            <td>${a.barber || ""}</td>
            <td>${a.serviceName || a.service || ""}</td>
            <td>${a.date || ""}</td>
            <td>${a.time || ""}</td>
            <td>${a.notes || ""}</td>
            <td>${Array.isArray(a.suppliesUsed) ? a.suppliesUsed.map(s => `${s.name} (${s.quantity})`).join(", ") : ""}</td>
            
            <td><span class="status ${a.status || "upcoming"}">${a.status || "upcoming"}</span></td>
            <td>$${Number(a.totalCost || 0).toFixed(2)}</td>
            <td>
                <div class="action">
                <button class="edit" data-id="${a.id}">&#9998;</button>
                <button class="delete" data-id="${a.id}">&#10006;</button>
                </div>
            </td>
        `;

        body.appendChild(row);
    }

    setupTableEvents()
}

function setupSearch() {
    const input = document.getElementById("searchAppointment");
    if (!input) return;

    input.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();

        const filtered = allAppointments.filter(a => {
            const name = (userCache[a.customerUid] || a.customer || "").toLowerCase();

            return (
                name.includes(term) ||
                (a.barber || "").toLowerCase().includes(term) ||
                (a.serviceName || a.service || "").toLowerCase().includes(term) ||
                (a.date || "").toLowerCase().includes(term) ||
                (a.time || "").toLowerCase().includes(term) ||
                (a.notes || "").toLowerCase().includes(term)
            );
        });

        const sorted = sortState.column
            ? sortAppointments(filtered, sortState.column, sortState.direction)
            : filtered;
        renderTable(sorted);

        // renderTable(filtered);
    });
}

function getSelectedServices(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];

    const selectedIds = Array.from(select.selectedOptions).map(option => option.value);

    return allServices
        .filter(service => selectedIds.includes(service.id))
        .map(service => ({
            serviceId: service.id,
            serviceName: service.serviceName,
            servicePrice: service.price,
            serviceDuration: service.duration
        }));
}

//create
function calculateTotalCost(services) {
    return services.reduce(
        (sum, service) => sum + Number(service.servicePrice || 0),
        0
    );
}

function isBarberWorkingOnDate(barberId, date) {
    const barber = allStaff.find(s => s.id === barberId);

    if (!barber) return true;

    const dayName = new Date(date + "T00:00:00")
        .toLocaleDateString("en-US", { weekday: "long" });

    if (barber.workingHours && barber.workingHours[dayName]) {
        return true;
    }

    return false;
}

function getBarberWorkingTimeForDate(barberId, date) {
    const barber = allStaff.find(s => s.id === barberId);

    if (!barber || !barber.workingHours) {
        return {
            start: "09:00",
            end: "18:00"
        };
    }

    const dayName = new Date(date + "T00:00:00")
        .toLocaleDateString("en-US", { weekday: "long" });

    return barber.workingHours[dayName] || null;
}

function populateAvailableTimes(timeSelectId, barberSelectId, dateInputId, serviceSelectId, excludeId = null) {
    const timeSelect = document.getElementById(timeSelectId);
    const barberSelect = document.getElementById(barberSelectId);
    const dateInput = document.getElementById(dateInputId);

    if (!timeSelect || !barberSelect || !dateInput) return;

    const barberId = barberSelect.value;
    const barberName = barberSelect.options[barberSelect.selectedIndex]?.text || "";
    const date = dateInput.value;
    const selectedServices = getSelectedServices(serviceSelectId);

    timeSelect.innerHTML = `<option value="">Select Time</option>`;

    if (!barberId || !date || selectedServices.length === 0) {
        return;
    }

    if (!isBarberWorkingOnDate(barberId, date)) {
        timeSelect.innerHTML = `<option value="">Barber unavailable this day</option>`;
        return;
    }

    const duration = calculateTotalDuration(selectedServices);

    const workingTime = getBarberWorkingTimeForDate(barberId, date);

    if (!workingTime) {
        timeSelect.innerHTML = `<option value="">Barber unavailable this day</option>`;
        return;
    }

    const startOfDay = timeToMinutes(workingTime.start);
    const endOfDay = timeToMinutes(workingTime.end);

    for (let minutes = startOfDay; minutes + duration <= endOfDay; minutes += 10) {
        const time = minutesToTime(minutes);

        if (isTimeSlotAvailable(barberId, date, time, duration, excludeId)) {
            const option = document.createElement("option");
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        }
    }
}

function calculateTotalDuration(services) {
    return services.reduce(
        (sum, service) =>
            sum + Number(service.serviceDuration || 0) + 10,
        0
    );
}

function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getAppointmentDuration(appointment) {
    if (Array.isArray(appointment.services)) {
        return appointment.services.reduce(
            (sum, service) => sum + Number(service.serviceDuration || 0) + 10,
            0
        );
    }

    return Number(appointment.serviceDuration || 0) + 10;
}

function isTimeSlotAvailable(barberId, date, startTime, duration, excludeId = null) {
    const start = timeToMinutes(startTime);
    const end = start + duration;

    return !allAppointments.some(a => {
        if (excludeId && a.id === excludeId) return false;

        if (a.staffID !== barberId) return false;
        if (a.date !== date) return false;

        const existingStart = timeToMinutes(a.time || "00:00");

        const existingDuration = Array.isArray(a.services)
            ? a.services.reduce(
                (sum, s) => sum + Number(s.serviceDuration || 0) + 10,
                0
            )
            : 0;

        const existingEnd = existingStart + existingDuration;

        return start < existingEnd && end > existingStart;
    });
}

function createMiniCalendar(calendarId, hiddenInputId, displayId, barberSelectId, timeSelectId, serviceSelectId, excludeId = null) {
    const calendar = document.getElementById(calendarId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const display = document.getElementById(displayId);
    const barberSelect = document.getElementById(barberSelectId);

    if (!calendar || !hiddenInput || !display || !barberSelect) return;

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    function renderCalendar() {
        calendar.innerHTML = "";

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const header = document.createElement("div");
        header.className = "calendar-header";

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "<";

        const title = document.createElement("span");
        title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const nextBtn = document.createElement("button");
        nextBtn.textContent = ">";

        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);

        const grid = document.createElement("div");
        grid.className = "calendar-grid";

        dayNames.forEach(day => {
            const dayName = document.createElement("div");
            dayName.className = "calendar-day-name";
            dayName.textContent = day;
            grid.appendChild(dayName);
        });

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-day empty";
            grid.appendChild(empty);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement("div");
            dayEl.className = "calendar-day";
            dayEl.textContent = day;

            const dateObj = new Date(currentYear, currentMonth, day);
            dateObj.setHours(0, 0, 0, 0);

            const dateString =
                `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const barberId = barberSelect.value;

            const isPast = dateObj < today;
            const barberWorks = barberId ? isBarberWorkingOnDate(barberId, dateString) : true;

            if (isPast || !barberWorks) {
                dayEl.classList.add("disabled");
            } else {
                dayEl.onclick = () => {
                    hiddenInput.value = dateString;
                    display.textContent = dateString;

                    calendar.querySelectorAll(".calendar-day").forEach(d => {
                        d.classList.remove("selected");
                    });

                    dayEl.classList.add("selected");

                    populateAvailableTimes(
                        timeSelectId,
                        barberSelectId,
                        hiddenInputId,
                        serviceSelectId,
                        excludeId
                    );
                };
            }

            if (hiddenInput.value === dateString) {
                dayEl.classList.add("selected");
            }

            grid.appendChild(dayEl);
        }

        prevBtn.onclick = () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        };

        nextBtn.onclick = () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        };

        calendar.appendChild(header);
        calendar.appendChild(grid);
    }

    barberSelect.addEventListener("change", () => {
        hiddenInput.value = "";
        display.textContent = "Select Date";
        renderCalendar();
        populateAvailableTimes(timeSelectId, barberSelectId, hiddenInputId, serviceSelectId, excludeId);
    });

    renderCalendar();
}

function setupCreate() {
    const btn = document.getElementById("createAppointmentBtn");
    const modal = document.getElementById("appointmentModal");

    if (!btn || !modal) {
        console.error("Create button or modal not found");
        return;
    }

    btn.onclick = () => {
        modal.style.display = "block";
    };

    const saveBtn = document.getElementById("saveAppointment");
    if (!saveBtn) return;

    saveBtn.onclick = async () => {
        const customerInput = document.getElementById("a-customer");
        const barberSelect = document.getElementById("a-barber");
        const serviceSelect = document.getElementById("a-service");
        const selectedServices = getSelectedServices("a-service");
        const totalCost = calculateTotalCost(selectedServices);


        if (!customerInput.dataset.id) {
            alert("Please select a valid customer from suggestions.");
            return;
        }

        if (!barberSelect.value) {
            alert("Please select a barber.");
            return;
        }

        if (selectedServices.length === 0) {
            alert("Please select at least one service.");
            return;
        }

        const selectedDate = document.getElementById("a-date").value;
        const selectedTime = document.getElementById("a-time").value;
        const duration = calculateTotalDuration(selectedServices);
        const barberName = barberSelect.options[barberSelect.selectedIndex]?.text || "";

        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }

        if (!selectedTime) {
            alert("Please select a time.");
            return;
        }

        if (!isBarberWorkingOnDate(barberSelect.value, selectedDate)) {
            alert("This barber does not work on the selected day.");
            return;
        }

        if (!isTimeSlotAvailable(barberSelect.value, barberName, selectedDate, selectedTime, duration)) {
            alert("This time is no longer available.");
            populateAvailableTimes("a-time", "a-barber", "a-date", "a-service");
            return;
        }


        const appointmentID = await generateAppointmentID();



        await createAppointment({
            appointmentID: appointmentID,
            customerID: customerInput.dataset.id,
            customer: customerInput.value,
            staffID: barberSelect.value,
            barber: barberSelect.options[barberSelect.selectedIndex]?.text || "",
            services: selectedServices,
            serviceName: selectedServices.map(service => service.serviceName).join(", "),
            totalCost: totalCost,
            date: selectedDate,
            time: selectedTime,
            notes: document.getElementById("a-notes")?.value || "",
            status: document.getElementById("a-status").value || "upcoming"
        });

        closeModal("appointmentModal");
        await loadAppointments();

        //close window when click save and alert
        alert("Appointments created successfully!");
        modal.style.display = "none";

        // keep every information when created, then when click on edit, there will show the information

        const selectedServiceIds = Array.from(serviceSelect.selectedOptions).map(o => o.value);

        window.lastAppointment = {
            customerName: customerInput.value,
            customerId: customerInput.dataset.id,
            barberId: barberSelect.value,
            services: selectedServices,
            date: document.getElementById("a-date").value,
            time: document.getElementById("a-time").value,
            notes: document.getElementById("a-notes")?.value || "",
            status: document.getElementById("a-status").value
        };


        customerInput.value = window.lastAppointment.customerName;
        customerInput.dataset.id = window.lastAppointment.customerId;

        barberSelect.value = window.lastAppointment.barberId;

        document.getElementById("a-date").value = window.lastAppointment.date;
        document.getElementById("a-time").value = window.lastAppointment.time;
        document.getElementById("a-notes").value = window.lastAppointment.notes;
        document.getElementById("a-status").value = window.lastAppointment.status;


        Array.from(serviceSelect.options).forEach(option => {
            option.selected = window.lastAppointment.services.includes(option.value);
        });
    };
}

//edit
async function populateEditDropdowns() {


    //show the barber name in edit
    const barberSelect = document.getElementById("edit-barber");
    if (barberSelect) {
        barberSelect.innerHTML = `<option value="">Select Barber</option>`;

        allStaff
            .filter(s => s.position === "Barber")
            .forEach(b => {
                const option = document.createElement("option");
                option.value = b.id;
                option.textContent = b.name || "Unnamed Barber";
                barberSelect.appendChild(option);
            });
    }


    //show the serive in edit
    const serviceSelect = document.getElementById("edit-service");
    if (serviceSelect) {
        serviceSelect.innerHTML = "";

        allServices.forEach(s => {
            const option = document.createElement("option");
            option.value = s.id;
            option.textContent = `${s.serviceName} - $${s.price}`;
            serviceSelect.appendChild(option);
        });
    }


}

function setupTableEvents() {
    const body = document.getElementById("appointment-body");

    body.onclick = async (e) => {

        const editBtn = e.target.closest(".edit");
        const deleteBtn = e.target.closest(".delete");

        if (editBtn) {



            const appointment = allAppointments.find(
                a => a.id === editBtn.dataset.id
            );

            if (!appointment) return;

            await populateEditDropdowns();

            document.getElementById("edit-id").value = appointment.id;
            document.getElementById("edit-date").value = appointment.date || "";
            document.getElementById("edit-date-display").textContent = appointment.date || "Select Date";
            document.getElementById("edit-time").value = appointment.time || "";
            document.getElementById("edit-status").value = appointment.status || "upcoming";
            //AUTO SHOW IF ALREADY "in process"
            if(appointment.status === "in-process"){
                const section = document.getElementById("supply-section");
                if(section){
                    section.style.display = "block";
                    await loadSuppliesForAppointment(appointment.suppliesUsed || []);
                }
            }

            document.getElementById("editAppointmentModal").style.display = "block";

            setupCustomerAutocomplete("edit-customer", "edit-customer-suggestions");

            // FORCE BIND AFTER MODAL OPENS
            const statusSelect = document.getElementById("edit-status");

            if(statusSelect){
                statusSelect.onchange = async function(){

                    console.log("STATUS CHANGED:", this.value);

                    const section = document.getElementById("supply-section");

                    if(!section){
                        console.error("NO supply-section");
                        return;
                    }

                    if(this.value === "in-process"){
                        section.style.display = "block";
                        await loadSuppliesForAppointment(appointment.suppliesUsed || []);
                    } else {
                        section.style.display = "none";
                    }
                };
            }
            const editCustomerInput = document.getElementById("edit-customer");

            editCustomerInput.value = appointment.customer || "";
            editCustomerInput.dataset.id = appointment.customerID || "";

            document.getElementById("edit-barber").value = appointment.staffID || "";
            const selectedServiceIds = Array.isArray(appointment.services)
                ? appointment.services.map(service => service.serviceId)
                : (appointment.serviceId ? [appointment.serviceId] : []);

            Array.from(document.getElementById("edit-service").options).forEach(option => {
                option.selected = selectedServiceIds.includes(option.value);
            });

            populateAvailableTimes("edit-time", "edit-barber", "edit-date", "edit-service", appointment.id);
            document.getElementById("edit-time").value = appointment.time || "";

            document.getElementById("editAppointmentModal").style.display = "block";
        }

        if (deleteBtn) {
            if (!confirm("Delete this appointment?")) return;

            await deleteAppointment(deleteBtn.dataset.id);
            await loadAppointments();
        }
    };
}

//update
function setupUpdateButton() {
    const updateBtn = document.getElementById("updateAppointment");
    if (!updateBtn) return;

    updateBtn.onclick = async () => {
        if (!allSupplies.length) {
            allSupplies = await getSupplies();
        }

        const id = document.getElementById("edit-id").value;

        const customerInput = document.getElementById("edit-customer");
        const barberSelect = document.getElementById("edit-barber");
        const selectedServices = getSelectedServices("edit-service");
        const totalCost = calculateTotalCost(selectedServices);

        if (!customerInput.dataset.id) {
            alert("Please select a valid customer from suggestions.");
            return;
        }

        if (!barberSelect.value) {
            alert("Please select a barber.");
            return;
        }

        if (selectedServices.length === 0) {
            alert("Please select at least one service.");
            return;
        }

        const selectedDate = document.getElementById("edit-date").value;
        const selectedTime = document.getElementById("edit-time").value;
        const duration = calculateTotalDuration(selectedServices);
        const barberName = barberSelect.options[barberSelect.selectedIndex]?.text || "";

        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }

        if (!selectedTime) {
            alert("Please select a time.");
            return;
        }

        if (!isBarberWorkingOnDate(barberSelect.value, selectedDate)) {
            alert("This barber does not work on the selected day.");
            return;
        }

        if (!isTimeSlotAvailable(barberSelect.value, barberName, selectedDate, selectedTime, duration, id)) {
            alert("This time is no longer available.");
            populateAvailableTimes("edit-time", "edit-barber", "edit-date", "edit-service", id);
            return;
        }

        const noteField =
            document.getElementById("edit-note") ||
            document.getElementById("edit-notes");

        //supply list appear when status changes to in process
        const status = document.getElementById("edit-status").value;
        //test
        console.log("UPDATE CLICKED");
        console.log("STATUS VALUE:", status);

        let suppliesUsed = [];

        if (status.toLowerCase().includes("process")) {

            const selectedSupplies = getSelectedSupplies();
            console.log("selectedSupplies:", selectedSupplies);

            for (const s of selectedSupplies) {

                const item = allSupplies.find(i => i.id === s.id);
                if (!item) continue;

                const newQty = (item.quantity || 0) - s.quantity;

                if (newQty < 0) {
                    alert("Not enough stock for " + item.itemName);
                    continue;
                }

                await updateSupply(s.id, {
                    ...item,
                    quantity: newQty
                });

                // save supplies used
                suppliesUsed.push({
                    id: s.id,
                    name: item.itemName,
                    quantity: s.quantity
                });
            }
        }
        const currentAppointment = allAppointments.find(a => a.id === id);

        const oldSupplies = Array.isArray(currentAppointment?.suppliesUsed)
            ? currentAppointment.suppliesUsed
            : [];

        const mergedSupplies = [...oldSupplies];

        suppliesUsed.forEach(newItem => {
            const existing = mergedSupplies.find(i => i.id === newItem.id);
            if (existing) {
                existing.quantity += newItem.quantity;
            } else {
                mergedSupplies.push(newItem);
            }
        });

        try {
            await updateAppointment(id, {
                customerID: customerInput.dataset.id,
                customer: customerInput.value,
                staffID: barberSelect.value,
                barber: barberSelect.options[barberSelect.selectedIndex]?.text || "",
                services: selectedServices,
                serviceName: selectedServices.map(service => service.serviceName).join(", "),
                date: selectedDate,
                totalCost: totalCost,
                time: selectedTime,
                notes: noteField?.value || "",
                suppliesUsed: mergedSupplies,
                status: document.getElementById("edit-status").value
            });

            closeModal("editAppointmentModal");
            await loadAppointments();
        } catch (error) {
            console.error("Failed to update appointment:", error);
            alert("Failed to update appointment.");
        }
    };
}

function setupCancelButtons() {
    const cancelCreateBtn = document.getElementById("cancelAppointment");
    if (cancelCreateBtn) {
        cancelCreateBtn.onclick = () => {
            cancelCreateBtn.onclick = () => closeModal("appointmentModal");
        };
    }

    const cancelEditBtn = document.getElementById("cancelEditAppointment");
    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            cancelEditBtn.onclick = () => closeModal("editAppointmentModal");
        };
    }
}

//add note to customer module

async function addNoteToCustomer(customerId, entry){
    const customers = await getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if(!customer) return;

    const history = customer.history || [];
    history.push(entry);

    const { updateCustomer } = await import("../BarberShopWebsite/Collections/customers.js");

    await updateCustomer(customerId, {
        ...customer,
        history: history
    });
}

function hookCreateHistory(){
    setTimeout(()=>{
        const btn = document.getElementById("saveAppointment");
        if(!btn) return;

        const original = btn.onclick;

        btn.onclick = async function(){
            if(original){
                await original.apply(this, arguments);
            }

            const customerSelect = document.getElementById("a-customer");
            const barberSelect = document.getElementById("a-barber");
            const note = document.getElementById("a-notes")?.value || "";

            if(note){
                await addNoteToCustomer(customerSelect.value,{
                    date: document.getElementById("a-date").value,
                    note: note,
                    staff: barberSelect.options[barberSelect.selectedIndex]?.text || ""
                });
            }
        };
    },300);
}

function hookUpdateHistory(){
    setTimeout(()=>{
        const btn = document.getElementById("updateAppointment");
        if(!btn) return;

        const original = btn.onclick;

        btn.onclick = async function(){
            if(original){
                await original.apply(this, arguments);

            }

            const customerSelect = document.getElementById("edit-customer");
            const barberSelect = document.getElementById("edit-barber");

            const noteField =
                document.getElementById("edit-note") ||
                document.getElementById("edit-notes");

            const note = noteField?.value || "";

            if(note){
                await addNoteToCustomer(customerSelect.dataset.id,{
                    date: document.getElementById("edit-date").value,
                    note: note,
                    staff: barberSelect.options[barberSelect.selectedIndex]?.text || ""
                });
            }
        };
    },300);
}


//load supplies
let allSupplies = [];

async function loadSuppliesForAppointment(existingSupplies = []) {

    allSupplies = await getSupplies();

    const container = document.getElementById("supply-list");
    if (!container) return;

    container.innerHTML = "";

    allSupplies.forEach(item => {

        const existing = existingSupplies.find(s => s.id === item.id);

        const checked = existing ? "checked" : "";
        const qty = existing ? existing.quantity : "";

        const div = document.createElement("div");

        div.innerHTML = `
            <label>
                <input type="checkbox" class="supply-check" value="${item.id}" ${checked}>
                ${item.itemName} (${item.quantity} ${item.unit || ""})
            </label>
            <input type="number" min="1" value="${qty}" class="supply-qty" data-id="${item.id}">
            <br>
        `;

        container.appendChild(div);
    });
}


function getSelectedSupplies() {

    const result = [];

    const container = document.getElementById("supply-list"); // ✅ FIX

    if (!container) return result;

    container.querySelectorAll(".supply-qty").forEach(input => {

        const id = input.dataset.id;
        const qty = parseInt(input.value || "0");

        if (qty > 0) {
            result.push({
                id,
                quantity: qty
            });
        }
    });

    return result;
    //test
    console.log("selectedSupplies:", selectedSupplies);
}

function sortAppointments(list, column, direction) {
    return [...list].sort((a, b) => {
        let valA = "";
        let valB = "";

        switch (column) {
            case "id":
                valA = a.appointmentID || a.id || "";
                valB = b.appointmentID || b.id || "";
                break;
            case "customer":
                valA = userCache[a.customerUid] || a.customer || "";
                valB = userCache[b.customerUid] || b.customer || "";
                break;
            case "barber":
                valA = a.barber || "";
                valB = b.barber || "";
                break;
            case "service":
                valA = a.serviceName || a.serviceID || "";
                valB = b.serviceName || b.serviceID || "";
                break;
            case "date":
                valA = a.date || "";
                valB = b.date || "";
                break;
            case "time":
                valA = a.time || "";
                valB = b.time || "";
                break;
            case "status":
                valA = a.status || "";
                valB = b.status || "";
                break;
            case "totalCost":
                valA = Number(a.totalCost || 0);
                valB = Number(b.totalCost || 0);
                return direction === "asc" ? valA - valB : valB - valA;
            default:
                return 0;
        }

        return direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
    });
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

            // Update arrow indicators on all headers
            headers.forEach(h => {
                const arrow = h.querySelector(".sort-arrow");
                if (arrow) arrow.textContent = "";
            });

            const activeArrow = th.querySelector(".sort-arrow");
            if (activeArrow) {
                activeArrow.textContent = sortState.direction === "asc" ? " ▲" : " ▼";
            }

            const currentList = getCurrentFilteredList();
            const sorted = sortAppointments(currentList, sortState.column, sortState.direction);
            renderTable(sorted);
        });
    });
}

function getCurrentFilteredList() {
    const input = document.getElementById("searchAppointment");
    const term = input?.value.toLowerCase() || "";

    if (!term) return allAppointments;

    return allAppointments.filter(a => {
        const name = (userCache[a.customerUid] || a.customer || "").toLowerCase();
        return (
            name.includes(term) ||
            (a.barber || "").toLowerCase().includes(term) ||
            (a.serviceName || a.service || "").toLowerCase().includes(term) ||
            (a.date || "").toLowerCase().includes(term) ||
            (a.time || "").toLowerCase().includes(term) ||
            (a.notes || "").toLowerCase().includes(term)
        );
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

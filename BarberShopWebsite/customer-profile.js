import { signOut, onAuthStateChanged, } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { updateDoc, doc, query, where, collection, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

import {
    loadServices,
    populateForm,
    getFormData,
    getSelectedService,
    mustGet
} from "./appointment-form.js";

let currentUser = null;

// buttons
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const cancelAppointmentBtn = document.getElementById("cancel-appointment-btn");
const editAppointmentBtn = document.getElementById("edit-appointment-btn");
const cancelEditAppointment = document.getElementById("cancelEditAptBtn");
const saveEditAppointment = document.getElementById("saveEditAptBtn");

// form
const editForm = document.getElementById("editForm");
const editAptForm = document.getElementById("editAppointmentForm");
const passwordForm = document.getElementById("passwordForm");

// text
const fnameText = document.getElementById("fnameText");
const lnameText = document.getElementById("lnameText");
const emailText = document.getElementById("emailText");
const mobileText = document.getElementById("mobileText");
const dobText = document.getElementById("dobText");

const editDate = document.getElementById("editDate");
const editBarber = document.getElementById("editBarber");
const editService = document.getElementById("editService");
const editTime = document.getElementById("editTime");

// inputs
const fnameInput = document.getElementById("fnameInput");
const lnameInput = document.getElementById("lnameInput");
const emailInput = document.getElementById("emailInput");
const mobileInput = document.getElementById("mobileInput");
const dobInput = document.getElementById("dobInput");

const appointmentSection = document.getElementById("history-card");
const reviewSection = document.getElementById("review-card");
const receiptSection = document.getElementById("receipt-card");

let selectedRow = null;
let upcomingData  = [];
let historyData   = [];
let upcomingSortCol = 0, upcomingSortDir = 1;
let historySortCol  = 0, historySortDir  = 1;
let currentHistoryUser = null;


// LOAD USER DATA FROM FIREBASE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userId = user.uid;

        const profile = await getUserProfile(userId); // still fetches from users table

        if (profile) {
            // Use the email from the users profile to query the customers table
            const customerProfile = await getCustomerByEmail(profile.email);

            if (customerProfile) {
                fnameText.textContent = customerProfile.firstName;
                lnameText.textContent = customerProfile.lastName;
                emailText.textContent = customerProfile.email;
                mobileText.textContent = customerProfile.phone;
                dobText.textContent = customerProfile.dob;
            }
        }

        await loadAppointments(user);
        await loadAppointmentHistory(user);
    }
});

async function getCustomerByEmail(email) {
    try {
        const customersRef = collection(db, "customers"); // your customers collection name
        const q = query(customersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        } else {
            console.warn("No customer found with email:", email);
            return null;
        }
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        return null;
    }
}

// EDIT BUTTON
editBtn.addEventListener("click", function(){

    fnameInput.value = fnameText.textContent;
    lnameInput.value = lnameText.textContent;
    emailInput.value = emailText.textContent;
    mobileInput.value = mobileText.textContent;
    dobInput.value = dobText.textContent;

    editForm.style.display = "block";
    passwordForm.style.display = "none";

});


// SAVE BUTTON
saveBtn.addEventListener("click", async function(e){

    const updatedData = {
        firstName: fnameInput.value,
        lastName: lnameInput.value,
        email: emailInput.value,
        phone: mobileInput.value,
        dob: dobInput.value
    };

    try {
        const customerProfile = await getCustomerByEmail(currentUser.email);
        console.log(customerProfile);

        await updateDoc(doc(db, "customers", customerProfile.customerID), updatedData);

        // UPDATE PAGE
        fnameText.textContent = updatedData.firstName;
        lnameText.textContent = updatedData.lastName;
        emailText.textContent = updatedData.email;
        mobileText.textContent = updatedData.phone;
        dobText.textContent = updatedData.dob;

        editForm.style.display = "none";

        console.log("Profile updated!");

    } catch (error) {
        console.error("Firestore update error:", error);
    }

});

// CANCEL BUTTON
cancelBtn.addEventListener("click", function(){
    editForm.style.display = "none";
});

async function loadAppointments(user) {
    const table = document.getElementById("appointments-table");

    try {
        const q = query(
            collection(db, "appointments"),
            where("customerUid", "==", user.uid),
            where("status", "in", ["upcoming", "confirmed"])
        );
        const querySnapshot = await getDocs(q);

        upcomingData = [];
        querySnapshot.forEach((docSnap) => {
            upcomingData.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderUpcoming(table);

        const thead = document.querySelector(".upcoming-card thead");
        makeSortable(
            thead,
            () => upcomingSortDir, d => upcomingSortDir = d,
            () => upcomingSortCol, c => upcomingSortCol = c,
            () => renderUpcoming(table)
        );

    } catch (error) {
        console.error("Error loading appointments:", error);
    }
}

function renderUpcoming(table) {
    const keys = ["date", "barber", "serviceName", "time"];
    const sorted = sortData(upcomingData, upcomingSortCol, upcomingSortDir, keys);

    table.innerHTML = "";

    if (sorted.length === 0) {
        table.innerHTML = `<tr><td colspan="4" style="text-align:center;">No upcoming appointments</td></tr>`;
        return;
    }

    sorted.forEach((data) => {
        const row = document.createElement("tr");
        row.dataset.id = data.id;

        const serviceDisplay = data.services
            ? data.services.map(s => s.serviceName).join(", ")
            : (data.serviceName || "N/A")

        row.innerHTML = `
            <td>${formatDate(data.date)}</td>
            <td>${data.barber}</td>
            <td>${serviceDisplay}</td>
            <td>${data.time}</td>
        `;
        row.addEventListener("click", () => {
            table.querySelectorAll("tr").forEach(r => r.classList.remove("selected-row"));
            row.classList.add("selected-row");
            selectedRow = row;
        });
        table.appendChild(row);
    });
}

cancelAppointmentBtn.addEventListener("click", async () => {
    if (!selectedRow) {
        alert("Please select an appointment first.");
        return;
    }

    const appointmentId = selectedRow.dataset.id;

    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
        // Update the status to "cancelled"
        await updateDoc(doc(db, "appointments", appointmentId), {
            status: "cancelled"
        });

        selectedRow = null;

        alert("Appointment cancelled successfully.");
        location.reload();
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        alert("Failed to cancel appointment: " + error.message);
    }
});

editAppointmentBtn.addEventListener("click", async () => {
    if (!selectedRow) {
        alert("Please select an appointment first.");
    }

    const appointmentId = selectedRow.dataset.id;
    await loadServices();

    const ref = doc(db, "appointments", appointmentId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        alert("Appointment not found");
        return;
    }

    const appointment = snap.data();

    // Set calendar to appointment date
    if (window.setCalendarDate) {
        window.setCalendarDate(appointment.date);
    }

    populateForm(appointment);

    editAptForm.style.display = "inline";

    const confirmBtn = mustGet("confirm-appointment");

    confirmBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const { barber, date, time } = getFormData();

        // Read all selected options from the multi-select
        const serviceSelect = document.getElementById("editService");
        const selectedOptions = Array.from(serviceSelect.selectedOptions);

        if (!barber || !date || !time || selectedOptions.length === 0) {
            alert("Please fill out all fields and select at least one service.");
            return;
        }

        const selectedServices = selectedOptions.map(opt => {
            const service = allServices.find(s => s.id === opt.value);
            return {
                serviceId: service.id,
                serviceName: service.serviceName,
                servicePrice: service.price,
                serviceDuration: service.duration
            };
        });

        await updateDoc(ref, {
            barber,
            date,
            time,
            services: selectedServices,
            totalPrice: selectedServices.reduce((sum, s) => sum + s.servicePrice, 0),
            totalDuration: selectedServices.reduce((sum, s) => sum + s.serviceDuration, 0)
        });

        alert("Appointment updated!");
        location.reload();
    });
});

cancelEditAppointment.addEventListener("click", async () => {
    editAptForm.style.display = "none";
})

async function loadAppointmentHistory(user) {
    currentHistoryUser = user;
    const historyTable = document.getElementById("appointment-history");

    try {
        const q = query(
            collection(db, "appointments"),
            where("customerUid", "==", user.uid),
            where("status", "in", ["cancelled", "completed", "paid"])
        );
        const querySnapshot = await getDocs(q);

        historyData = [];
        querySnapshot.forEach((docSnap) => {
            historyData.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderHistory(historyTable);

        const thead = document.querySelector(".history-card thead");
        makeSortable(
            thead,
            () => historySortDir, d => historySortDir = d,
            () => historySortCol, c => historySortCol = c,
            () => renderHistory(historyTable)
        );

    } catch (error) {
        console.error("Error loading appointment history:", error);
    }
}

function renderHistory(historyTable) {
    const keys = ["date", "barber", "serviceName", "status", "review", "review"];
    const sorted = sortData(historyData, historySortCol, historySortDir, keys);

    historyTable.innerHTML = "";

    if (sorted.length === 0) {
        historyTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No appointment history</td></tr>`;
        return;
    }

    sorted.forEach((data) => {
        const row = document.createElement("tr");

        const serviceDisplay = data.services
            ? data.services.map(s => s.serviceName).join(", ")
            : (data.serviceName || "N/A");

        row.innerHTML = `
            <td>${formatDate(data.date)}</td>
            <td>${data.barber}</td>
            <td>${serviceDisplay}</td>
            <td><span class="status-${data.status}">${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</span></td>
        `;

        const ratingCell = document.createElement("td");
        if (data.status === "completed" || data.status === "paid") {
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = "View";
            link.onclick = (e) => {
                e.preventDefault();
                appointmentSection.style.display = "none";
                reviewSection.style.display = "block";
                makeReview(currentHistoryUser, data, data.id);
            };
            ratingCell.appendChild(link);
        } else {
            ratingCell.textContent = "Unavailable";
        }

        const receiptCell = document.createElement("td");
        if (data.status === "completed" || data.status === "paid") {
            const receiptLink = document.createElement("a");
            receiptLink.href = "#";
            receiptLink.textContent = "View";
            receiptLink.onclick = (e) => {
                e.preventDefault();
                showReceipt(data);
            };
            receiptCell.appendChild(receiptLink);
        } else {
            receiptCell.textContent = "Unavailable";
        }

        row.appendChild(ratingCell);
        row.appendChild(receiptCell);
        historyTable.appendChild(row);
    });
}

function makeReview(user, data, dataID) {

    const details = document.getElementById("review-details");
    const reviewText = document.getElementById("review-text");

    const serviceDisplay = data.services
        ? data.services.map(s => s.serviceName).join(", ")
        : (data.serviceName || "N/A");

    details.innerHTML = `
    <p style="font-size: 18px;"><strong>Date:</strong> ${data.date}</p>
    <p style="font-size: 18px;"><strong>Barber:</strong> ${data.barber}</p>
    <p style="font-size: 18px;"><strong>Service:</strong> ${serviceDisplay}</p>
`;

    reviewText.value = data.review || "";

    const starRating = document.getElementById("star-rating");
    let stars = createStarRating(data.rating || 0)
    const saveBtn = document.getElementById("save-review");
    const cancelBtn = document.getElementById("cancel-review");

    starRating.appendChild(stars);

    saveBtn.onclick = async () => {
        const review = reviewText.value;
        const rating = Number(stars.dataset.rating);

        try {
            await updateDoc(doc(db, "appointments", dataID), {
                review: review,
                rating: rating
            });

            starRating.removeChild(stars);

            alert("Thank you for leaving your feedback!");
            location.reload();

        } catch (error) {
            console.error("Error saving review:", error);
        }
    };

    cancelBtn.onclick = () => {
        reviewSection.style.display = "none";
        appointmentSection.style.display = "block";

        starRating.removeChild(stars);
    };
}

// Updated createStarRating to accept docId
export function createStarRating(currentRating) {
    const container = document.createElement('div');
    container.className = 'star-rating';
    container.dataset.rating = currentRating;

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('img');
        star.dataset.value = i;
        star.src = i <= currentRating ? 'comb-full.png' : 'comb.png';
        star.style.width = '26px';
        star.style.cursor = 'pointer';
        star.style.marginRight = '4px';
        container.appendChild(star);
    }

    const stars = container.querySelectorAll('img');

    stars.forEach(star => {
        star.addEventListener('mouseover', () => highlightStars(stars, star.dataset.value));
        star.addEventListener('mouseout', () => highlightStars(stars, container.dataset.rating));

        star.addEventListener('click', () => {
            const newRating = Number(star.dataset.value);
            container.dataset.rating = newRating;
            highlightStars(stars, newRating);
        });
    });

    return container;
}

function highlightStars(stars, rating) {
    stars.forEach(star => {
        star.src = star.dataset.value <= rating ? 'comb-full.png' : 'comb.png';
    });
}

//receipt
function showReceipt(data) {
    const receiptDetails = document.getElementById("receipt-details");
    const receiptSection = document.getElementById("receipt-card");

    const serviceDisplay = data.services
        ? data.services.map(s => `${s.serviceName} ($${s.servicePrice}, ${s.serviceDuration} min)`).join("<br>")
        : `${data.serviceName} ($${data.servicePrice}, ${data.serviceDuration} min)`;

    const totalPrice = data.totalPrice ?? data.servicePrice;
    const totalDuration = data.totalDuration ?? data.serviceDuration;

    receiptDetails.innerHTML = `
        <p style="font-size: 18px;"><strong>Date:</strong> ${data.date}</p>
        <p style="font-size: 18px;"><strong>Barber:</strong> ${data.barber}</p>
        <p style="font-size: 18px;"><strong>Services:</strong><br>${serviceDisplay}</p>
        <p style="font-size: 18px;"><strong>Time:</strong> ${data.time}</p>
        <p style="font-size: 18px;"><strong>Total Duration:</strong> ${totalDuration} min</p>
        <p style="font-size: 18px;"><strong>Total Price:</strong> $${totalPrice}</p>
    `;

    appointmentSection.style.display = "none";
    reviewSection.style.display = "none";
    receiptSection.style.display = "block";

    document.getElementById("close-receipt").onclick = () => {
        receiptSection.style.display = "none";
        appointmentSection.style.display = "block";
    };
}

function sortData(data, col, dir, keys) {
    if (col < 0) return data;
    return [...data].sort((a, b) => {
        const va = a[keys[col]], vb = b[keys[col]];
        if (va instanceof Date && vb instanceof Date) return (va - vb) * dir;
        return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
}

function makeSortable(thead, getDir, setDir, getCol, setCol, renderFn) {
    thead.querySelectorAll("th").forEach((th, i) => {
        th.style.cursor = "pointer";
        th.style.userSelect = "none";
        const icon = document.createElement("span");
        icon.style.cssText = "margin-left:5px;font-size:11px;color:var(--color-text-tertiary);letter-spacing:-2px";
        icon.textContent = "";
        th.appendChild(icon);

        th.addEventListener("click", () => {
            const newDir = (i === getCol()) ? getDir() * -1 : 1;
            setCol(i);
            setDir(newDir);

            thead.querySelectorAll("th span").forEach((s, j) => {
                s.textContent = j === i ? (newDir === 1 ? "▲" : "▼") : "";
                s.style.color = j === i
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)";
            });

            renderFn();
        });
    });

    // highlight default sort column on load
    const icons = thead.querySelectorAll("th span");
    const initCol = getCol();
    if (initCol >= 0 && icons[initCol]) {
        icons[initCol].textContent = getDir() === 1 ? "▲" : "▼";
        icons[initCol].style.color = "var(--color-text-primary)";
    }
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // fallback if unparseable
    return date.toLocaleDateString("en-US", {
        month: "short", day: "2-digit", year: "numeric"
    });
}
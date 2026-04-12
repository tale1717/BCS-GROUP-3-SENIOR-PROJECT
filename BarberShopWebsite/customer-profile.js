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

let selectedRow = null;


// LOAD USER DATA FROM FIREBASE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userId = user.uid;

        const profile = await getUserProfile(userId);

        if (profile) {
            fnameText.textContent = profile.firstName;
            lnameText.textContent = profile.lastName;
            emailText.textContent = profile.email;
            mobileText.textContent = profile.phone;
            dobText.textContent = profile.dob;
        }

        await loadAppointments(user);
        await loadAppointmentHistory(user);
    }
});

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

        await updateDoc(doc(db, "users", currentUser.uid), updatedData);
        await updateDoc(doc(db, "customers", currentUser.uid), updatedData);

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

        table.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <tr>
                    <td>${data.date}</td>
                    <td>${data.barber}</td>
                    <td>${data.serviceName}</td>
                    <td>${data.time}</td>
                </tr>
            `;

            // Store the document ID in a data attribute
            row.dataset.id = doc.id;

            // Add click event to select
            row.addEventListener("click", () => {
                // Remove selection from other rows
                const rows = table.querySelectorAll("tr");
                rows.forEach(r => r.classList.remove("selected-row"));

                // Highlight this row
                row.classList.add("selected-row");

                // Store the currently selected row
                selectedRow = row;

                // Optional: do something with the selected row
                console.log("Selected appointment ID:", doc.id);
                console.log("Selected data:", data);
            });

            table.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading appointments:", error);
    }
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

        const { barber, date, time, serviceId } = getFormData();
        const service = getSelectedService(serviceId);

        if (!barber || !date || !time || !service) {
            alert("Please fill out all fields.");
            return;
        }

        await updateDoc(ref, {
            barber,
            date,
            time,
            serviceId: service.id,
            serviceName: service.serviceName,
            servicePrice: service.price,
            serviceDuration: service.duration
        });

        alert("Appointment updated!");
        location.reload();
    });
});

cancelEditAppointment.addEventListener("click", async () => {
    editAptForm.style.display = "none";
})

async function loadAppointmentHistory(user) {
    const historyTable = document.getElementById("appointment-history");

    try {
        const q = query(
            collection(db, "appointments"),
            where("customerUid", "==", user.uid),
            where("status", "in", ["cancelled", "completed"])
        );

        const querySnapshot = await getDocs(q);

        historyTable.innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${data.date}</td>
                <td>${data.barber}</td>
                <td>${data.serviceName}</td>
                <td>
                    <span class="status-${data.status}">
                        ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                    </span>                        
                </td>       
            `;

            const ratingCell = document.createElement('td');
            const link = document.createElement("a");
            link.href="#";
            link.onclick = (e) => {
                e.preventDefault();

                appointmentSection.style.display = "none";
                reviewSection.style.display = "block";

                makeReview(user, data, docSnap.id);
            }
            const text = document.createTextNode("View");

            if (data.status === "completed") {
                link.appendChild(text);
                ratingCell.appendChild(link);

            } else {
                ratingCell.textContent = "Unavailable";
            }

            row.appendChild(ratingCell);
            historyTable.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading appointments:", error);
    }
}

function makeReview(user, data, dataID) {

    const details = document.getElementById("review-details");
    const reviewText = document.getElementById("review-text");

    details.innerHTML = `
        <p style="font-size: 18px;"><strong>Date:</strong> ${data.date}</p>
        <p style="font-size: 18px;"><strong>Barber:</strong> ${data.barber}</p>
        <p style="font-size: 18px;"><strong>Service:</strong> ${data.serviceName}</p>
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
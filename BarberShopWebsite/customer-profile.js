import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { updateDoc, doc, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { auth, db } from "/BarberShopWebsite/firebase.js";
import { getUserProfile } from "/BarberShopWebsite/Collections/users.js";

let currentUser = null;

// buttons
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const cancelAppointmentBtn = document.getElementById("cancel-appointment-btn");
const editAppointmentBtn = document.getElementById("edit-appointment-btn");
const cancelEditAppointment = document.getElementById("cancelAptBtn");
const saveEditAppointment = document.getElementById("saveEditAptBtn");

// form
const editForm = document.getElementById("editForm");
const editAptForm = document.getElementById("editAppointmentForm");

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
            where("status", "==", "confirmed")
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
                    <td>${data.service}</td>
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

        // Remove the row from the table immediately
        selectedRow.remove();
        selectedRow = null;

        alert("Appointment cancelled successfully.");
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        alert("Failed to cancel appointment: " + error.message);
    }
});

editAppointmentBtn.addEventListener("click", async () => {
    if (!selectedRow) {
        alert("Please select an appointment first.");
        return;
    }

    editAptForm.style.display = "block";

    editDate.value = selectedRow.dataset.date;
    editBarber.value = selectedRow.dataset.barber;
    editService.value = selectedRow.dataset.service;
    editTime.value = selectedRow.dataset.time;

})

cancelEditAppointment.addEventListener("click", async () => {
    editAptForm.style.display = "none";
})

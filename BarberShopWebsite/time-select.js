import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { db } from "/BarberShopWebsite/firebase.js";

async function populateTimeSelect() {
    const select = document.getElementById("time");
    select.innerHTML = ""; // clear existing options

    const barber = document.getElementById("barber").value;
    const date = document.getElementById("date").value;

    if (!barber || !date) {
        const option = document.createElement("option");
        option.textContent = "Select Time";
        option.value = "";
        select.appendChild(option);
        return;
    }

    // Generate all times
    let startHour = 9;
    let endHour = 18;
    const intervalMinutes = 20;
    const allTimes = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
            if (hour === endHour && minutes > 0) continue;
            const hour12 = hour % 12 || 12;
            const ampm = hour < 12 ? "AM" : "PM";
            const minutesStr = String(minutes).padStart(2, "0");
            allTimes.push({
                value: `${String(hour).padStart(2, "0")}:${minutesStr}`,
                display: `${hour12}:${minutesStr} ${ampm}`
            });
        }
    }

    // Fetch booked times
    const appointmentsRef = collection(db, "appointments");
    const q = query(
        appointmentsRef,
        where("barber", "==", barber),
        where("date", "==", date)
    );
    const snapshot = await getDocs(q);
    const bookedTimes = snapshot.docs.map(doc => doc.data().time);

    const availableTimes = allTimes.filter(t => !bookedTimes.includes(t.value));

    if (availableTimes.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No available times";
        option.value = "";
        select.appendChild(option);
    } else {
        availableTimes.forEach(t => {
            const option = document.createElement("option");
            option.value = t.value;
            option.textContent = t.display;
            select.appendChild(option);
        });
    }
}

// Listen to barber changes
document.getElementById("barber").addEventListener("change", populateTimeSelect);

// Listen to date changes triggered by calendar click
document.getElementById("date").addEventListener("change", populateTimeSelect);

// Also call initially in case barber and date are pre-selected
document.addEventListener("DOMContentLoaded", populateTimeSelect);
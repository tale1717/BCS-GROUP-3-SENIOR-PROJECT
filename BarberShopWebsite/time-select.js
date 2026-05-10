import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { db } from "/BarberShopWebsite/firebase.js";

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatTimeDisplay(time) {
    const [hourText, minuteText] = time.split(":");
    const hour = Number(hourText);
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";

    return `${hour12}:${minuteText} ${ampm}`;
}

function getSelectedBarberWorkingTime(date) {
    const barberSelect = document.getElementById("barber");
    const selectedOption = barberSelect?.options[barberSelect.selectedIndex];

    if (!selectedOption?.dataset.workingHours) {
        return {
            start: "09:00",
            end: "18:00"
        };
    }

    try {
        const workingHours = JSON.parse(selectedOption.dataset.workingHours);
        const dayName = new Date(date + "T00:00:00")
            .toLocaleDateString("en-US", { weekday: "long" });

        return workingHours[dayName] || null;
    } catch (error) {
        console.error("Invalid barber working hours:", error);

        return {
            start: "09:00",
            end: "18:00"
        };
    }
}

async function populateTimeSelect() {
    const select = document.getElementById("time");
    select.innerHTML = "";

    const barberSelect = document.getElementById("barber");
    const staffID = barberSelect.value;
    const barberName = barberSelect.options[barberSelect.selectedIndex]?.textContent.trim() || "";
    const date = document.getElementById("date").value;

    if (!staffID || !date) {
        const option = document.createElement("option");
        option.textContent = "Select Time";
        option.value = "";
        select.appendChild(option);
        return;
    }

    const workingTime = getSelectedBarberWorkingTime(date);

    if (!workingTime) {
        const option = document.createElement("option");
        option.textContent = "Barber unavailable this day";
        option.value = "";
        select.appendChild(option);
        return;
    }

    const intervalMinutes = 20;
    const allTimes = [];

    const startMinutes = timeToMinutes(workingTime.start);
    const endMinutes = timeToMinutes(workingTime.end);

    for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
        const value = minutesToTime(minutes);

        allTimes.push({
            value,
            display: formatTimeDisplay(value)
        });
    }

    const appointmentsRef = collection(db, "appointments");

    const staffQuery = query(
        appointmentsRef,
        where("staffID", "==", staffID),
        where("date", "==", date)
    );

    const staffSnapshot = await getDocs(staffQuery);

    const nameQuery = query(
        appointmentsRef,
        where("barber", "==", barberName),
        where("date", "==", date)
    );

    const nameSnapshot = await getDocs(nameQuery);

    const bookedTimes = [
        ...staffSnapshot.docs.map(doc => doc.data().time),
        ...nameSnapshot.docs.map(doc => doc.data().time)
    ];

    const availableTimes = allTimes.filter(t => !bookedTimes.includes(t.value));

    if (availableTimes.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No available times";
        option.value = "";
        select.appendChild(option);
    } else {
        const placeholder = document.createElement("option");
        placeholder.textContent = "Select Time";
        placeholder.value = "";
        select.appendChild(placeholder);

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

// Listen to date changes triggered by a calendar click
document.getElementById("date").addEventListener("change", populateTimeSelect);

// Also call initially in case barber and date are pre-selected
document.addEventListener("DOMContentLoaded", populateTimeSelect);
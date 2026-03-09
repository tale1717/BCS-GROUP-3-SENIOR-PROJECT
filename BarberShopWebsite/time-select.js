function populateTimeSelect() {
    const select = document.getElementById("time");
    select.innerHTML = ""; // clear any existing options

    let startHour = 9; // 9 AM
    let endHour = 18;   // 6 PM
    const intervalMinutes = 20; // 30-minute increments

    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
            // Skip times past 6 PM exactly
            if (hour === endHour && minutes > 0) continue;

            // Format 12-hour time
            let hour12 = hour % 12 || 12;
            let ampm = hour < 12 ? "AM" : "PM";
            let minutesStr = String(minutes).padStart(2, "0");
            let display = `${hour12}:${minutesStr} ${ampm}`;

            // Value in 24-hour format for Firestore
            let value = `${String(hour).padStart(2, "0")}:${minutesStr}`;

            const option = document.createElement("option");
            option.value = value;
            option.textContent = display;

            select.appendChild(option);
        }
    }
}

// Call the function after DOM is loaded
document.addEventListener("DOMContentLoaded", populateTimeSelect);
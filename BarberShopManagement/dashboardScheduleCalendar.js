import { auth, db } from "../BarberShopWebsite/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
    collection,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

let selectedWeekStart = getWeekStart(new Date());

let allStaff = [];

const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

const dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        const userSnap = await getDoc(doc(db, "users", user.uid));
        const role = userSnap.exists() ? userSnap.data().role : null;

        if ((role || "").toLowerCase().includes("barber")) {
            return;
        }

        const card = document.getElementById("managerScheduleCalendarCard");
        if (card) card.style.display = "block";

        await loadStaff();
        renderManagerCalendar();
        renderWeeklySchedule();
        setupWeekNavigation();
        setupScheduleViewToggle();
    });
});



async function loadStaff() {
    const snap = await getDocs(collection(db, "staff"));
    allStaff = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));
}

function renderManagerCalendar() {
    const datesContainer = document.getElementById("manager-calendar-dates");
    const currentDateText = document.getElementById("manager-calendar-current-date");

    if (!datesContainer || !currentDateText) return;

    let firstDay = new Date(year, month, 1).getDay();
    let lastDate = new Date(year, month + 1, 0).getDate();
    let lastDay = new Date(year, month, lastDate).getDay();
    let previousMonthLastDate = new Date(year, month, 0).getDate();

    let html = "";

    for (let i = firstDay; i > 0; i--) {
        html += `<li class="inactive">${previousMonthLastDate - i + 1}</li>`;
    }

    for (let day = 1; day <= lastDate; day++) {
        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);

        const dayName = dayNames[currentDate.getDay()];
        const workers = getWorkersForDay(dayName);

        const weekEnd = selectedWeekStart
            ? new Date(selectedWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            : null;

        const inSelectedWeek = selectedWeekStart &&
            currentDate >= selectedWeekStart &&
            currentDate < weekEnd;

        const hasWorkers = workers.length > 0 ? "highlight" : "";

        let weekClass ="";
        if(    document.getElementById("scheduleViewMode")?.value === "week" && inSelectedWeek){
        weekClass = "week-selected";
        if (currentDate.getDay() === 0) {
            weekClass += " week-start";
        }

        if (currentDate.getDay() === 6) {
            weekClass += " week-end";
        }
    }

        html += `
        <li class="${hasWorkers} ${weekClass}" data-day="${day}">
            ${day}
        </li>
    `;
    }

    for (let i = lastDay; i < 6; i++) {
        html += `<li class="inactive">${i - lastDay + 1}</li>`;
    }

    currentDateText.textContent = `${months[month]} ${year}`;
    datesContainer.innerHTML = html;

    setupDateClicks();
    setupNavigation();
}

function setupNavigation() {
    const prev = document.getElementById("manager-calendar-prev");
    const next = document.getElementById("manager-calendar-next");

    if (prev) {
        prev.onclick = () => {
            month--;

            if (month < 0) {
                month = 11;
                year--;
            }

            renderManagerCalendar();
        };
    }

    if (next) {
        next.onclick = () => {
            month++;

            if (month > 11) {
                month = 0;
                year++;
            }

            renderManagerCalendar();
        };
    }
}

function setupDateClicks() {
    const datesContainer = document.getElementById("manager-calendar-dates");

    datesContainer
        .querySelectorAll("li:not(.inactive)")
        .forEach(li => {
            li.onclick = () => {
                datesContainer.querySelectorAll("li").forEach(d => {
                    d.classList.remove("active");
                });

                const day = Number(li.dataset.day);
                const selectedDate = new Date(year, month, day);
                const dayName = dayNames[selectedDate.getDay()];

                if (document.getElementById("scheduleViewMode")?.value === "week") {
                    selectedWeekStart = getWeekStart(selectedDate);
                    renderWeeklySchedule();
                    renderManagerCalendar();
                } else {
                    li.classList.add("active");
                    showWorkersForDay(dayName, day);

                }
            };
        });
}

function getWorkersForDay(dayName) {
    return allStaff.filter(staff => {
        return staff.workingHours && staff.workingHours[dayName];
    });
}

function showWorkersForDay(dayName, day) {
    const title = document.getElementById("manager-selected-date");
    const list = document.getElementById("manager-working-list");

    if (!title || !list) return;

    const workers = getWorkersForDay(dayName);

    title.textContent = `${dayName}, ${months[month]} ${day}, ${year}`;

    if (workers.length === 0) {
        list.innerHTML = `<p style="color:gray;">No employees scheduled.</p>`;
        return;
    }

    list.innerHTML = `
        <div class="manager-day-schedule">
            <div class="manager-time-column">
                ${createTimeLabels()}
            </div>       
            <div class="manager-barber-columns">
                ${workers.map(worker => createBarberColumn(worker, dayName)).join("")}
            </div>
        </div>  
    `;
    setTimeout(scrollDayViewToNineAM, 0);
}

function createTimeLabels() {
    let html = `<div class="manager-barber-header"></div>`;

    for (let hour = 0; hour < 24; hour++) {
        html += `<div class="manager-hour-label">${formatHour(hour)}</div>`;
    }

    return html;
}

function createBarberColumn(worker, dayName) {
    const hours = worker.workingHours[dayName];

    const startMinutes = timeToMinutes(hours.start);
    const endMinutes = timeToMinutes(hours.end);

    const dayStart = 0;
    const dayEnd = 24 * 60;
    const totalDayMinutes = dayEnd - dayStart;

    const topPercent = ((startMinutes - dayStart) / totalDayMinutes) * 100;
    const heightPercent = ((endMinutes - startMinutes) / totalDayMinutes) * 100;

    return `
        <div class="manager-barber-column">
            <div class="manager-barber-header">
                ${worker.name || "Unnamed"}
            </div>

            <div class="manager-barber-day">
                <div
                    class="manager-shift-block"
                    style="top:${topPercent}%; height:${heightPercent}%;">
                    <strong>${worker.name || "Unnamed"}</strong>
                    <span>${formatTime(hours.start)} - ${formatTime(hours.end)}</span>
                </div>
            </div>
        </div>
    `;
}

function scrollDayViewToNineAM() {
    const list = document.getElementById("manager-working-list");
    if (!list) return;

    // 9 hours * 60px per hour
    list.scrollTop = 9 * 60;
}

function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function formatHour(hour) {
    if (hour === 12) return "12 PM";
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
}

function formatTime(time) {
    const [hour, minute] = time.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function renderWeeklySchedule() {
    const tableContainer = document.getElementById("manager-week-table");
    if (!tableContainer) return;

    const weekRange = document.getElementById("week-range");
    const weekEnd = new Date(selectedWeekStart);
    weekEnd.setDate(selectedWeekStart.getDate() + 6);

    if (weekRange) {
        weekRange.textContent = `${formatDateShort(selectedWeekStart)} - ${formatDateShort(weekEnd)}`;
    }

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const workers = allStaff.filter(staff => staff.workingHours);

    if (workers.length === 0) {
        tableContainer.innerHTML = `<p style="color:gray;">No employee schedules found.</p>`;
        return;
    }

    tableContainer.innerHTML = `
        <table class="manager-week-schedule-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Job/Shift</th>
                    ${days.map((day, index) => {
        const currentDate = new Date(selectedWeekStart);
        currentDate.setDate(selectedWeekStart.getDate() + index);

        return `<th>${day}<br>${formatDateShort(currentDate)}</th>`;
    }).join("")}
                </tr>
            </thead>

            <tbody>
                ${workers.map(worker => `
                    <tr>
                        <td>${worker.name || "Unnamed Employee"}</td>
                        <td>${worker.position || ""}</td>
                        ${days.map(day => {
        const hours = worker.workingHours?.[day];

        return `
                                <td>
                                    ${
            hours
                ? `${formatTime(hours.start)} - ${formatTime(hours.end)}`
                : "-"
        }
                                </td>
                            `;
    }).join("")}
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function setupScheduleViewToggle() {
    const select = document.getElementById("scheduleViewMode");
    const dayView = document.getElementById("manager-day-view");
    const weekView = document.getElementById("manager-week-view");

    if (!select || !dayView || !weekView) return;

    select.addEventListener("change", () => {
        if (select.value === "week") {
            dayView.style.display = "none";
            weekView.style.display = "block";
            selectedWeekStart = getWeekStart(new Date());
            renderWeeklySchedule();
            renderManagerCalendar();
        } else {
            dayView.style.display = "flex";
            weekView.style.display = "none";
        }
    });
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();

    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);

    return d;
}

function formatDateShort(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function setupWeekNavigation() {
    const prevBtn = document.getElementById("prev-week");
    const nextBtn = document.getElementById("next-week");

    if (!prevBtn || !nextBtn) return;

    prevBtn.onclick = () => {
        const previousWeek = new Date(selectedWeekStart);
        previousWeek.setDate(selectedWeekStart.getDate() - 7);

        if (previousWeek.getMonth() !== month) {
            year = previousWeek.getFullYear();
            month = previousWeek.getMonth();
            selectedWeekStart = getWeekStart(new Date(year, month, 1));
        } else {
            selectedWeekStart = previousWeek;
        }

        renderWeeklySchedule();
        renderManagerCalendar();
    };

    nextBtn.onclick = () => {
        const nextWeek = new Date(selectedWeekStart);
        nextWeek.setDate(selectedWeekStart.getDate() + 7);

        if (nextWeek.getMonth() !== month) {
            year = nextWeek.getFullYear();
            month = nextWeek.getMonth();
            selectedWeekStart = getWeekStart(new Date(year, month, 1));
        } else {
            selectedWeekStart = nextWeek;
        }

        renderWeeklySchedule();
        renderManagerCalendar();
    };
}
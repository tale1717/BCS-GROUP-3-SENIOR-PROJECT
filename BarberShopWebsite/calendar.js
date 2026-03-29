let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const today = new Date();
today.setHours(0,0,0,0);

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation span");
const displayDate = document.getElementById("date-display");

const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

// Barber working schedules
// 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const barberSchedule = {
    Talero: [0,1,2,3,4,5,6],   // Every Day
    Thai: [2,3,5],             // Tue, Wed, Fri
    Tobias: [0,1,4,6],         // Mon, Thur, Sat, Sun
    Guaman: [0,6]              // Sat-Sun
};

let clickedDay = null;
let selectedDayElement = null;

function getSelectedBarber() {
    const barberSelect = document.getElementById("barber");
    return barberSelect ? barberSelect.value : null;
}

const manipulate = () => {

    let dayone = new Date(year, month, 1).getDay();
    let lastdate = new Date(year, month + 1, 0).getDate();
    let dayend = new Date(year, month, lastdate).getDay();
    let monthlastdate = new Date(year, month, 0).getDate();

    let lit = "";

    // Previous month trailing days
    for (let i = dayone; i > 0; i--) {
        lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    const barber = getSelectedBarber();
    const allowedDays = barberSchedule[barber] || [0,1,2,3,4,5,6];

    // Current month days
    for (let i = 1; i <= lastdate; i++) {

        const currentDate = new Date(year, month, i);
        currentDate.setHours(0,0,0,0);

        const dayOfWeek = currentDate.getDay();
        const isAllowed = allowedDays.includes(dayOfWeek);

        // check if date is in the past
        const isPast = currentDate < today;

        let disabledClass = (!isAllowed || isPast) ? "disabled-day" : "";

        let isToday =
            (i === date.getDate()
                && month === new Date().getMonth()
                && year === new Date().getFullYear())
                ? "active"
                : "";

        let highlightClass = (clickedDay === i) ? "highlight" : "";

        lit += `<li class="${isToday} ${highlightClass} ${disabledClass}" data-day="${i}">${i}</li>`;
    }

    // Next month leading days
    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`;
    }

    currdate.innerText = `${months[month]} ${year}`;
    day.innerHTML = lit;

    addClickListenersToDays();
};

function addClickListenersToDays() {

    const allDays = day.querySelectorAll("li:not(.inactive):not(.disabled-day)");

    allDays.forEach(li => {

        li.addEventListener("click", () => {

            if (selectedDayElement) {
                selectedDayElement.classList.remove("highlight");
            }

            li.classList.add("highlight");
            selectedDayElement = li;

            clickedDay = parseInt(li.getAttribute("data-day"));

            const monthNumber = String(month + 1).padStart(2,"0");
            const dayNumber = String(clickedDay).padStart(2,"0");

            const storedDate = `${year}-${monthNumber}-${dayNumber}`;

            // store date for booking system
            document.getElementById("date").value = storedDate;

            // display readable date
            displayDate.textContent = `${months[month]} ${clickedDay}, ${year}`;

            document.getElementById("date").dispatchEvent(new Event("change"));

            console.log("Selected date:", storedDate);
        });

    });

}

manipulate();

displayDate.textContent = "Select a Date"

// Month navigation
prenexIcons.forEach(icon => {

    icon.addEventListener("click", () => {

        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        if (month < 0 || month > 11) {
            date = new Date(year, month, new Date().getDate());
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }

        clickedDay = null;
        selectedDayElement = null;

        manipulate();
    });

});

// Refresh calendar when barber changes
document.addEventListener("DOMContentLoaded", () => {

    const barberSelect = document.getElementById("barber");

    if (barberSelect) {

        barberSelect.addEventListener("change", () => {

            clickedDay = null;
            selectedDayElement = null;

            manipulate();
        });

    }

});
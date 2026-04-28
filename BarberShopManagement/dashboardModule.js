import {
    getAppointments
} from "../BarberShopWebsite/Collections/appointments.js";

import {
    isThisWeek,
    isThisMonth,
    parseISO,
    getDay,
    getDate
} from "https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm";

let appointmentsData = [];
let chartInstance = null;

//  Initial
document.addEventListener("DOMContentLoaded", async () => {
    try {
        appointmentsData = await getAppointments();


        const todayCount = getTodayAppointmentsCount(appointmentsData);
        const todayRevenue = getTodayRevenue(appointmentsData);

        // update total today's appointments
        document.getElementById("todayAppointments").innerText = todayCount;

        // update total today's revenue
        document.getElementById("todayRevenue").innerText = `$${todayRevenue}`;


        console.log("Loaded appointments:", appointmentsData);

        // default = week
        updateChart("week");

        document.getElementById("viewMode").addEventListener("change", (e) => {
            updateChart(e.target.value);
        });

    } catch (err) {
        console.error("Error loading appointments:", err);
    }
});

//count total today's appointments
function getTodayAppointmentsCount(appointments) {
    const today = new Date();

    return appointments.filter(app => {
        if (!app.date) return false;

        const date = parseISO(app.date);

        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    }).length;
}

//get weekly customers
function getWeeklyCustomerData(appointments) {
    const weeklyData = Array(7).fill(0);

    appointments.forEach(app => {
        if (!app.date) return;

        const date = parseISO(app.date);

        if (isThisWeek(date)) {
            const day = getDay(date); // 0 = Sunday
            weeklyData[day]++;
        }
    });

    return weeklyData;
}

//get monthly customers
function getMonthlyCustomerData(appointments) {
    const monthlyData = Array(31).fill(0);

    appointments.forEach(app => {
        if (!app.date) return;

        const date = parseISO(app.date);

        if (isThisMonth(date)) {
            const day = getDate(date) - 1;
            monthlyData[day]++;
        }
    });

    return monthlyData;
}

//switch mode between week and month
function updateChart(mode) {
    let data, labels;

    if (mode === "week") {
        data = getWeeklyCustomerData(appointmentsData);
        labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    } else {
        data = getMonthlyCustomerData(appointmentsData);
        labels = Array.from({ length: 31 }, (_, i) => i + 1);
    }

    renderLineChart(data, labels);
}

//render chart
function renderLineChart(data, labels) {
    const ctx = document.getElementById("customerLineChart");

    if (!ctx) {
        console.error("Canvas not found!");
        return;
    }

    // destroy old chart (IMPORTANT)
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Customers",
                data: data,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

//count total today's revenue
function getTodayRevenue(appointments) {
    const today = new Date();

    return appointments.reduce((total, app) => {
        if (!app.date) return total;

        const date = parseISO(app.date);

        const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

        const status = (app.status || "").toLowerCase();

        // only count PAID
        if (isToday && status === "paid") {
            return total + Number(app.totalCost || app.price || 0);// change field if needed
        }

        return total;
    }, 0);
}
import {
    getAppointments
} from "../BarberShopWebsite/Collections/appointments.js";

import { getStaff } from "../BarberShopWebsite/Collections/staff.js";

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
        const staff = await getStaff();

        const performance = getPerformanceByBarber(appointmentsData, staff);
        console.log("Appointments:", appointmentsData);
        console.log("Staff:", staff);
        console.log("Performance:", performance);

        populateBarberSelect(staff);

        const select = document.getElementById("barberSelect");

        // DEFAULT (first barber)
        const firstId = staff[0]?.id;
        if (firstId) {
            renderSingleBarberChart(performance[firstId]);
            select.value = firstId;
        }

        // ONLY chart update here
        select.addEventListener("change", (e) => {
            const selectedId = e.target.value;
            renderSingleBarberChart(performance[selectedId]);
        });

        // BARBER WORKING CHART
        const barbersPerDay = getBarbersPerDay(staff);
        const chartData = prepareBarberChartData(barbersPerDay);
        renderBarberChart(chartData);

        // TODAY STATS
        const todayCount = getTodayAppointmentsCount(appointmentsData);
        const todayRevenue = getTodayRevenue(appointmentsData);

        document.getElementById("todayAppointments").innerText = todayCount;
        document.getElementById("todayRevenue").innerText = `$${todayRevenue}`;

        // CUSTOMER TREND
        updateChart("week");

        document.getElementById("viewMode").addEventListener("change", (e) => {
            updateChart(e.target.value);
        });

    } catch (err) {
        console.error("Error loading dashboard:", err);
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
       // const barber = result[app.staffID || app.staffId];//
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

//count barber per day
function getBarbersPerDay(staffList) {
    const days = [
        "Sunday","Monday","Tuesday",
        "Wednesday","Thursday","Friday","Saturday"
    ];

    const result = {};
    days.forEach(day => result[day] = 0);

    staffList.forEach(staff => {
        const workingHours = staff.workingHours || {};

        Object.keys(workingHours).forEach(day => {
            if (result[day] !== undefined) {
                result[day]++;
            }
        });
    });

    return result;
}

//convert it onto bar chart
function prepareBarberChartData(data) {
    return {
        labels: Object.keys(data),
        values: Object.values(data)
    };
}

//put data on chart
function renderBarberChart(data) {
    const ctx = document.getElementById("barberChart");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Barbers Working",
                data: data.values
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

//show working hour
function getWorkingHoursPerDay(staffList) {
    const result = {
        Sunday: 0, Monday: 0, Tuesday: 0,
        Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
    };

    staffList.forEach(staff => {
        const workingHours = staff.workingHours || {};

        Object.entries(workingHours).forEach(([day, time]) => {
            if (time.start && time.end) {
                const start = parseInt(time.start.split(":")[0]);
                const end = parseInt(time.end.split(":")[0]);

                result[day] += (end - start);
            }
        });
    });

    return result;
}

//group data by barber
function getPerformanceByBarber(appointments, staffList) {
    const result = {};

    staffList.forEach(s => {
        result[String(s.id)] = {
            name: s.name,
            customers: 0,
            revenue: 0
        };
    });

    appointments.forEach(app => {
        const staffId = String(app.staffId || app.staffID || "");

        if (!result[staffId]) {
            console.warn("No matching barber for:", staffId);
            return;
        }

        result[staffId].customers++;

        if ((app.status || "").toLowerCase() === "paid") {
            result[staffId].revenue += Number(app.totalCost || app.price || 0);
        }
    });

    return result;
}


function populateBarberSelect(staffList) {
    const select = document.getElementById("barberSelect");

    staffList.forEach(s => {
        const option = document.createElement("option");
        option.value = s.id;
        option.textContent = s.name;
        select.appendChild(option);
    });
}

let barberChart = null;
//create single chart for each barber
function renderSingleBarberChart(barber) {
    const ctx = document.getElementById("barberPerformanceChart");

    if (barberChart) barberChart.destroy();

    barberChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Customers", "Revenue"],
            datasets: [{
                label: barber.name,
                data: [barber.customers, barber.revenue]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
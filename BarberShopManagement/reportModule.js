import { getAppointments } from "../BarberShopWebsite/Collections/appointments.js";
import { getCustomers } from "../BarberShopWebsite/Collections/customers.js";
import { getSupplies } from "../BarberShopWebsite/Collections/inventory.js";
import { getStaff } from "../BarberShopWebsite/Collections/staff.js";

//select date week month
function isToday(dateStr) {
    const today = new Date();
    const d = new Date(dateStr);
    return d.toDateString() === today.toDateString();
}

function isThisWeek(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);

    const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    return d >= firstDay && d <= lastDay;
}

function isThisYear(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    return d.getFullYear() === now.getFullYear();
}

//export to csv
function exportToExcel(filename, rows) {
    if (!rows.length) {
        alert("No data to export");
        return;
    }

    // convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // download file
    XLSX.writeFile(workbook, filename + ".xlsx");
}

//appointment report(today, week, month, year...)
export async function exportAppointmentsReport(type = "today") {

    const appointments = await getAppointments();

    let filtered = [];

    if (type === "today") {
        filtered = appointments.filter(a => isToday(a.date));
    }
    else if (type === "week") {
        filtered = appointments.filter(a => isThisWeek(a.date));
    }
    else if (type === "year") {
        filtered = appointments.filter(a => isThisYear(a.date));
    }

    const rows = filtered.map(a => ({
        ID: a.appointmentID || a.id,
        Customer: a.customer,
        Barber: a.barber,
        Service: a.serviceName,
        Date: a.date,
        Time: a.time,
        Status: a.status
    }));

    exportToExcel(`appointments_${type}`, rows);
}

//supply report
export async function exportSuppliesReport() {

    const supplies = await getSupplies();

    const rows = supplies.map(s => ({
        ID: s.supplyID,
        Name: s.itemName,
        Quantity: s.quantity,
        Unit: s.unit,
        Status:
            s.quantity === 0 ? "Out of Stock" :
                (s.alertEnabled && s.quantity <= s.minQuantity) ? "Low Stock" :
                    "In Stock"
    }));
    exportToExcel("supplies_report", rows);

}

//barber performance report
export async function exportBarberReport() {

    const appointments = await getAppointments();
    const staff = await getStaff();

    const barberMap = {};

    appointments.forEach(a => {
        if (!a.barber) return;

        if (!barberMap[a.barber]) {
            barberMap[a.barber] = 0;
        }

        barberMap[a.barber]++;
    });

    const rows = Object.keys(barberMap).map(name => ({
        Barber: name,
        TotalCustomers: barberMap[name]
    }));
    exportToExcel("barber_report", rows);

}

//customer report
        //date helper
function isThisMonth(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
    );
}

export async function exportCustomerReport(type = "today", mode = "visit") {

    let rows = [];

    //Customers visit based on appointment
    if (mode === "visit") {

        const appointments = await getAppointments();

        let filtered = [];

        if (type === "today") {
            filtered = appointments.filter(a => isToday(a.date));
        }
        else if (type === "week") {
            filtered = appointments.filter(a => isThisWeek(a.date));
        }
        else if (type === "month") {
            filtered = appointments.filter(a => isThisMonth(a.date));
        }
        else if (type === "year") {
            filtered = appointments.filter(a => isThisYear(a.date));
        }

        rows = filtered.map(a => ({
            Customer: a.customer,
            Date: a.date,
            Service: a.serviceName,
            Barber: a.barber,
            Status: a.status
        }));
    }

    //new customer base on registration (collection
    if (mode === "new") {

        const customers = await getCustomers();

        let filtered = [];

        if (type === "today") {
            filtered = customers.filter(c => isToday(c.createdAt));
        }
        else if (type === "week") {
            filtered = customers.filter(c => isThisWeek(c.createdAt));
        }
        else if (type === "month") {
            filtered = customers.filter(c => isThisMonth(c.createdAt));
        }
        else if (type === "year") {
            filtered = customers.filter(c => isThisYear(c.createdAt));
        }

        rows = filtered.map(c => ({
            Customer: c.name || `${c.firstName || ""} ${c.lastName || ""}`,
            Phone: c.phone || "",
            Email: c.email || "",
            RegisteredDate: c.createdAt
        }));
    }

    exportToExcel(`customers_${mode}_${type}`, rows);
}

window.exportAppointmentsReport = exportAppointmentsReport;
window.exportSuppliesReport = exportSuppliesReport;
window.exportBarberReport = exportBarberReport;
window.exportCustomerReport = exportCustomerReport;

//revenue report
export async function exportRevenueReport(type = "today") {

    const appointments = await getAppointments();

    let filtered = [];

    if (type === "today") {
        filtered = appointments.filter(a => isToday(a.date));
    }
    else if (type === "week") {
        filtered = appointments.filter(a => isThisWeek(a.date));
    }
    else if (type === "month") {
        filtered = appointments.filter(a => isThisMonth(a.date));
    }
    else if (type === "year") {
        filtered = appointments.filter(a => isThisYear(a.date));
    }

    let totalRevenue = 0;

    const rows = filtered.map(a => {

        const totalCost = Number(a.totalCost || 0);

        totalRevenue += totalCost;

        return {
            AppointmentID: a.appointmentID || a.id,
            Customer: a.customer || "",
            Barber: a.barber || "",
            Service: a.serviceName || "",
            Revenue: totalCost.toFixed(2),
            Date: a.date || "",
            Status: a.status || ""
        };
    });

    // total row
    rows.push({
        AppointmentID: "",
        Customer: "",
        Barber: "",
        Service: "",
        Revenue: totalRevenue.toFixed(2),
        Date: "",
        Status: "TOTAL REVENUE"
    });

    exportToExcel(`revenue_${type}`, rows);
}

//payroll report
function convertToHours(time) {

    if (!time) return 0;

    const [hour, minute] = time.split(":").map(Number);

    return hour + (minute / 60);
}
export async function exportPayrollReport(type = "week") {

    const staff = await getStaff();

    const rows = [];

    staff.forEach(employee => {

        const salaryPerHour = parseFloat(employee.salary) || 0;

        const workingHours = employee.workingHours || {};

        let totalHours = 0;

        Object.values(workingHours).forEach(time => {

            if (!time.start || !time.end) return;

            const start = convertToHours(time.start);
            const end = convertToHours(time.end);

            totalHours += (end - start);
        });

        // weekly payroll
        let multiplier = 1;

        if (type === "month") {
            multiplier = 4;
        }
        else if (type === "year") {
            multiplier = 52;
        }

        const finalHours = totalHours * multiplier;

        const payroll = salaryPerHour * finalHours;

        rows.push({
            StaffID: employee.staffID || "",
            Employee: employee.name || "",
            Position: employee.position || "",
            HourlyRate: salaryPerHour.toFixed(2),
            HoursWorked: finalHours.toFixed(2),
            PayrollAmount: payroll.toFixed(2)
        });
    });

    exportToExcel(`payroll_${type}`, rows);
}

window.exportRevenueReport = exportRevenueReport;
window.exportPayrollReport = exportPayrollReport;
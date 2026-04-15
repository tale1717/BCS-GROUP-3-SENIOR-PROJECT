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
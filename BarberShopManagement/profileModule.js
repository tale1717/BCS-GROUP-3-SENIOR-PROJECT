import { auth, db } from '../BarberShopWebsite/firebase.js';
import {
    getAuth,
    onAuthStateChanged,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ── DOM refs ───────────────────────────────────────────────────────────────────
const nameText   = document.getElementById("nameText");
const emailText   = document.getElementById("emailText");
const mobileText  = document.getElementById("mobileText");
const positionText = document.getElementById("positionText");
const startDateText = document.getElementById("startDateText");
const routNumText = document.getElementById("routNumText");
const acctNumText = document.getElementById("acctNumText");

const pwBtn           = document.getElementById("pwBtn");
const logoutBtn       = document.getElementById("logoutBtn");
const editBankBtn     = document.getElementById("editBankBtn");
const passwordForm    = document.getElementById("passwordForm");
const savePWBtn       = document.getElementById("savePWBtn");
const cancelPWBtn     = document.getElementById("cancelPWBtn");
const currentPassword = document.getElementById("currentPassword");
const newPassword     = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const appointmentsTableBody = document.getElementById("appointments-table");
const appointmentHistoryBody = document.getElementById("appointment-history");

// Performance card metric elements (query by position inside .performance-grid)
const perfCards = document.querySelectorAll(".performance-grid .card h3");
// perfCards[0] = Completed Appointments, [1] = Feedback Received, [2] = Average Rating

let upcomingData  = [];  // raw sorted-by-date arrays, re-rendered on sort
let historyData   = [];
let upcomingSortCol = 0, upcomingSortDir = 1;
let historySortCol  = 0, historySortDir  = 1;

// ── Auth state listener ────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not signed in — redirect to log in
        window.location.href = "employeeLogin1.html";
        return;
    }

    try {
        const staffData = await fetchStaffByEmail(user.email);
        if (!staffData) {
            console.error("No staff record found for:", user.email);
            return;
        }

        populatePersonalInfo(staffData, user.email);
        populateBankInfo(staffData);
        await loadAppointments(staffData);
        await loadPerformanceReport(staffData);

        // Make page visible once data is ready
        document.body.style.visibility = "visible";

    } catch (err) {
        console.error("Error loading profile:", err);
        document.body.style.visibility = "visible";
    }
});

// ── Fetch staff record by email ────────────────────────────────────────────────
async function fetchStaffByEmail(email) {
    const q   = query(collection(db, "staff"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

// ── Populate personal info ─────────────────────────────────────────────────────
function populatePersonalInfo(staff, email) {
    nameText.textContent  = staff.name        ?? "";
    emailText.textContent  = staff.email      ?? email;
    mobileText.textContent = staff.phone    ?? "N/A";
    positionText.textContent = staff.position      ?? "N/A";

    // Format date of birth if stored as a Firestore Timestamp or ISO string
    if (staff.startDate) {
        const dob = staff.startDate.toDate ? staff.startDate.toDate() : new Date(staff.startDate);
        startDateText.textContent = dob.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
        });
    } else {
        startDateText.textContent = "N/A";
    }
}

// ── Populate bank info ─────────────────────────────────────────────────────────
function populateBankInfo(staff) {
    routNumText.textContent = staff.routingNumber ?? "—";
    acctNumText.textContent = staff.accountNumber
        ? maskAccountNumber(String(staff.accountNumber))
        : "—";
}

function maskAccountNumber(acct) {
    // Show only last 4 digits: e.g. ••••••7899
    return "•".repeat(Math.max(0, acct.length - 4)) + acct.slice(-4);
}

// ── Load appointments (upcoming + history) ─────────────────────────────────────
async function loadAppointments(staff) {
    const role     = (staff.position ?? "").toLowerCase();
    const isBarber = role === "barber";

    let appointmentsSnap;

    if (isBarber) {
        // Barbers only see their own appointments
        const barberName = `${staff.name}`;
        const q = query(
            collection(db, "appointments"),
            where("barber", "==", barberName)
        );
        appointmentsSnap = await getDocs(q);
    } else if (role === "manager" || role === "receptionist") {
        // Managers and receptionists see all appointments
        appointmentsSnap = await getDocs(collection(db, "appointments"));
    } else {
        // Unknown role — default to all appointments
        appointmentsSnap = await getDocs(collection(db, "appointments"));
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming  = [];
    const completed = [];

    appointmentsSnap.forEach((docSnap) => {
        const appt = { id: docSnap.id, ...docSnap.data() };

        // Normalize the appointment date
        let apptDate;
        if (appt.date?.toDate) {
            apptDate = appt.date.toDate();
        } else if (appt.date) {
            apptDate = new Date(appt.date);
        } else {
            return; // skip if no date
        }

        const apptDay = new Date(apptDate);
        apptDay.setHours(0, 0, 0, 0);

        const status = (appt.status ?? "").toLowerCase();

        if (status === "completed" || status === "cancelled") {
            completed.push({ ...appt, apptDate });
        } else if (apptDay >= now) {
            upcoming.push({ ...appt, apptDate });
        }
        // Appointments that are past-dated but not completed/canceled are ignored
    });

    // Sort upcoming ascending, history descending
    upcomingData = upcoming;
    historyData  = completed;

    renderUpcomingAppointments();
    renderAppointmentHistory(role);
}

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
    });
}

function renderUpcomingAppointments() {
    const data = sortData(
        upcomingData,
        upcomingSortCol,
        upcomingSortDir,
        ["apptDate", "barber", "serviceName", "time"]
    );

    appointmentsTableBody.innerHTML = data.length === 0
        ? `<tr><td colspan="4" style="text-align:center;">No upcoming appointments</td></tr>`
        : data.map(appt => `
            <tr>
                <td>${formatDate(appt.apptDate)}</td>
                <td>${appt.barber      ?? "N/A"}</td>
                <td>${appt.serviceName ?? "N/A"}</td>
                <td>${appt.time        ?? "N/A"}</td>
            </tr>`).join("");
}

function renderAppointmentHistory(role = "barber") {
    const data = sortData(
        historyData,
        historySortCol,
        historySortDir,
        ["apptDate", "barber", "serviceName", "status"]
    );

    const reviewTh = document.querySelector("#history-card thead th:last-child");
    if (role === "receptionist" && reviewTh) reviewTh.style.display = "none";

    appointmentHistoryBody.innerHTML = data.length === 0
        ? `<tr><td colspan="4" style="text-align:center;">No appointment history</td></tr>`
        : data.map(appt => `
            <tr>
                <td>${formatDate(appt.apptDate)}</td>
                <td>${appt.barber      ?? "N/A"}</td>
                <td>${appt.serviceName ?? "N/A"}</td>
                <td><span class="status-${appt.status}">${capitalize(appt.status ?? "N/A")}</span></td>
            </tr>`).join("");
}

function sortData(data, col, dir, keys) {
    if (col < 0) return data;
    return [...data].sort((a, b) => {
        const va = a[keys[col]], vb = b[keys[col]];
        if (va instanceof Date && vb instanceof Date) return (va - vb) * dir;
        return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Table column sorting ───────────────────────────────────────────────────────
function makeSortable(thead, getDir, setDir, getCol, setCol, renderFn, label) {
    thead.querySelectorAll("th").forEach((th, i) => {
        th.style.cursor = "pointer";
        th.style.userSelect = "none";
        const icon = document.createElement("span");
        icon.style.cssText = "margin-left:5px;font-size:11px;color:var(--color-text-tertiary);letter-spacing:-2px";
        icon.textContent = "";
        th.appendChild(icon);

        th.addEventListener("click", () => {
            const prevCol = getCol();
            const newDir  = (i === prevCol) ? getDir() * -1 : 1;
            setCol(i);
            setDir(newDir);

            thead.querySelectorAll("th span").forEach((s, j) => {
                s.textContent = j === i ? (newDir === 1 ? "▲" : "▼") : "";
                s.style.color = j === i
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)";
            });

            // Highlight the default active column on load
            const initialThs = thead.querySelectorAll("th span");
            const initCol = getCol();
            if (initCol >= 0 && initialThs[initCol]) {
                initialThs[initCol].textContent = getDir() === 1 ? "▲" : "▼";
                initialThs[initCol].style.color = "var(--color-text-primary)";
            }

            renderFn();
        });
    });
}

const upcomingThead = document.querySelector(".upcoming-card thead");
const historyThead  = document.querySelector(".history-card thead");

makeSortable(
    upcomingThead,
    () => upcomingSortDir, d => upcomingSortDir = d,
    () => upcomingSortCol, c => upcomingSortCol = c,
    renderUpcomingAppointments
);

makeSortable(
    historyThead,
    () => historySortDir,  d => historySortDir = d,
    () => historySortCol,  c => historySortCol = c,
    () => renderAppointmentHistory(/* pass stored role */)
);


// ── Performance report ─────────────────────────────────────────────────────────
async function loadPerformanceReport(staff) {
    const role = (staff.position ?? "").toLowerCase();

    // Receptionists don't have a performance report
    if (role === "receptionist") {
        const perfCard = document.querySelector(".performance-card");
        if (perfCard) perfCard.style.display = "none";
        return;
    }

    // Get the start of the current month
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let appointmentsSnap;

    if (role === "barber") {
        const barberName = `${staff.name}`;
        const q = query(
            collection(db, "appointments"),
            where("barber", "==", barberName),
            where("status", "==", "completed")
        );
        appointmentsSnap = await getDocs(q);
    } else {
        // Manager sees whole shop
        const q = query(
            collection(db, "appointments"),
            where("status", "==", "completed")
        );
        appointmentsSnap = await getDocs(q);
    }

    let completedCount = 0;
    let feedbackCount  = 0;
    let ratingSum      = 0;

    appointmentsSnap.forEach((docSnap) => {
        const appt = docSnap.data();

        // Filter to this month
        let apptDate;
        if (appt.date?.toDate) {
            apptDate = appt.date.toDate();
        } else if (appt.date) {
            apptDate = new Date(appt.date);
        } else {
            return;
        }

        if (apptDate < monthStart) return;

        completedCount++;

        if (appt.review || appt.rating) {
            feedbackCount++;
        }

        if (appt.rating) {
            ratingSum += Number(appt.rating);
        }
    });

    const avgRating = feedbackCount > 0
        ? (ratingSum / feedbackCount).toFixed(1)
        : "N/A";

    if (perfCards[0]) perfCards[0].textContent = completedCount;
    if (perfCards[1]) perfCards[1].textContent = feedbackCount;
    if (perfCards[2]) perfCards[2].textContent = avgRating;
}

// ── Password change ────────────────────────────────────────────────────────────
pwBtn.addEventListener("click", () => {
    passwordForm.style.display = "inline";
});

cancelPWBtn.addEventListener("click", () => {
    passwordForm.style.display = "none";
    currentPassword.value = "";
    newPassword.value     = "";
    confirmPassword.value = "";
});

savePWBtn.addEventListener("click", async () => {
    const current = currentPassword.value.trim();
    const next    = newPassword.value.trim();
    const confirm = confirmPassword.value.trim();

    if (!current || !next || !confirm) {
        alert("Please fill in all password fields.");
        return;
    }
    if (next !== confirm) {
        alert("New passwords do not match.");
        return;
    }
    if (next.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        const user       = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, current);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, next);
        alert("Password updated successfully.");
        cancelPWBtn.click();
    } catch (err) {
        console.error("Password update error:", err);
        if (err.code === "auth/wrong-password") {
            alert("Current password is incorrect.");
        } else {
            alert("Failed to update password. Please try again.");
        }
    }
});

// ── Edit bank information (modal) ─────────────────────────────────────────────
const bankModal       = document.getElementById("bankModal");
const newRoutingInput = document.getElementById("newRoutingInput");
const newAccountInput = document.getElementById("newAccountInput");
const saveBankBtn     = document.getElementById("saveBankBtn");
const cancelBankBtn   = document.getElementById("cancelBankBtn");
const bankError       = document.getElementById("bankError");

function openBankModal() {
    newRoutingInput.value = "";
    newAccountInput.value = "";
    bankError.style.display = "none";
    bankModal.style.display = "inline";
}

function closeBankModal() {
    bankModal.style.display = "none";
}

editBankBtn.addEventListener("click", openBankModal);
cancelBankBtn.addEventListener("click", closeBankModal);

// Close modal if user clicks the dark overlay (outside the modal box)
bankModal.addEventListener("click", (e) => {
    if (e.target === bankModal) closeBankModal();
});

saveBankBtn.addEventListener("click", async () => {
    const newRouting = newRoutingInput.value.trim();
    const newAccount = newAccountInput.value.trim();

    if (!newRouting || !newAccount) {
        bankError.textContent = "Both fields are required.";
        bankError.style.display = "block";
        return;
    }
    if (!/^\d{9}$/.test(newRouting)) {
        bankError.textContent = "Routing number must be exactly 9 digits.";
        bankError.style.display = "block";
        return;
    }
    if (!/^\d{4,17}$/.test(newAccount)) {
        bankError.textContent = "Account number must be between 4 and 17 digits.";
        bankError.style.display = "block";
        return;
    }

    try {
        const user      = auth.currentUser;
        const staffData = await fetchStaffByEmail(user.email);
        if (!staffData) throw new Error("Staff record not found.");

        await updateDoc(doc(db, "staff", staffData.id), {
            bankRouting: newRouting,
            bankAccount: newAccount
        });

        routNumText.textContent = newRouting;
        acctNumText.textContent = maskAccountNumber(newAccount);
        closeBankModal();
    } catch (err) {
        console.error("Bank update error:", err);
        bankError.textContent = "Failed to update bank information. Please try again.";
        bankError.style.display = "block";
    }
});

document.getElementById("GTA1").addEventListener("click", async () => {
    window.location.href = "./appointments.html";
})

document.getElementById("GTA2").addEventListener("click", async () => {
    window.location.href = "./appointments.html";
})
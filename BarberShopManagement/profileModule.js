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

const pwBtn           = document.getElementById("pwBtn");
const logoutBtn       = document.getElementById("logoutBtn");
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

        currentStaffData = staffData;

        populatePersonalInfo(staffData, user.email);
        populateSchedule(staffData);
        loadScheduleRows(staffData.workingHours || {});  // ← add this
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

/**
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
**/
// ── Schedule ─────────────────────────────────────────────
function populateSchedule(staff) {
    const scheduleCard = document.getElementById("profile-schedule"); // or whatever your card's id is
    if (!scheduleCard) return;

    const workingHours = staff.workingHours || {};
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    if (Object.keys(workingHours).length === 0) {
        scheduleCard.innerHTML = "<p>No schedule set.</p>";
        return;
    }

    const rows = dayOrder.map(day => {
        const hours = workingHours[day];

        if (hours) {
            return `
                <div class="schedule-row">
                    <span class="schedule-day">${day}</span>
                    <span class="schedule-time">${formatTime(hours.start)} – ${formatTime(hours.end)}</span>
                </div>
            `;
        } else {
            return `
                <div class="schedule-row inactive">
                    <span class="schedule-day">${day}</span>
                    <span class="schedule-inactive">Inactive</span>
                </div>
            `;
        }
    }).join("");

    scheduleCard.innerHTML = rows || "<p>No schedule set.</p>";
}

// Converts "14:00" → "2:00 PM"
function formatTime(time) {
    if (!time) return "";
    const [hourStr, minute] = time.split(":");
    const hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
}

// ── Schedule editing ───────────────────────────────────────────────────────────
const scheduleModal     = document.getElementById("scheduleModal");
const editScheduleBtn   = document.getElementById("editScheduleBtn");
const saveScheduleBtn   = document.getElementById("saveScheduleBtn");
const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");
const scheduleError     = document.getElementById("scheduleError");

const DAY_KEYS = [
    { key: "mon", full: "Monday" },
    { key: "tue", full: "Tuesday" },
    { key: "wed", full: "Wednesday" },
    { key: "thu", full: "Thursday" },
    { key: "fri", full: "Friday" },
    { key: "sat", full: "Saturday" },
    { key: "sun", full: "Sunday" },
];

function openScheduleModal(currentWorkingHours = {}) {
    scheduleError.style.display = "none";

    // Pre-fill checkboxes and times from existing schedule
    DAY_KEYS.forEach(({ key, full }) => {
        const cb    = document.getElementById(`modal-${key}-cb`);
        const start = document.getElementById(`modal-${key}-start`);
        const end   = document.getElementById(`modal-${key}-end`);

        const existing = currentWorkingHours[full];
        cb.checked    = !!existing;
        start.value   = existing?.start || "09:00";
        end.value     = existing?.end   || "17:00";

        // Dim time inputs if day is unchecked
        toggleDayInputs(key, cb.checked);

        cb.onchange = () => toggleDayInputs(key, cb.checked);
    });

    scheduleModal.style.display = "flex";
}

function toggleDayInputs(key, enabled) {
    const row = document.getElementById(`modal-${key}`);
    if (!row) return;
    row.classList.toggle("active", enabled);
}

function loadScheduleRows(workingHours = {}) {
    DAY_KEYS.forEach(({ key, full }) => {
        const cb    = document.getElementById(`modal-${key}-cb`);
        const start = document.getElementById(`modal-${key}-start`);
        const end   = document.getElementById(`modal-${key}-end`);

        const existing = workingHours[full];
        cb.checked  = !!existing;
        start.value = existing?.start || "09:00";
        end.value   = existing?.end   || "17:00";

        // Apply active class immediately
        toggleDayInputs(key, cb.checked);

        // Allow toggling by clicking the checkbox
        cb.onchange = () => toggleDayInputs(key, cb.checked);
    });
}

function closeScheduleModal() {
    scheduleModal.style.display = "none";
}

function buildWorkingHoursFromModal() {
    const workingHours = {};
    const workingDays  = [];

    for (const { key, full } of DAY_KEYS) {
        const cb    = document.getElementById(`modal-${key}-cb`);
        const start = document.getElementById(`modal-${key}-start`);
        const end   = document.getElementById(`modal-${key}-end`);

        if (cb.checked) {
            workingHours[full] = { start: start.value, end: end.value };
            workingDays.push(full);
        }
    }

    return { workingHours, workingDays };
}

// Store current schedule in memory so the modal can pre-fill it
let currentStaffData = null;

saveScheduleBtn.addEventListener("click", async () => {
    const { workingHours, workingDays } = buildWorkingHoursFromModal();

    // validation ...

    try {
        const user = auth.currentUser;
        const staffData = await fetchStaffByEmail(user.email);
        await updateDoc(doc(db, "staff", staffData.id), { workingHours, workingDays });

        currentStaffData = { ...currentStaffData, workingHours, workingDays };

        // Reload the rows in place instead of closing a modal
        loadScheduleRows(workingHours);

    } catch (err) {
        console.error("Schedule update error:", err);
    }
});

editScheduleBtn.addEventListener("click", () => {
    openScheduleModal(currentStaffData?.workingHours || {});
});

cancelScheduleBtn.addEventListener("click", closeScheduleModal);

scheduleModal.addEventListener("click", (e) => {
    if (e.target === scheduleModal) closeScheduleModal();
});

saveScheduleBtn.addEventListener("click", async () => {
    const { workingHours, workingDays } = buildWorkingHoursFromModal();

    // Validate: end time must be after start time for checked days
    for (const { key, full } of DAY_KEYS) {
        const cb = document.getElementById(`modal-${key}-cb`);
        if (!cb.checked) continue;

        const start = document.getElementById(`modal-${key}-start`).value;
        const end   = document.getElementById(`modal-${key}-end`).value;

        if (end <= start) {
            scheduleError.textContent = `${full}: end time must be after start time.`;
            scheduleError.style.display = "block";
            return;
        }
    }

    try {
        const user = auth.currentUser;
        const staffData = await fetchStaffByEmail(user.email);
        if (!staffData) throw new Error("Staff record not found.");

        await updateDoc(doc(db, "staff", staffData.id), {
            workingHours,
            workingDays
        });

        // Update local cache and re-render the card
        currentStaffData = { ...currentStaffData, workingHours, workingDays };
        populateSchedule(currentStaffData);
        closeScheduleModal();

    } catch (err) {
        console.error("Schedule update error:", err);
        scheduleError.textContent = "Failed to save schedule. Please try again.";
        scheduleError.style.display = "block";
    }
});
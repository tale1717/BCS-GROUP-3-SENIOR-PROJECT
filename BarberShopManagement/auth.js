import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "../BarberShopWebsite/firebase.js";

const MANAGER_ONLY_PAGES = ['staff.html', 'inventory.html', 'reports.html', 'services.html'];
const currentPage = window.location.pathname.split('/').pop().toLowerCase();

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'employeeLogin1.html';
        return;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
        window.location.href = 'employeeLogin1.html';
        return;
    }

    const { role } = userDoc.data();

    if (MANAGER_ONLY_PAGES.includes(currentPage) && role !== 'manager') {
        window.location.href = 'unauthorized.html';
        return;
    }

    window.userRole = role;
    applyNavVisibility(role);
    document.body.style.visibility = 'visible';
});

function applyNavVisibility(role) {
    if (role !== 'manager') {
        document.querySelectorAll('a[href="staff.html"], a[href="Inventory.html"], a[href="reports.html"], a[href="services.html"]')
            .forEach(link => link.style.display = 'none');
    }
}
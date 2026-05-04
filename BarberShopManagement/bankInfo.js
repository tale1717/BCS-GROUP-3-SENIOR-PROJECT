import { auth, db } from "../BarberShopWebsite/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let currentUser = null;
let editingBankId = null;

const bankDisplay = document.getElementById("bankDisplay");
const bankForm = document.getElementById("bankForm");
const bankFormTitle = document.getElementById("bankFormTitle");

const addBankBtn = document.getElementById("addBankBtn");
const saveBankBtn = document.getElementById("saveBankBtn");
const cancelBankBtn = document.getElementById("cancelBankBtn");

const bankAccountsList = document.getElementById("bankAccountsList");
const accountCount = document.getElementById("accountCount");

const bankNameInput = document.getElementById("bankNameInput");
const accountTypeInput = document.getElementById("accountTypeInput");
const routingInput = document.getElementById("routingInput");
const accountInput = document.getElementById("accountInput");
const confirmAccountInput = document.getElementById("confirmAccountInput");
const accountNameInput = document.getElementById("accountNameInput");

let currentStaffId = null; // Add this

onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    currentUser = user;
    currentStaffId = await getStaffIdByEmail(user.email); // Add this
    if (currentStaffId) await loadBankAccounts();
});

async function getStaffIdByEmail(email) {
    const q = query(collection(db, "staff"), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.error("No staff document found for email:", email);
        return null;
    }
    return snapshot.docs[0].id;
}

function bankCollectionRef() {
    return collection(db, "staff", currentStaffId, "bankAccounts");
}

function maskAccountNumber(accountNumber) {
    if (!accountNumber) return "****";
    return "******" + accountNumber.slice(-4);
}

addBankBtn.addEventListener("click", () => {
    editingBankId = null;
    bankFormTitle.textContent = "Add Direct Deposit Account";
    clearBankForm();

    bankDisplay.style.display = "none";
    bankForm.style.display = "block";
});

cancelBankBtn.addEventListener("click", () => {
    bankForm.style.display = "none";
    bankDisplay.style.display = "block";
    clearBankForm();
});

saveBankBtn.addEventListener("click", async () => {
    const bankName = bankNameInput.value.trim();
    const accountType = accountTypeInput.value;
    const routingNumber = routingInput.value.trim();
    const accountNumber = accountInput.value.trim();
    const confirmAccountNumber = confirmAccountInput.value.trim();
    const accountName = accountNameInput.value.trim();

    if (!bankName || !routingNumber || !accountNumber || !confirmAccountNumber || !accountName) {
        alert("Please fill out all required fields.");
        return;
    }

    if (!/^\d{9}$/.test(routingNumber)) {
        alert("Routing number must be exactly 9 digits.");
        return;
    }

    if (!/^\d{4,17}$/.test(accountNumber)) {
        alert("Account number must be between 4 and 17 digits.");
        return;
    }

    if (accountNumber !== confirmAccountNumber) {
        alert("Account numbers do not match.");
        return;
    }

    const paymentUses = [];

    const bankData = {
        bankName,
        accountType,
        routingNumber,
        accountNumber,
        accountName,
        paymentUses,
        updatedAt: new Date()
    };

    if (editingBankId) {
        await updateDoc(doc(db, "staff", currentStaffId, "bankAccounts", editingBankId), bankData);
    } else {
        bankData.createdAt = new Date();
        await addDoc(bankCollectionRef(), bankData);
    }

    await loadBankAccounts();

    bankForm.style.display = "none";
    bankDisplay.style.display = "block";
    clearBankForm();
});

async function loadBankAccounts() {
    const snapshot = await getDocs(bankCollectionRef());

    bankAccountsList.innerHTML = "";
    accountCount.textContent = snapshot.size;

    if (snapshot.empty) {
        bankAccountsList.innerHTML = `<p style="margin-top:10px;">No bank accounts added yet.</p>`;
        return;
    }

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const div = document.createElement("div");
        div.className = "bank-account-item";

        div.innerHTML = `
            <div class="bank-account-left">
                <button class="edit-bank-btn" title="Edit">✎</button>
            </div>

            <div class="bank-account-details">
                <strong>${data.bankName || "Unknown Bank"} ${maskAccountNumber(data.accountNumber)}</strong>
                <p>${data.accountType || "N/A"}</p>
                <small>${data.accountName || ""}</small>
            </div>

            <button class="delete-bank-btn" title="Delete">×</button>
        `;

        div.querySelector(".edit-bank-btn").addEventListener("click", () => {
            editingBankId = docSnap.id;
            bankFormTitle.textContent = "Edit Direct Deposit Account";

            bankNameInput.value = data.bankName || "";
            accountTypeInput.value = data.accountType || "Checking";
            routingInput.value = data.routingNumber || "";
            accountInput.value = data.accountNumber || "";
            confirmAccountInput.value = data.accountNumber || "";
            accountNameInput.value = data.accountName || "";

            document.querySelectorAll(".paymentUse").forEach(box => {
                box.checked = data.paymentUses?.includes(box.value) || false;
            });

            bankDisplay.style.display = "none";
            bankForm.style.display = "block";
        });

        div.querySelector(".delete-bank-btn").addEventListener("click", async () => {
            if (!confirm("Delete this bank account?")) return;

            await deleteDoc(doc(db, "staff", currentStaffId, "bankAccounts", docSnap.id));
            await loadBankAccounts();
        });

        bankAccountsList.appendChild(div);
    });
}

function clearBankForm() {
    bankNameInput.value = "";
    accountTypeInput.value = "Checking";
    routingInput.value = "";
    accountInput.value = "";
    confirmAccountInput.value = "";
    accountNameInput.value = "";

    document.querySelectorAll(".paymentUse").forEach(box => {
        box.checked = false;
    });
}
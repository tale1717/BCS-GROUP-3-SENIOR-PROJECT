import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const ref = collection(db, "customers");

// CREATE
export async function createCustomer(data) {
    return await addDoc(ref, data);
}

// READ
export async function getCustomers() {
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// UPDATE
export async function updateCustomer(id, data) {
    await updateDoc(doc(db, "customers", id), data);
}

// DELETE
export async function deleteCustomer(id) {
    await deleteDoc(doc(db, "customers", id));
}
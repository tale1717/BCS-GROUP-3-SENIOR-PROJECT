import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const ref = collection(db, "customers");

// CREATE generic dashboard record (random doc id)
export async function createCustomer(data) {
    return await addDoc(ref, data);
}

// CREATE/OVERWRITE signup-linked customer profile using uid
export async function createCustomerProfile(uid, data) {
    await setDoc(doc(db, "customers", uid), {
        uid,
        ...data
    });
}

// READ one customer by uid/doc id
export async function getCustomer(id) {
    const snap = await getDoc(doc(db, "customers", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// READ all customers
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
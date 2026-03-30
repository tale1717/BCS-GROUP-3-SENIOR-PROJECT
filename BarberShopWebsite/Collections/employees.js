import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const ref = collection(db, "employees");

// CREATE
export async function createEmployee(data) {
    await setDoc(doc(db, "employees", uid), data);
}

// READ
export async function getEmployees() {
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// UPDATE
export async function updateEmployee(id, data) {
    await updateDoc(doc(db, "employees", id), data);
}

// DELETE
export async function deleteEmployee(id) {
    await deleteDoc(doc(db, "employees", id));
}
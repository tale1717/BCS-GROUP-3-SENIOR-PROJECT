import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const ref = collection(db, "barbers");

// CREATE
export async function createBarber(data) {
    return await addDoc(ref, data);
}

// READ
export async function getBarbers() {
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// UPDATE
export async function updateBarber(id, data) {
    await updateDoc(doc(db, "barbers", id), data);
}

// DELETE
export async function deleteBarber(id) {
    await deleteDoc(doc(db, "barbers", id));
}
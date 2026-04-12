import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const ref = collection(db, "services");

export async function createService(data) {
    const newService = await addDoc(ref, data);
    return newService.id;
}

export async function getServices() {
    const snap = await getDocs(ref);

    return snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
    }));
}

export async function updateService(id, data) {
    await updateDoc(doc(db, "services", id), data);
}

export async function deleteService(id) {
    await deleteDoc(doc(db, "services", id));
}
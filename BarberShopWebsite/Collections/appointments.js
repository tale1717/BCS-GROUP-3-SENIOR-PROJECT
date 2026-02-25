import { db } from "/BarberShopWebsite/firebase.js";
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

export async function createAppointment(user, data) {
    const payload = {
        customerUid: user.uid,
        customerEmail: user.email || "",
        barber: data.barber || "",
        service: data.service || "",
        date: data.date || "",
        time: data.time || "",
        status: "pending",
        createdAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, "appointments"), payload);
    return ref.id;
}

export async function getAppointmentById(id) {
    const snap = await getDoc(doc(db, "appointments", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
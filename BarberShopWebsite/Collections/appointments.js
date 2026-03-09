// BarberShopWebsite/Collections/appointments.js
import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

export async function createAppointment(data) {
    const ref = await addDoc(collection(db, "appointments"), {
        ...data,
        createdAt: serverTimestamp()
    });
    return ref.id;
}

export async function getAppointment(appointmentId) {
    const snap = await getDoc(doc(db, "appointments", appointmentId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get Appointment from database to appointment modules
export async function getAppointments() {

    const snap = await getDocs(collection(db, "appointments"));

    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

}


// update Appointment  from appointment modules to firebase
export async function updateAppointment(id, data) {

    await updateDoc(doc(db, "appointments", id), data);

}


// Delete appointment from appointment modules
export async function deleteAppointment(id) {

    await deleteDoc(doc(db, "appointments", id));

}
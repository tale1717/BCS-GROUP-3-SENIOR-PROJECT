// BarberShopWebsite/Collections/appointments.js
import { db } from "../firebase.js";
import {
    collection,
    addDoc,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

export async function createAppointment(data){

    const appointmentID = data.appointmentID;

    await setDoc(

        doc(db,"appointments",appointmentID),

        {
            ...data,
            createdAt:serverTimestamp()
        }

    );

    return data.appointmentID;

}


export async function getAppointment(appointmentId) {
    const snap = await getDoc(doc(db, "appointments", appointmentId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get all appointments
export async function getAppointments() {

    const snap = await getDocs(collection(db, "appointments"));

    return snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

}


// Update appointment
export async function updateAppointment(id, data) {

    await updateDoc(doc(db, "appointments", id), data);

}


// Delete appointment
export async function deleteAppointment(id) {

    await deleteDoc(doc(db, "appointments", id));


}
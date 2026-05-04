import { db } from "../BarberShopWebsite/firebase.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/**
 * Sync a review into the publicReviews collection
 * Uses appointment ID as the document ID
 */
export async function syncPublicReview(appointmentId, appointmentData) {

    if (!appointmentData) return;

    // Only sync if it actually has a rating
    if (!appointmentData.rating || appointmentData.rating === 0) return;

    const publicData = {
        customerName: appointmentData.customer || "Customer",
        barber: appointmentData.barber || "",
        serviceName: appointmentData.serviceName || "",
        date: appointmentData.date || "",
        rating: appointmentData.rating || 0,
        review: appointmentData.review || "",

        // manager response (if exists)
        managerResponse: appointmentData.managerResponse || "",

        // timestamp for sorting
        createdAt: serverTimestamp()
    };

    try {
        await setDoc(
            doc(db, "publicReviews", appointmentId),
            publicData,
            { merge: true }
        );
    } catch (err) {
        console.error("Error syncing public review:", err);
    }
}
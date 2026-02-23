import { db } from "../firebase.js";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

export async function createUserProfile(user, profile, role = "customer") {
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email || "",
        role,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        dob: profile.dob || "",
        createdAt: serverTimestamp()
    });
}

export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, updates) {
    await updateDoc(doc(db, "users", uid), updates);
}
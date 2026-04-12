import { db } from "../firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";


export async function createStaff(data){

    return await addDoc(
        collection(db,"staff"),
        data
    );

}


export async function getStaff(){

    const snap=
        await getDocs(
            collection(db,"staff")
        );

    return snap.docs.map(doc=>({

        id:doc.id,
        ...doc.data()

    }));

}


export async function updateStaff(id,data){

    await updateDoc(
        doc(db,"staff",id),
        data
    );

}


export async function deleteStaff(id){

    await deleteDoc(
        doc(db,"staff",id)
    );

}
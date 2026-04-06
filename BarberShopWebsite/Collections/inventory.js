import { db } from "../firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
}
    from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const ref =
    collection(db,"inventory");

export async function createSupply(data){

    return await addDoc(ref,data);

}

export async function getSupplies(){

    const snap =
        await getDocs(ref);

    return snap.docs.map(d=>({

        id:d.id,

        ...d.data()

    }));

}

export async function updateSupply(id,data){

    await updateDoc(
        doc(db,"inventory",id),
        data
    );

}

export async function deleteSupply(id){

    await deleteDoc(
        doc(db,"inventory",id)
    );

}
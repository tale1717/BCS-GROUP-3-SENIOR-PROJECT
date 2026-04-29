import { auth, db } from '../BarberShopWebsite/firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

document.getElementById('signup').addEventListener('click', async () => {
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        // Create the account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save the user in Firestore with a default role
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: 'barber',  // default role — manager can change later
            createdAt: new Date()
        });

        alert('Employee account created successfully!');
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-password').value = '';

    } catch (error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                alert('This email is already registered.');
                break;
            case 'auth/weak-password':
                alert('Password must be at least 6 characters.');
                break;
            case 'auth/invalid-email':
                alert('Please enter a valid email address.');
                break;
            default:
                alert('Error: ' + error.message);
        }
    }
});
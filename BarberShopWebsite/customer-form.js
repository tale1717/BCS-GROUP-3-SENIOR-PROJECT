  import { firebaseConfig } from "../firebaseConfig.js";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", function() {

document.getElementById("signin-form").addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
           
            const user = userCredential.user;
            alert("Login successful! Welcome to Triple T & G Barbershop");
          
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login failed:", errorCode, errorMessage);
            alert("Login failed: " + errorMessage);
        });
});

//signup form submission
document.getElementById("register-form").addEventListener('submit', function(e) {
    e.preventDefault();
    const FirstName = document.getElementById("first-name").value;
    const LastName = document.getElementById("last-name").value;
    const email = document.getElementById("customer-email").value;
    const dob = document.getElementById("customer-dob").value;
    const password = document.getElementById("customer-password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert("Registration successful! You can now log in.");
            // document.getElementById("register-div").style.display = "none";
            // document.getElementById("login-div").style.display = "inline";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Registration failed:", errorCode, errorMessage);
            alert("Registration failed: " + errorMessage);
        });
});
}); 

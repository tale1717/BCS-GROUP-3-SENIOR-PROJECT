import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";



  const firebaseConfig = {
    apiKey: "AIzaSyAH3M3RBkVzn7vCOOmijRw6v8aRx5peFSo",
    authDomain: "triple-t-and-g-senior-project.firebaseapp.com",
    projectId: "triple-t-and-g-senior-project",
    storageBucket: "triple-t-and-g-senior-project.firebasestorage.app",
    messagingSenderId: "617698422141",
    appId: "1:617698422141:web:a7397216e12ff799bff014"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);


document.getElementById("reg-button").addEventListener('click', function() {
    document.getElementById("register-div").style.display = "inline";
    document.getElementById("login-div").style.display = "none";

});

document.getElementById("loginpage").addEventListener('click', function() {
    document.getElementById("register-div").style.display = "none";
    document.getElementById("login-div").style.display = "inline";

});


document.getElementById("submit").addEventListener('click', function() {
    const email = document.getElementById("username").value;
    const password = document.getElementById("loginpassword").value;

    signInWithEmailAndPassword(auth, username, loginpassword)
        .then((userCredential) => {
           
            const user = userCredential.user;
            document.getElementById("result-box").style.display = "inline";
            document.getElementById("login-div").style.display = "none";
            document.getElementById("result").innerHTML = "Login successful! Welcome, " + username.email;
          
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login failed:", errorCode, errorMessage);
            alert("Login failed: " + errorMessage);
        });

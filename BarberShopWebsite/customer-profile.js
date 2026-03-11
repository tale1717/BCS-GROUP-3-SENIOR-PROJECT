// buttons
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

// form
const editForm = document.getElementById("editForm");

// text
const nameText = document.getElementById("nameText");
const emailText = document.getElementById("emailText");
const mobileText = document.getElementById("mobileText");
const dobText = document.getElementById("dobText");

// inputs
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const mobileInput = document.getElementById("mobileInput");
const dobInput = document.getElementById("dobInput");


// EDIT BUTTON
editBtn.addEventListener("click", function(){

nameInput.value = nameText.textContent;
emailInput.value = emailText.textContent;
mobileInput.value = mobileText.textContent;
dobInput.value = dobText.textContent;

editForm.style.display = "block";

});


// SAVE BUTTON
saveBtn.addEventListener("click", function(){

nameText.textContent = nameInput.value;
emailText.textContent = emailInput.value;
mobileText.textContent = mobileInput.value;
dobText.textContent = dobInput.value;

editForm.style.display = "none";

});


// CANCEL BUTTON
cancelBtn.addEventListener("click", function(){

editForm.style.display = "none";

});
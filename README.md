![](BarberShopWebsite/readme-logo.png)

# ✂️ Triple T&G Barbers Barber Shop Management System

A web-based barber shop management system built for Triple T&G Barbers. This project provides both a customer-facing website and an internal management system for employees and managers.

The system allows customers to browse the barber shop website, create accounts, book appointments, manage their profiles, and leave ratings. Employees and managers can log in to manage appointments, customers, staff, services, inventory, reports, and business information.

This project was developed as a Senior Project by Jozka Guaman, Vinh Co Thai, Jared Tobias, and David Talero for class BCS 430 Senior Project at Farmingdale State College.

## 🟥 Features

### 💈 Customer Website

The customer-facing website allows users to:

- View general barber shop information
- Register and log in as customers
- Book appointments
- Select appointment dates and times
- Confirm appointment details
- View and update customer profile information
- Reset forgotten passwords
- Leave reviews and ratings
- Navigate public pages such as Home, About Us, and Contact

### 🛠️ Management System

The internal management system allows authorized users to:

- Log in as employees or managers
- View dashboard information
- Manage appointments
- Manage customer records
- Manage staff members
- Manage barber services
- Manage inventory
- View and manage ratings/reviews
- Generate or view reports
- Manage profile and business-related information
- Log out securely
- Restrict unauthorized access


## 🟧 Management Modules

### 📅 Appointments

Customers can book appointments through the website, while employees and managers can view and manage appointments through the management dashboard.

Related functionality includes:

- Appointment form handling
- Date and time selection
- Appointment confirmation
- Dashboard appointment display
- Schedule calendar support

### 🙋🏻‍♂️ Customers

The system supports customer registration, login, profile management, and customer record management from the admin side.

### 👨🏻‍💼 Staff

Managers can manage staff information, including barber or employee records.

### 📏 Services

The system includes service management functionality so the shop can maintain available barber services.

### 📦 Inventory

The management system includes inventory tracking for shop supplies and products.

### ⭐ Ratings and Reviews

Customers can leave ratings and reviews, and the management side can view or manage submitted feedback.

### 📋 Reports

The reports section provides support for viewing business-related information and summaries.

### 🔐 Authentication and Authorization

The project includes authentication logic for customers, employees, and protected management pages. Unauthorized users are redirected away from restricted pages.

## 🟨 Technologies Used 

| Front-End                                                                                                                                                                                                                                  | Back-End                                                                                                                                                                                            | Database                                                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| <img src="https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg" alt="html5" width="100" /> <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/CSS3_logo_and_wordmark.svg" alt="css3" width="70.9" /> | <img src="https://www.w3schools.com/js/img_javascript_480.jpg" alt="js" width="100" /> <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg" alt="node-js" width="100" /> | <img src="https://static.vecteezy.com/system/resources/previews/072/678/006/non_2x/firebase-logo-icon-free-png.png" alt="firebase" width="100"> |



## 🟩 Firebase Collections

The project includes collection-related modules for:

- Appointments
- Customers
- Employees
- Inventory
- Services
- Staff
- Users

These collections support the main business operations of the barber shop system.

## 🟦 How to Run

### Option 1: Visit the Website

Visit the website at https://triple-t-and-g-senior-project.web.app/

### Option 2: Run Locally

If the website is not available or not working properly, here's how to run the project locally:

#### Prerequsities:

- IDE such as IntelliJ, WebStorm or any platform with Node.js installed and acts as the JS runtime environment
- ```firebaseConfig.js``` is obtained from us
- A browser to use and internet connection

#### Steps:
1. Clone the repository
2. Open the project in your IDE
3. Store ```firebaseConfig.js``` inside the ```/BarberShopWebsite``` directory
4. In the terminal, use the command ```npx install``` to install npx
5. Use the command ```npx serve``` to run the project
6. Open the project at http://localhost:3000

## 🟪 User Roles and Functionalities

### 🙋🏻‍♂️ Customers

- Register
- Log in
- Book appointments
- Manage their profile
- Submit ratings or reviews

### 💇🏻 Barbers

- Log in to the management system
- View dashboard information
- Manage their individual appointments and all customers

### 👩🏻‍💻 Receptionists

- Log in to the management system
- View dashboard information
- Manage all appointments and customers

### 👨🏻‍💼 Managers

- Access management features
- Manage appointments, customers, staff, services, inventory, ratings, and reports

## 🟫 Authors

- Jozka Guaman
- Vinh Co Thai
- Jared Tobias
- David Talero

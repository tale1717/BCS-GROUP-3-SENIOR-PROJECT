# Triple T and G Barber Shop Management System

A web-based barber shop management system built for Triple T and G Barber. This project provides both a customer-facing website and an internal management system for employees and managers.

The system allows customers to browse the barber shop website, create accounts, book appointments, manage their profiles, and leave ratings. Employees and managers can log in to manage appointments, customers, staff, services, inventory, reports, and business information.

This project was developed as a Senior Project by Jozka Guaman, Vinh Co Thai, Jared Tobias, and David Talero at Farmingdale State College.

## Features

### Customer Website

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

### Employee and Manager System

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


## Main Modules

### Appointment Management

Customers can book appointments through the website, while employees and managers can view and manage appointments through the management dashboard.

Related functionality includes:

- Appointment form handling
- Date and time selection
- Appointment confirmation
- Dashboard appointment display
- Schedule calendar support

### Customer Management

The system supports customer registration, login, profile management, and customer record management from the admin side.

### Staff Management

Managers can manage staff information, including barber or employee records.

### Services Management

The system includes service management functionality so the shop can maintain available barber services.

### Inventory Management

The management system includes inventory tracking for shop supplies and products.

### Ratings and Reviews

Customers can leave ratings and reviews, and the management side can view or manage submitted feedback.

### Reports

The reports section provides support for viewing business-related information and summaries.

### Authentication and Authorization

The project includes authentication logic for customers, employees, and protected management pages. Unauthorized users are redirected away from restricted pages.

## Technologies Used

- HTML
- CSS
- JavaScript
- Firebase
- Firebase Hosting
- Firebase Authentication
- Firebase Firestore / Database collections

## Firebase Collections

The project includes collection-related modules for:

- Appointments
- Customers
- Employees
- Inventory
- Services
- Staff
- Users

These collections support the main business operations of the barber shop system.

## Getting Started

### Prerequisites

To run or deploy this project, you should have:

- A modern web browser
- A Firebase project
- Firebase CLI installed, if deploying through Firebase Hosting
- Node.js and npm, if using Firebase CLI tools locally

## User Roles

### Customers

Customers can:

- Register
- Log in
- Book appointments
- Manage their profile
- Submit ratings or reviews

### Employees

Employees can:

- Log in to the management system
- View dashboard information
- Help manage appointments and customers

### Managers

Managers can:

- Access management features
- Manage appointments, customers, staff, services, inventory, ratings, and reports

## Authors

- Jozka Guaman
- Vinh Co Thai
- Jared Tobias
- David Talero

Senior Project  
Farmingdale State College

## Purpose

The purpose of this project is to provide Triple T and G Barber with a centralized web system for managing customer appointments, staff operations, shop services, inventory, ratings, and business-related records.
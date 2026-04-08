import { collection, getDocs, getDoc, doc as docRef } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "../BarberShopWebsite/firebase.js";

const reviewCountText = document.getElementById("review-count");
let reviewCount = 0;

async function loadReviews() {
    const container = document.getElementById("rating-list");
    container.innerHTML = "";

    try {
        const { docs } = await getDocs(collection(db, "appointments"));

        for (const doc of docs) {
            const data = doc.data();
            const service = data.serviceName;
            const date = data.date;
            const score = data.rating;
            const reviewText = data.review;
            const uid = data.customerUid || data.customerID;

            const customerDoc = await getDoc(docRef(db, "users", uid));
            const customerName = customerDoc.exists() ? (customerDoc.data().firstName + " " + customerDoc.data().lastName) : "Unknown";

            // Build star display
            const stars = [
                ...Array.from({ length: score }, () =>
                    `<img src="../BarberShopWebsite/comb-full.png" style="width: 20px;" />`
                ),
                ...Array.from({ length: 5 - score }, () =>
                    `<img src="../BarberShopWebsite/comb.png" style="width: 20px;" />`
                )
            ].join("");

            // Build card
            if (score != null && reviewText != null) {
                const card = document.createElement("div");
                card.className = "rating-item";
                card.innerHTML = `
                <div class="rating-top">
                        <div>
                            <strong>${customerName}</strong>
                            <p class="service-text">Service: ${service}</p>
                            <p class="service-text">Date ${date}</p>
                        </div>
                        <span class="rating-badge">${stars}</span>
                    </div>
                    
                    <p class="feedback-text">
                        ${reviewText}
                    </p>
                `;
                container.appendChild(card);
                reviewCount++;
                reviewCountText.textContent = reviewCount;
            }

        }

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        console.error(err);
    }
}

loadReviews();
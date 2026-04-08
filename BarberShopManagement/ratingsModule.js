import { collection, getDocs, getDoc, doc as docRef } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "../BarberShopWebsite/firebase.js";

const reviewCountText = document.getElementById("review-count");
const fiveStarCountText = document.getElementById("five-stars-count");
const averageRatingText = document.getElementById("average-rating");
let reviewCount = 0;
let fiveStarCount = 0;
let averageRating = 0;
let totalScore = 0;

async function loadReviews() {
    const container = document.getElementById("rating-list");
    container.innerHTML = "";

    try {
        const { docs } = await getDocs(collection(db, "appointments"));

        // Filter to only scored appointments first
        const scoredDocs = docs.filter(d => d.data().rating != null && d.data().rating !== 0);

        // Collect unique user IDs
        const uniqueUids = [...new Set(scoredDocs.map(d => d.data().customerUid || d.data().customerID))];

        // Fetch all users in parallel
        const userDocs = await Promise.all(uniqueUids.map(uid => getDoc(docRef(db, "users", uid))));

        // Build a uid -> name map
        const nameMap = {};
        uniqueUids.forEach((uid, i) => {
            const d = userDocs[i];
            nameMap[uid] = d.exists() ? `${d.data().firstName} ${d.data().lastName}` : "Unknown";
        });

        // Now build cards with no extra reads
        for (const doc of scoredDocs) {
            const data = doc.data();
            const uid = data.customerUid || data.customerID;
            const customerName = nameMap[uid];
            const barber = data.barber;
            const service = data.serviceName;
            const date = data.date;
            const score = data.rating;
            let reviewText = data.review;

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
            if (score != null && score !== 0) {
                if (!reviewText) {
                    reviewText = "*No review available*";
                }
                const card = document.createElement("div");
                card.className = "rating-item";
                card.innerHTML = `
                <div class="rating-top">
                        <div>
                            <strong>${customerName}</strong>
                            <p class="service-text">Barber: ${barber}</p>
                            <p class="service-text">Service: ${service}</p>
                            <p class="service-text">Date ${date}</p>
                        </div>
                        <span class="rating-badge">${stars}</span>
                    </div>
                    
                    <p class="feedback-text">
                        ${reviewText}
                    </p>
                `;

                if (score === 5) {
                    fiveStarCount++;
                    fiveStarCountText.textContent = `${fiveStarCount}`;
                }

                container.appendChild(card);
                reviewCount++;
                reviewCountText.textContent = `${reviewCount}`;

                totalScore += score;
                averageRating = totalScore / reviewCount;
                averageRatingText.textContent = `${averageRating.toFixed(1)}`;

            }

        }

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        console.error(err);
    }
}

loadReviews();
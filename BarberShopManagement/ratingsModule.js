import { syncPublicReview } from "./publicReviews.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { collection, getDocs, getDoc, updateDoc, serverTimestamp, doc as docRef } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { auth, db } from "../BarberShopWebsite/firebase.js";

const reviewCountText = document.getElementById("review-count");
const fiveStarCountText = document.getElementById("five-stars-count");
const averageRatingText = document.getElementById("average-rating");
let reviewCount = 0;
let fiveStarCount = 0;
let averageRating = 0;
let totalScore = 0;

onAuthStateChanged(auth, (user) => {
    if (user) loadReviews();
});

async function getCurrentUserRole() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return { role: null, name: null };

    const email = firebaseUser.email;

    // get role from users collection
    const userSnap = await getDoc(docRef(db, "users", firebaseUser.uid));
    const role = userSnap.exists() ? userSnap.data().role : null;

    // get name from staff collection matched by email
    const staffSnap = await getDocs(collection(db, "staff"));
    const staffMatch = staffSnap.docs.find(
        d => (d.data().email || "").toLowerCase() === email.toLowerCase()
    );
    const name = staffMatch ? staffMatch.data().name : null;

    console.log(name, email);

    return { role, name };
}

async function loadReviews() {
    const container = document.getElementById("rating-list");
    container.innerHTML = "";

    try {
        const { role, name } = await getCurrentUserRole();

        const { docs } = await getDocs(collection(db, "appointments"));

        // Filter to only scored appointments
        let scoredDocs = docs.filter(d => d.data().rating != null && d.data().rating !== 0);

        // If barber, only show their own reviews
        if (role === "barber" && name) {
            scoredDocs = scoredDocs.filter(
                d => (d.data().barber || "").toLowerCase() === name.toLowerCase()
            );
        }

        // Collect unique user IDs
        const uniqueUids = [...new Set(scoredDocs.map(d => d.data().customerUid || d.data().customerID))];

        // Fetch all users in parallel
        const userDocs = await Promise.all(uniqueUids.map(uid => getDoc(docRef(db, "users", uid))));

        // Build uid -> name map
        const nameMap = {};
        uniqueUids.forEach((uid, i) => {
            const d = userDocs[i];
            nameMap[uid] = d.exists() ? `${d.data().firstName} ${d.data().lastName}` : "Unknown";
        });

        // Reset counters on each load
        reviewCount = 0;
        fiveStarCount = 0;
        totalScore = 0;

        for (const doc of scoredDocs) {
            const data = doc.data();
            await syncPublicReview(doc.id, data);
            const uid = data.customerUid || data.customerID;
            const customerName = nameMap[uid];
            const barber = data.barber;
            const service = data.serviceName;
            const date = data.date;
            const score = data.rating;
            let reviewText = data.review;

            const stars = [
                ...Array.from({ length: score }, () =>
                    `<img src="../BarberShopWebsite/comb-full.png" style="width: 20px;" />`
                ),
                ...Array.from({ length: 5 - score }, () =>
                    `<img src="../BarberShopWebsite/comb.png" style="width: 20px;" />`
                )
            ].join("");

            if (score != null && score !== 0) {
                if (!reviewText) reviewText = "*No review available*";

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

                <p class="feedback-text">${reviewText}</p>

                ${
                    role === "manager"
                        ? `
                <div class="manager-response-box">
                    <textarea
                        id="response-${doc.id}"
                        class="manager-response-input"
                        placeholder="Write a manager response..."
                    >${data.managerResponse || ""}</textarea>
                    <br><br>
                    <button class="edit save-response" data-id="${doc.id}">
                        Save Response
                    </button>
                </div>
            `
                        : ""
                }
                `;

                if (score === 5) {
                    fiveStarCount++;
                    fiveStarCountText.textContent = `${fiveStarCount}`;
                }

                container.appendChild(card);

                if (data.managerResponse) {
                    const responseCard = document.createElement("div");
                    responseCard.className = "rating-item card manager-response-card";

                    responseCard.innerHTML = `
        <div class="rating-top">
            <div>
                <strong>Triple T and G Barbers</strong>
            </div>
        </div>

        <p class="feedback-text">${data.managerResponse}</p>
    `;

                    container.appendChild(responseCard);
                }

                reviewCount++;
                reviewCountText.textContent = `${reviewCount}`;

                totalScore += score;
                averageRating = totalScore / reviewCount;
                averageRatingText.textContent = `${averageRating.toFixed(1)}`;
            }
        }

        setupManagerResponseButtons();

        if (reviewCount === 0) {
            container.innerHTML = `<br><h2 style="text-align:center; color: gray;">No reviews found.</brh2>`;
        }

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        console.error(err);
    }

    function setupManagerResponseButtons() {
        document.querySelectorAll(".save-response").forEach(button => {
            button.onclick = async () => {
                const appointmentId = button.dataset.id;
                const textarea = document.getElementById(`response-${appointmentId}`);
                const responseText = textarea.value.trim();

                if (!responseText) {
                    alert("Please enter a response.");
                    return;
                }

                try {
                    const appointmentRef = docRef(db, "appointments", appointmentId);

                    await updateDoc(appointmentRef, {
                        managerResponse: responseText,
                        managerResponseBy: auth.currentUser.email,
                        managerResponseName: await getManagerName(),
                        managerResponseAt: serverTimestamp()
                    });

                    const updatedSnap = await getDoc(appointmentRef);

                    if (updatedSnap.exists()) {
                        await syncPublicReview(appointmentId, updatedSnap.data());
                    }

                    alert("Manager response saved.");
                    await loadReviews();

                } catch (err) {
                    console.error("Failed to save manager response:", err);
                    alert("Failed to save manager response.");
                }
            };
        });
    }

    async function getManagerName() {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return "Manager";

        const staffSnap = await getDocs(collection(db, "staff"));
        const staffMatch = staffSnap.docs.find(
            d => (d.data().email || "").toLowerCase() === firebaseUser.email.toLowerCase()
        );

        return staffMatch ? staffMatch.data().name : "Manager";
    }
}
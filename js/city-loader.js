// Read ?city=ottawa
const params = new URLSearchParams(window.location.search);
const cityName = params.get("city");

const city = cities[cityName];

if (!city) {
    document.body.innerHTML = "<h2>City not found</h2>";
    throw new Error("City not found: " + cityName);
}

// Inject basic data
document.querySelector("#city-title").innerText = city.name;
document.querySelector("#city-tagline").innerText = city.tagline;

document.querySelector("#hero").style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${city.heroImage})`;

// Load activities
const container = document.querySelector("#activity-container");

city.activities.forEach(activity => {

    const card = document.createElement("div");
    card.classList.add("activity-card");
    card.dataset.imageQuery = activity.imageQuery || activity.title || city.name;

    card.innerHTML = `
        <img class="activity-img" alt="${activity.title}" style="opacity: 0; transition: opacity 0.5s ease;">
        <h3>${activity.title}</h3>
        <p>${activity.description}</p>
        <span class="tag cost-${activity.cost}">${activity.cost}</span>
    `;

    container.appendChild(card);
});

// Auto-load images
async function fetchUnsplashImage(query) {
    try {
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=7V8nEyrJTYuZt9OvjxGH0a4oKYDDc6iNEkF99-1CQZg`
        );
        const data = await res.json();
        return data.results?.[0]?.urls?.regular ?? "";
    } catch {
        return "";
    }
}

async function loadActivityImages() {
    const cards = document.querySelectorAll(".activity-card");
    for (const card of cards) {
        const img = card.querySelector(".activity-img");
        const query = card.dataset.imageQuery;
        const url = await fetchUnsplashImage(query);
        img.src = url;
        img.onload = () => {
            img.style.opacity = "1";
        };
    }
}

loadActivityImages();
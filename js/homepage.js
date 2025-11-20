// Optional: Unsplash key if you want better photos
const UNSPLASH_ACCESS_KEY = ""; // leave empty to skip Unsplash

// List your cities here
const cities = [
    { name: "Vancouver", query: "Vancouver skyline" },
    { name: "Montreal"},
    { name: "Quebec City" }, // query will default to name
    // Add more cities here
];

// Reuse fetchImage function (Wikimedia -> Unsplash -> Picsum fallback)
async function fetchImage(query) {
    if (!query) return "https://picsum.photos/seed/placeholder/500/300";
    query = query.trim() + " city";

    // Wikimedia first
    try {
        const api = "https://en.wikipedia.org/w/api.php";
        const params = [
            "action=query",
            "format=json",
            "origin=*",
            "prop=pageimages",
            "piprop=original",
            "generator=search",
            "gsrsearch=" + encodeURIComponent(query),
            "gsrlimit=5"
        ].join("&");
        const res = await fetch(api + "?" + params);
        const data = await res.json();
        if (data.query && data.query.pages) {
            const pages = data.query.pages;
            for (const pid in pages) {
                const p = pages[pid];
                if (p.original && p.original.source) return p.original.source;
            }
        }
    } catch (e) { console.warn("Wikimedia fetch failed", e); }

    // Unsplash fallback
    if (UNSPLASH_ACCESS_KEY) {
        try {
            const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&client_id=${UNSPLASH_ACCESS_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) return data.results[0].urls.regular;
        } catch (e) { console.warn("Unsplash fetch failed", e); }
    }

    // Final fallback
    return `https://picsum.photos/seed/${encodeURIComponent(query)}/500/300`;
}

// Generate the city cards
async function loadCityCards() {
    const container = document.getElementById("city-cards");
    container.innerHTML = "";

    for (const city of cities) {
        const imgUrl = await fetchImage(city.query || city.name);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <a href="Cities/${city.name.toLowerCase()}.html">
                <img src="${imgUrl}" alt="${city.name}">
                <div class="card-title">${city.name}</div>
            </a>
        `;
        container.appendChild(card);

        // Fade-in image after it loads
        const img = card.querySelector("img");
        img.onload = () => img.classList.add("loaded");
    }
}

// Run on page load
window.addEventListener("DOMContentLoaded", loadCityCards);
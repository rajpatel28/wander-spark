function filterActivities(type) {
    var cards = document.querySelectorAll('.activity-card');
    cards.forEach(function(card) {
        if (type === 'all') {
            card.style.display = 'block';
        } else if (type === 'free') {
            card.style.display = card.classList.contains('free') ? 'block' : 'none';
        } else if (type === 'paid') {
            card.style.display = card.classList.contains('paid') ? 'block' : 'none';
        }
    });
}

// Highlight active button
var filterButtons = document.querySelectorAll('.filters button');
filterButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Optional: set your Unsplash access key here if you have one
var UNSPLASH_ACCESS_KEY = ""; // <-- put your Unsplash Access Key here if available

// Helper: Wikimedia Commons via MediaWiki API
async function fetchImageFromWikimedia(query) {
    try {
        // Use generator=search to find pages matching the query, then request pageimages with original size
        const api = "https://en.wikipedia.org/w/api.php";
        const params = [
            "action=query",
            "format=json",
            "origin=*",
            "prop=pageimages",
            "piprop=original",
            "generator=search",
            "gsrsearch=" + encodeURIComponent(query),
            "gsrlimit=5" // check top 5 matches
        ].join("&");

        const url = api + "?" + params;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.query && data.query.pages) {
            // pages is an object keyed by pageid. We'll pick the first page that has an original image
            const pages = data.query.pages;
            var bestUrl = null;
            var bestTitle = null;
            for (var pid in pages) {
                if (pages.hasOwnProperty(pid)) {
                    var p = pages[pid];
                    if (p.original && p.original.source) {
                        // prefer pages whose title or pageid looks like the query; otherwise first valid
                        bestUrl = p.original.source;
                        bestTitle = p.title;
                        break;
                    }
                }
            }
            if (bestUrl) {
                return {
                    url: bestUrl,
                    source: "wikimedia",
                    title: bestTitle
                };
            }
        }
    } catch (err) {
        console.warn("Wikimedia fetch failed:", err);
    }
    return null;
}

// Helper: Unsplash (requires key); prefer orientation=landscape and small size
async function fetchImageFromUnsplash(query) {
    if (!UNSPLASH_ACCESS_KEY) return null;
    try {
        const endpoint = "https://api.unsplash.com/search/photos";
        const params = [
            "query=" + encodeURIComponent(query),
            "orientation=landscape",
            "per_page=6",
            "page=1",
            "client_id=" + encodeURIComponent(UNSPLASH_ACCESS_KEY)
        ].join("&");
        const url = endpoint + "?" + params;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
            // pick the first with a decent width
            for (var i = 0; i < data.results.length; i++) {
                var r = data.results[i];
                if (r && r.urls && r.urls.regular) {
                    return {
                        url: r.urls.regular,
                        source: "unsplash",
                        title: r.description || r.alt_description || r.id
                    };
                }
            }
        }
    } catch (err) {
        console.warn("Unsplash fetch failed:", err);
    }
    return null;
}

// Final fetchImage that uses the chain: Wikimedia -> Unsplash -> Picsum fallback
async function fetchImage(query) {
    // sanitize tiny queries
    if (!query || query.trim().length === 0) {
        return "https://picsum.photos/seed/placeholder/500/300";
    }

    // 1) Try Wikimedia Commons (best for named landmarks)
    try {
        var wik = await fetchImageFromWikimedia(query + " Vancouver");
        if (wik && wik.url) {
            // Return the direct URL. Note: these are often large originals.
            return wik.url;
        }
    } catch (e) {
        console.warn("Wikimedia attempt failed:", e);
    }

    // 2) Try Unsplash (if key provided)
    try {
        var uns = await fetchImageFromUnsplash(query + " Vancouver");
        if (uns && uns.url) return uns.url;
    } catch (e) {
        console.warn("Unsplash attempt failed:", e);
    }

    // 3) Fallback: Picsum (stable placeholder using seed)
    return "https://picsum.photos/seed/" + encodeURIComponent(query) + "/500/300";
}

async function loadActivityImages() {
    const cards = document.querySelectorAll(".activity-card");

    for (const card of cards) {
        let img = card.querySelector(".activity-img");

        // If no img tag, create one at the top of the card (optional convenience)
        if (!img) {
            img = document.createElement("img");
            img.classList.add("activity-img");
            card.prepend(img);
        }

        // Skip if image already loaded
        if (img.dataset.loaded === "true") continue;

        // We need the title element early for fallback queries
        const h3 = card.querySelector("h3");
        const h3Text = h3 ? h3.innerText.trim() : "";

        // ⭐ Priority 1 — developer-provided image query
        let query =
            card.dataset.photo ||
            card.dataset.imageQuery ||
            card.dataset.title ||
            h3Text;

        // ⭐ Priority 2 — auto-build query from data attributes
        if (!query || query.trim() === "") {
            const title = card.dataset.title || "";
            const city = card.dataset.city || "";
            const type = card.dataset.type || "";
            query = `${title} ${city} ${type}`.trim();
        }

        // ⭐ Priority 3 — fallback to card header text
        if (!query || query.trim() === "") {
            query = h3Text || "travel destination";
        }

        // Fetch the image
        const url = await fetchImage(query);

        img.src = url;
        img.alt = query + " photo";
        img.dataset.loaded = "true";
    }
}

window.addEventListener('DOMContentLoaded', loadActivityImages);
const backendURL = "https://humsafar-backend-1s3r.onrender.com/admin/seed-bulk";
const ADMIN_SECRET = "your_secret_here";

/* ---------------- SITE IMAGES ---------------- */

function addSiteImage() {
  const input = document.createElement("input");
  input.placeholder = "Image URL";
  document.getElementById("siteImages").appendChild(input);
}

/* ---------------- NODES ---------------- */

function addNode() {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <input placeholder="Node Name" required>
    <input placeholder="Latitude" required>
    <input placeholder="Longitude" required>
    <input placeholder="Node Video URL">
    <label>
      <input type="checkbox" class="king"> Is King Node
    </label>
    <textarea placeholder="Description"></textarea>
    <div class="nodeImages"></div>
    <button type="button" onclick="addNodeImage(this)">+ Add Node Image</button>
    <hr>
  `;

  document.getElementById("nodes").appendChild(div);
}

function addNodeImage(btn) {
  const container = btn.parentElement.querySelector(".nodeImages");
  const input = document.createElement("input");
  input.placeholder = "Image URL";
  container.appendChild(input);
}

/* ---------------- VALIDATION + STORE ---------------- */

function goToLandmarks() {
  const result = collectSiteData();

  if (!result.valid) {
    alert(result.error);
    return;
  }

  localStorage.setItem("seedData", JSON.stringify(result.payload));
  window.location.href = "landmark.html";   // ← fixed filename
}

function collectSiteData() {

  const siteNameEl  = document.getElementById("siteName");
  const latitudeEl  = document.getElementById("latitude");
  const longitudeEl = document.getElementById("longitude");
  const radiusEl    = document.getElementById("radius");
  const ratingEl    = document.getElementById("rating");
  const helplineEl  = document.getElementById("helpline");
  const videoEl     = document.getElementById("video");
  const summaryEl   = document.getElementById("summary");
  const historyEl   = document.getElementById("history");
  const funFactsEl  = document.getElementById("funFacts");

  if (!siteNameEl.value || !latitudeEl.value || !longitudeEl.value || !radiusEl.value) {
    return { valid: false, error: "Please fill all required site fields." };
  }

  const nodeCards = [...document.querySelectorAll(".card")];

  if (nodeCards.length === 0) {
    return { valid: false, error: "At least one node is required." };
  }

  const kingNodes = nodeCards.filter(card =>
    card.querySelector(".king").checked
  );

  if (kingNodes.length !== 1) {
    return { valid: false, error: "Exactly ONE King Node must be selected." };
  }

  const formattedNodes = [];
  let sequenceCounter = 1;

  nodeCards.forEach(card => {
    const inputs      = card.querySelectorAll("input:not(.king)");
    const description = card.querySelector("textarea").value;
    const images      = [...card.querySelectorAll(".nodeImages input")]
      .map(i => i.value)
      .filter(v => v !== "");

    const isKing = card.querySelector(".king").checked;

    formattedNodes.push({
      name:        inputs[0].value,
      latitude:    parseFloat(inputs[1].value),
      longitude:   parseFloat(inputs[2].value),
      video_url:   inputs[3].value || null,
      sequence:    isKing ? 0 : sequenceCounter++,
      qr:          inputs[0].value.trim().replace(/\s+/g, "_").toUpperCase(),
      description: description,
      images:      images
    });
  });

  return {
    valid: true,
    payload: {
      site: {
        name:      siteNameEl.value,
        latitude:  parseFloat(latitudeEl.value),
        longitude: parseFloat(longitudeEl.value),
        radius:    parseInt(radiusEl.value),
        rating:    ratingEl.value    ? parseFloat(ratingEl.value) : null,
        helpline:  helplineEl.value  || null,
        video_url: videoEl.value     || null,
        summary:   summaryEl.value   || null,
        history:   historyEl.value   || null,
        fun_facts: funFactsEl.value  || null,
        images:    [...document.querySelectorAll("#siteImages input")]
          .map(i => i.value)
          .filter(v => v !== "")
      },
      nodes: formattedNodes
    }
  };
}

/* ---------------- LANDMARKS PAGE ---------------- */

function addLandmark(type) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <input placeholder="Name" required>
    <input placeholder="Latitude" required>
    <input placeholder="Longitude" required>
    <hr>
  `;

  document.getElementById(type).appendChild(div);
}

function collectLandmarks(id) {
  return [...document.querySelectorAll(`#${id} .card`)].map(card => {
    const inputs = card.querySelectorAll("input");
    return {
      name:      inputs[0].value,
      latitude:  parseFloat(inputs[1].value),
      longitude: parseFloat(inputs[2].value)
    };
  }).filter(l => l.name); // skip empty cards
}

async function submitAll() {

  const stored = localStorage.getItem("seedData");

  if (!stored) {
    alert("No site data found. Please complete Site page first.");
    return;
  }

  const seedData = JSON.parse(stored);

  seedData.landmarks = {
    monuments:   collectLandmarks("monuments"),
    restaurants: collectLandmarks("restaurants"),
    hotels:      collectLandmarks("hotels")
  };

  try {
    const response = await fetch(backendURL, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "x-admin-secret": ADMIN_SECRET
      },
      body: JSON.stringify(seedData)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      alert(`Error ${response.status}: ${err.detail || response.statusText}`);
      return;
    }

    const result = await response.json();
    alert(`✅ Success! Site "${result.site_name}" created with ID ${result.site_id}`);
    console.log(result);

    localStorage.removeItem("seedData");

  } catch (error) {
    alert("Network error submitting data. Check console.");
    console.error(error);
  }
}
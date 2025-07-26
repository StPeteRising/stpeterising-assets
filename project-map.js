// Define custom icons by status
const iconUrls = {
  "Proposed": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/main/icons/Proposed.png",
  "Approved": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/main/icons/Approved.png",
  "Under Construction": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/main/icons/UnderConstruction.png",
  "Complete": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/main/icons/Complete.png",
  "Cancelled": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/main/icons/Cancelled.png"
};

const icons = {};
Object.keys(iconUrls).forEach(status => {
  icons[status] = L.icon({
    iconUrl: iconUrls[status],
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
});

// Initialize map
const map = L.map("project-map").setView([27.773, -82.64], 14);

// Add base layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marker cluster group
const markers = L.markerClusterGroup();
const markerGroupsByStatus = {};

// Dummy data - replace with dynamic project data
const projectData = [
  {
    title: "3rd & 3rd",
    status: "Under Construction",
    class: "Mixed-Use",
    units: 270,
    lat: 27.7734,
    lng: -82.6397,
    image: "https://via.placeholder.com/240x160",
  },
  {
    title: "Central Lofts",
    status: "Proposed",
    class: "Residential",
    units: 112,
    lat: 27.7718,
    lng: -82.6423,
    image: "https://via.placeholder.com/240x160",
  },
  {
    title: "Bayfront Tower Renovation",
    status: "Complete",
    class: "Office",
    units: "15,000",
    lat: 27.771,
    lng: -82.6335,
    image: "https://via.placeholder.com/240x160",
  },
  {
    title: "Some Cancelled Project",
    status: "Cancelled",
    class: "Hotel",
    units: 200,
    lat: 27.7701,
    lng: -82.638,
    image: "https://via.placeholder.com/240x160",
  }
];

// Create markers
projectData.forEach(project => {
  const marker = L.marker([project.lat, project.lng], {
    icon: icons[project.status] || icons["Proposed"]
  });

  const unitsLabel = project.class === "Office" ? "Square Feet" : "Units";
  const unitsValue = project.units || "TBD";

  marker.bindPopup(`
    <div class="popup-content">
      <div class="popup-title">${project.title}</div>
      <div><strong>Status:</strong> ${project.status}</div>
      <div><strong>Class:</strong> ${project.class}</div>
      <div><strong>${unitsLabel}:</strong> ${unitsValue}</div>
      <img src="${project.image}" alt="${project.title}" />
    </div>
  `);

  // Track by status
  if (!markerGroupsByStatus[project.status]) {
    markerGroupsByStatus[project.status] = L.layerGroup();
  }
  markerGroupsByStatus[project.status].addLayer(marker);
  markers.addLayer(marker);
});

map.addLayer(markers);

// Create legend container
const legendContainer = L.control({ position: "bottomright" });
legendContainer.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  div.id = "legend-container";

  // Add each status as checkbox
  Object.keys(iconUrls).forEach(status => {
    const checked = status === "Cancelled" ? "" : "checked";
    div.innerHTML += `
      <label class="legend-item">
        <input type="checkbox" class="legend-checkbox" data-status="${status}" ${checked} />
        <img src="${iconUrls[status]}" alt="${status} icon" />
        ${status}
      </label>
    `;
  });

  return div;
};
legendContainer.addTo(map);

// Add legend toggle button (outside legend)
const toggleBtn = document.createElement("button");
toggleBtn.id = "legend-toggle";
toggleBtn.textContent = "Hide Legend";
document.body.appendChild(toggleBtn);

const legendEl = document.getElementById("legend-container");

toggleBtn.addEventListener("click", () => {
  if (legendEl.classList.contains("hidden")) {
    legendEl.classList.remove("hidden");
    toggleBtn.textContent = "Hide Legend";
  } else {
    legendEl.classList.add("hidden");
    toggleBtn.textContent = "Show Legend";
  }
});

// Filtering logic
function updateVisibleMarkers() {
  markers.clearLayers();

  const checkedStatuses = Array.from(document.querySelectorAll(".legend-checkbox:checked")).map(
    (checkbox) => checkbox.dataset.status
  );

  Object.entries(markerGroupsByStatus).forEach(([status, group]) => {
    if (checkedStatuses.includes(status)) {
      markers.addLayer(group);
    }
  });
}

// Attach listener to checkboxes
document.addEventListener("change", (e) => {
  if (e.target.classList.contains("legend-checkbox")) {
    updateVisibleMarkers();
  }
});

// Initial filter setup
updateVisibleMarkers();

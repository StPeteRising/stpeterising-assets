document.addEventListener("DOMContentLoaded", () => {
  const sheetURL =
    "https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1";

  const statusColors = {
    Proposed: "yellow",
    Approved: "green",
    "Under Construction": "blue",
    Complete: "gray",
    Cancelled: "red",
  };

  // Initialize the map
  const map = L.map("project-map").setView([27.773, -82.64], 13);

  // Add tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // Create a marker cluster group
  const markerClusterGroup = L.markerClusterGroup();
  map.addLayer(markerClusterGroup);

  // Fetch and process project data
  fetch(sheetURL)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((project) => {
        const lat = parseFloat(project.Lat);
        const lng = parseFloat(project.Lng);
        const status = project.Status;
        const color = statusColors[status] || "gray";

        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: "#333",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9,
          });

          const popupHtml = `
            <div class="popup-content">
              <div class="popup-title">${project["Project Name"] || ""}</div>
              <div><strong>Address:</strong> ${project.Address || ""}</div>
              <div><strong>Class:</strong> ${project.Class || ""}</div>
              <div><strong>Floors:</strong> ${project.Floors || ""}</div>
              <div><strong>Units:</strong> ${project.Units || ""}</div>
              <div><strong>Completion:</strong> ${project.Completion || ""}</div>
              ${
                project.Rendering
                  ? `<img src="${project.Rendering}" alt="Rendering" style="max-width:100%;margin-top:8px;">`
                  : ""
              }
              ${
                project.Slug
                  ? `<div style="margin-top: 8px;">
                      <a href="https://stpeterising.com/${project.Slug}" target="_blank" style="color: #007BFF; font-weight: bold; text-decoration: underline;">
                        View Project Page →
                      </a>
                    </div>`
                  : ""
              }
            </div>
          `;

          marker.bindPopup(popupHtml);
          markerClusterGroup.addLayer(marker);
        }
      });
    })
    .catch((err) => {
      console.error("Error loading map data:", err);
    });
});

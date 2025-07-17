document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const mapboxToken = 'sk.eyJ1Ijoic3RwZXRlcmlzaW5nIiwiYSI6ImNtZDZwemt6cDAydG8ycm85Zmhhajhiem8ifQ.tg8plScK5O-d59FvIiJ5sw'; // Replace with your actual Mapbox token

  const statusColors = {
    Proposed: 'yellow',
    Approved: 'green',
    "Under Construction": 'blue',
    Complete: 'gray',
    Cancelled: 'red'
  };

  // Initialize map with Mapbox Outdoors style tiles
  const map = L.map('project-map').setView([27.773, -82.64], 13);
  L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  const markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
  });

  fetch(sheetURL)
    .then(res => res.json())
    .then(data => {
      data.forEach(project => {
        const lat = parseFloat(project.Lat);
        const lng = parseFloat(project.Lng);
        const status = project.Status;
        const color = statusColors[status] || 'gray';

        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: '#333',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
          });

          const popupHtml = `
            <div class="popup-content" style="min-width: 250px;">
              <div class="popup-title" style="font-weight: bold; margin-bottom: 6px;">${project["Project Name"]}</div>
              <div><strong>Status:</strong> ${status || ''}</div>
              <div><strong>Address:</strong> ${project.Address || ''}</div>
              <div><strong>Class:</strong> ${project.Class || ''}</div>
              <div><strong>Floors:</strong> ${project.Floors || ''}</div>
              <div><strong>Units:</strong> ${project.Units || ''}</div>
              <div><strong>Completion:</strong> ${project.Completion || ''}</div>
              ${project.Rendering ? `<img src="${project.Rendering}" alt="Rendering" style="max-width:100%; margin-top: 8px; cursor:pointer;" onclick="window.open('${project.Rendering}', '_blank')" />` : ''}
              ${project.Slug ? `
                <div style="margin-top: 8px;">
                  <a href="https://stpeterising.com/${project.Slug}" target="_blank" style="color: #007BFF; font-weight: bold; text-decoration: underline;">
                    View Project Page →
                  </a>
                </div>` : ''}
            </div>
          `;

          marker.bindPopup(popupHtml);
          markers.addLayer(marker);
        }
      });
      map.addLayer(markers);
    })
    .catch(err => {
      console.error("Error loading map data:", err);
    });
});

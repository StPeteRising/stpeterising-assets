document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const mapboxToken = 'pk.eyJ1Ijoic3RwZXRlcmlzaW5nIiwiYSI6ImNtZDZxb2lweDBib2Mya3BzZ2xrdmgxMDEifQ.QWBg7S51ggQ_jemRmD7nRw';

  const iconURLs = {
    "Proposed": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/refs/heads/main/icons/Proposed.png",
    "Approved": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/refs/heads/main/icons/Approved.png",
    "Under Construction": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/refs/heads/main/icons/UnderConstruction.png",
    "Complete": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/refs/heads/main/icons/Complete.png",
    "Cancelled": "https://raw.githubusercontent.com/StPeteRising/stpeterising-assets/refs/heads/main/icons/Cancelled.png"
  };

  function getCustomIcon(status) {
    const iconUrl = iconURLs[status] || iconURLs["Proposed"];
    return L.icon({
      iconUrl,
      iconSize: [21, 32],        // Icon size in px
      iconAnchor: [10.5, 32],    // Anchor bottom-center
      popupAnchor: [0, -32],     // Popup above icon
    });
  }

  function createLegend(iconURLs) {
    const legendContainer = document.getElementById('map-legend');
    if (!legendContainer) return;

    legendContainer.innerHTML = '';

    for (const [status, iconUrl] of Object.entries(iconURLs)) {
      const item = document.createElement('div');
      item.className = 'legend-item';

      const img = document.createElement('img');
      img.src = iconUrl;
      img.alt = status + ' icon';

      const label = document.createElement('span');
      label.textContent = status;

      item.appendChild(img);
      item.appendChild(label);

      legendContainer.appendChild(item);
    }
  }

  // Initialize map
  const map = L.map('project-map').setView([27.773, -82.64], 13);

  L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Add fullscreen control
  map.addControl(new L.Control.Fullscreen({
    position: 'topright',  // optional
    title: 'Toggle fullscreen',
    titleCancel: 'Exit fullscreen',
  }));

  // Create legend after map init
  createLegend(iconURLs);

  const markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 15,
    spiderfyOnMaxZoom: true,
  });

  fetch(sheetURL)
    .then(res => res.json())
    .then(data => {
      data.forEach(project => {
        const lat = parseFloat(project.Lat);
        const lng = parseFloat(project.Lng);
        const status = project.Status;

        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng], {
            icon: getCustomIcon(status)
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

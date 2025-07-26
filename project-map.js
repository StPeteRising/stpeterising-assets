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
      iconSize: [21, 32],
      iconAnchor: [10.5, 32],
      popupAnchor: [0, -32],
    });
  }

  const activeStatuses = new Set(Object.keys(iconURLs).filter(status => status !== "Cancelled"));

  const statusLayers = {};
  const map = L.map('project-map').setView([27.773, -82.64], 13);

  L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Add fullscreen control
  L.control.fullscreen({
    position: 'topright'
  }).addTo(map);

  // Add geocoder control if available
  if (L.Control.Geocoder) {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
    })
    .on('markgeocode', function(e) {
      const bbox = e.geocode.bbox;
      const poly = L.polygon([
        bbox.getSouthEast(),
        bbox.getNorthEast(),
        bbox.getNorthWest(),
        bbox.getSouthWest()
      ]).addTo(map);
      map.fitBounds(poly.getBounds());
      setTimeout(() => {
        map.removeLayer(poly);
      }, 5000);
    })
    .addTo(map);
  }

  for (const status of Object.keys(iconURLs)) {
    statusLayers[status] = L.layerGroup();
  }

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
        const status = project.Status || "Proposed";

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
          statusLayers[status].addLayer(marker);
        }
      });

      for (const status of activeStatuses) {
        markers.addLayer(statusLayers[status]);
      }
      map.addLayer(markers);

      createLegend(iconURLs, statusLayers, markers, activeStatuses);
      setupLegendToggle();

      // Legend fullscreen fix: move legend into fullscreen container when toggling
      const legend = document.getElementById('legend-container');
      const mapWrapper = document.getElementById('map-wrapper');

      map.on('enterFullscreen', () => {
        const fullscreenContainer = document.querySelector('.leaflet-fullscreen-on');
        if (legend && fullscreenContainer) {
          fullscreenContainer.appendChild(legend);
        }
      });

      map.on('exitFullscreen', () => {
        if (legend && mapWrapper) {
          mapWrapper.appendChild(legend);
        }
      });

    })
    .catch(err => {
      console.error("Error loading map data:", err);
    });

  function createLegend(iconURLs, statusLayers, markers, activeStatuses) {
    const legendContainer = document.getElementById('map-legend');
    if (!legendContainer) return;

    legendContainer.innerHTML = '';

    for (const [status, iconUrl] of Object.entries(iconURLs)) {
      const item = document.createElement('label');
      item.className = 'legend-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = status !== "Cancelled";
      checkbox.style.marginRight = '8px';
      checkbox.id = `legend-checkbox-${status.replace(/\s+/g, '-')}`;

      const img = document.createElement('img');
      img.src = iconUrl;
      img.alt = status + ' icon';

      const labelText = document.createElement('span');
      labelText.textContent = status;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          activeStatuses.add(status);
          markers.addLayer(statusLayers[status]);
        } else {
          activeStatuses.delete(status);
          markers.removeLayer(statusLayers[status]);
        }
      });

      item.appendChild(checkbox);
      item.appendChild(img);
      item.appendChild(labelText);

      legendContainer.appendChild(item);
    }
  }

  function setupLegendToggle() {
    const container = document.getElementById('legend-container');
    if (!container) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'legend-toggle-btn';
    toggleBtn.textContent = 'Hide Legend';
    toggleBtn.type = 'button';

    toggleBtn.style.marginBottom = '8px';
    toggleBtn.style.padding = '6px 12px';
    toggleBtn.style.border = 'none';
    toggleBtn.style.backgroundColor = '#007BFF';
    toggleBtn.style.color = 'white';
    toggleBtn.style.borderRadius = '6px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '14px';
    toggleBtn.style.userSelect = 'none';

    toggleBtn.addEventListener('click', () => {
      const legend = document.getElementById('map-legend');
      if (!legend) return;

      if (legend.style.display === 'none') {
        legend.style.display = 'block';
        toggleBtn.textContent = 'Hide Legend';
      } else {
        legend.style.display = 'none';
        toggleBtn.textContent = 'Show Legend';
      }
    });

    container.insertBefore(toggleBtn, container.firstChild);
  }
});

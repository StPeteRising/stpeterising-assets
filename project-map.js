document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const mapboxToken = 'pk.eyJ1Ijoic3RwZXRlcmlzaW5nIiwiYSI6ImNtZDZxb2Mxa3BzZ2xrdmgxMDEifQ.QWBg7S51ggQ_jemRmD7nRw';

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
      popupAnchor: [0, -32]
    });
  }

  const activeStatuses = new Set(Object.keys(iconURLs).filter(s => s !== "Cancelled"));
  const statusLayers = {};

  const map = L.map('project-map').setView([27.773, -82.64], 13);
  L.tileLayer(
    `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
    {
      tileSize: 512,
      zoomOffset: -1,
      attribution: '© Mapbox © OpenStreetMap',
      maxZoom: 18
    }
  ).addTo(map);

  for (const status of Object.keys(iconURLs)) {
    statusLayers[status] = L.layerGroup();
  }

  const markers = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 15, spiderfyOnMaxZoom: true });

  fetch(sheetURL)
    .then(res => res.json())
    .then(data => {
      data.forEach(proj => {
        const lat = parseFloat(proj.Lat), lng = parseFloat(proj.Lng), status = proj.Status || "Proposed";
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng], { icon: getCustomIcon(status) });
          const popupHtml = `
            <div class="popup-content" style="min-width:250px;">
              <div class="popup-title">${proj["Project Name"]}</div>
              <div><strong>Status:</strong> ${status}</div>
              <div><strong>Address:</strong> ${proj.Address || ''}</div>
              <div><strong>Class:</strong> ${proj.Class || ''}</div>
              <div><strong>Floors:</strong> ${proj.Floors || ''}</div>
              <div><strong>Units:</strong> ${proj.Units || ''}</div>
              <div><strong>Completion:</strong> ${proj.Completion || ''}</div>
              ${proj.Rendering ? `<img src="${proj.Rendering}" style="max-width:100%; margin-top:8px; cursor:pointer;" onclick="window.open('${proj.Rendering}','_blank')" />` : ''}
              ${proj.Slug ? `<div style="margin-top:8px;"><a href="https://stpeterising.com/${proj.Slug}" target="_blank">View Project Page →</a></div>` : ''}
            </div>`;
          marker.bindPopup(popupHtml);
          statusLayers[status].addLayer(marker);
        }
      });

      for (const status of activeStatuses) {
        markers.addLayer(statusLayers[status]);
      }
      map.addLayer(markers);

      createLegend();
      addLegendToggle();
    })
    .catch(err => console.error("Error loading map data:", err));

  function createLegend() {
    const container = document.getElementById('map-legend');
    if (!container) return;
    container.innerHTML = '';
    for (const [status, iconUrl] of Object.entries(iconURLs)) {
      const label = document.createElement('label');
      label.className = 'legend-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = status !== "Cancelled";
      cb.dataset.status = status;
      cb.addEventListener('change', () => toggleStatus(status, cb.checked));
      const img = document.createElement('img');
      img.src = iconUrl; img.alt = status + ' icon';
      label.append(cb, img, document.createTextNode(status));
      container.appendChild(label);
    }
  }

  function toggleStatus(status, on) {
    if (on) {
      activeStatuses.add(status);
      markers.addLayer(statusLayers[status]);
    } else {
      activeStatuses.delete(status);
      markers.removeLayer(statusLayers[status]);
    }
  }

  function addLegendToggle() {
    const btn = document.createElement('button');
    btn.id = 'legend-toggle';
    btn.textContent = 'Hide Legend';
    document.body.appendChild(btn);
    const leg = document.getElementById('map-legend');
    btn.addEventListener('click', () => {
      if (leg.classList.toggle('hidden')) btn.textContent = 'Show Legend';
      else btn.textContent = 'Hide Legend';
    });
  }
});

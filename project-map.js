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

  const map = L.map('project-map', {
    center: [27.773, -82.64],
    zoom: 13,
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topright'
    }
  });

  // Initialize the geocoder control with Pinellas County bounding box restriction
  const geocoderControl = L.Control.geocoder({
    defaultMarkGeocode: false,
    geocoder: L.Control.Geocoder.nominatim({
      geocodingQueryParams: {
        viewbox: "-82.9000,28.2000,-82.4000,27.6000", // west, north, east, south (Pinellas County)
        bounded: 1
      }
    }),
    placeholder: "Search by address or project name...",
  })
  .on('markgeocode', function(e) {
    const bbox = e.geocode.bbox;
    const bounds = L.latLngBounds(bbox);
    map.fitBounds(bounds);

    // Reset marker clusters to show all active statuses
    markers.clearLayers();
    for (const status of activeStatuses) {
      markers.addLayer(statusLayers[status]);
    }
  })
  .addTo(map);

  L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  for (const status of Object.keys(iconURLs)) {
    statusLayers[status] = L.layerGroup();
  }

  const markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 15,
    spiderfyOnMaxZoom: true,
  });

  let allProjects = [];

  fetch(sheetURL)
    .then(res => res.json())
    .then(data => {
      allProjects = data;

      data.forEach(project => {
        const lat = parseFloat(project.Lat);
        const lng = parseFloat(project.Lng);
        const status = project.Status || "Proposed";

        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng], {
            icon: getCustomIcon(status),
            projectName: project["Project Name"] || ''
          });

          const popupHtml = `
            <div class="popup-content" style="min-width: 250px;">
              <div class="popup-title" style="font-weight: bold; margin-bottom: 6px;">${project["Project Name"]}</div>
              <div><strong>Status:</strong> ${status || ''}</div>
              <div><strong>Address:</strong> ${project.Address || ''}</div>
              <div><strong>Class:</strong> ${project.Class || ''}</div>
              <div><strong>Floors:</strong> ${project.Floors || ''}</div>
              ${
                project.Class === "Office"
                  ? `<div><strong>Square Footage:</strong> ${project["Office Square Footage"] || ''}</div>`
                  : project.Class === "Retail"
                  ? `<div><strong>Square Footage:</strong> ${project["Retail Square Footage"] || ''}</div>`
                  : `<div><strong>Units:</strong> ${project.Units || ''}</div>`
              }
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

          marker.bindPopup(popupHtml, { autoPan: false });

          marker.on('popupopen', (e) => {
            setTimeout(() => {
              const popup = e.popup;
              const mapSize = map.getSize();
              const containerPoint = map.latLngToContainerPoint(popup.getLatLng());
              const popupElement = popup.getElement();

              if (!popupElement) return;

              const popupHeight = popupElement.offsetHeight;
              const popupWidth = popupElement.offsetWidth;

              const paddingTop = 40;
              const paddingBottom = 10;
              const paddingLeft = 10;
              const paddingRight = 10;
              const verticalBuffer = 80;

              let offsetX = 0;
              let offsetY = 0;

              if (containerPoint.y - popupHeight < paddingTop + verticalBuffer) {
                offsetY = containerPoint.y - popupHeight - paddingTop - verticalBuffer;
              }
              if (containerPoint.y + paddingBottom > mapSize.y) {
                offsetY = containerPoint.y + paddingBottom - mapSize.y;
              }
              if (containerPoint.x - popupWidth / 2 < paddingLeft) {
                offsetX = containerPoint.x - popupWidth / 2 - paddingLeft;
              }
              if (containerPoint.x + popupWidth / 2 > mapSize.x - paddingRight) {
                offsetX = containerPoint.x + popupWidth / 2 - (mapSize.x - paddingRight);
              }

              if (offsetX !== 0 || offsetY !== 0) {
                map.panBy([offsetX, offsetY], { animate: true });
              }
            }, 50);
          });

          statusLayers[status].addLayer(marker);
        }
      });

      for (const status of activeStatuses) {
        markers.addLayer(statusLayers[status]);
      }
      map.addLayer(markers);

      createLegend(iconURLs, statusLayers, markers, activeStatuses);
      setupLegendToggle();

      // Setup project name dropdown for search input
      const searchInput = document.querySelector('.leaflet-control-geocoder-form input[type="search"]');
      setupProjectNameDropdown(searchInput, allProjects, statusLayers, markers, map, activeStatuses, geocoderControl);
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

    toggleBtn.style.margin = '0 0 4px 0';
    toggleBtn.style.padding = '4px 12px';
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

  // This function adds a dropdown under the geocoder search input to show matching project names when no address results found.
  function setupProjectNameDropdown(searchInput, allProjects, statusLayers, markers, map, activeStatuses, geocoderControl) {
    // Create dropdown container
    const dropdown = document.createElement('ul');
    dropdown.style.position = 'absolute';
    dropdown.style.background = 'white';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.zIndex = 2000;
    dropdown.style.listStyle = 'none';
    dropdown.style.padding = '0';
    dropdown.style.margin = '2px 0 0 0';
    dropdown.style.maxHeight = '150px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.width = searchInput.offsetWidth + 'px';
    dropdown.style.display = 'none';

    // Ensure parent of searchInput is relative positioned for absolute dropdown
    searchInput.parentNode.style.position = 'relative';
    searchInput.parentNode.appendChild(dropdown);

    let debounceTimeout;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
          dropdown.style.display = 'none';
          // Show all markers again
          markers.clearLayers();
          for (const status of activeStatuses) {
            markers.addLayer(statusLayers[status]);
          }
          return;
        }

        // Try address search first
        geocoderControl.options.geocoder.geocode(query, (results) => {
          if (results.length > 0) {
            // Address found - hide project dropdown & zoom to first result
            dropdown.style.display = 'none';
            const bbox = results[0].bbox;
            const bounds = L.latLngBounds(bbox);
            map.fitBounds(bounds);

            // Show all markers again
            markers.clearLayers();
            for (const status of activeStatuses) {
              markers.addLayer(statusLayers[status]);
            }
          } else {
            // No address found, filter projects by name substring
            const filtered = allProjects.filter(p => p["Project Name"] && p["Project Name"].toLowerCase().includes(query));

            // Clear previous dropdown entries
            dropdown.innerHTML = '';

            if (filtered.length === 0) {
              dropdown.style.display = 'none';
              markers.clearLayers();
              return;
            }

            // Populate dropdown with up to 10 project name matches
            filtered.slice(0, 10).forEach(proj => {
              const item = document.createElement('li');
              item.style.padding = '6px 10px';
              item.style.cursor = 'pointer';
              item.style.borderBottom = '1px solid #eee';
              item.textContent = proj["Project Name"];
              item.title = proj.Address || '';

              item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#007BFF';
                item.style.color = 'white';
              });
              item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
                item.style.color = 'black';
              });

              item.addEventListener('click', () => {
                // Find marker for clicked project name
                let foundMarker = null;
                for (const status of activeStatuses) {
                  const candidates = statusLayers[status].getLayers();
                  for (const m of candidates) {
                    if ((m.options.projectName || '') === proj["Project Name"]) {
                      foundMarker = m;
                      break;
                    }
                  }
                  if (foundMarker) break;
                }

                if (foundMarker) {
                  // Zoom and open popup
                  map.setView(foundMarker.getLatLng(), 17);
                  foundMarker.openPopup();

                  // Hide dropdown and set input value
                  dropdown.style.display = 'none';
                  searchInput.value = proj["Project Name"];
                }
              });

              dropdown.appendChild(item);
            });

            dropdown.style.display = 'block';

            // Filter markers on map to show only filtered projects
            markers.clearLayers();
            filtered.forEach(proj => {
              for (const status of activeStatuses) {
                const filteredMarkers = statusLayers[status].getLayers().filter(marker => (marker.options.projectName || '') === proj["Project Name"]);
                filteredMarkers.forEach(m => markers.addLayer(m));
              }
            });

            // Zoom map to fit all filtered markers
            const filteredMarkers = [];
            for (const status of activeStatuses) {
              filteredMarkers.push(...statusLayers[status].getLayers().filter(marker => {
                return filtered.some(p => p["Project Name"] === (marker.options.projectName || ''));
              }));
            }
            if (filteredMarkers.length) {
              const group = L.featureGroup(filteredMarkers);
              map.fitBounds(group.getBounds().pad(0.5));
            }
          }
        });
      }, 250);
    });

    // Hide dropdown if clicking outside search input or dropdown
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
});

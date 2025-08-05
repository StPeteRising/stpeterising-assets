document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaI3A1c/Sheet1';
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

  const outdoorsBase = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>',
    maxZoom: 18,
  });

  const satelliteBase = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`, {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>',
    maxZoom: 18,
  });

  const baseMaps = {
    "Standard": outdoorsBase,
    "Satellite": satelliteBase
  };

  const map = L.map('project-map', {
    center: [27.773, -82.64],
    zoom: 13,
    layers: [outdoorsBase],
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 'topright'
    }
  });

  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  for (const status of Object.keys(iconURLs)) {
    statusLayers[status] = L.layerGroup();
  }

  const markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 15,
    spiderfyOnMaxZoom: true,
  });

  let projects = [];

  fetch(sheetURL)
    .then(res => res.json())
    .then(data => {
      projects = data.map(project => {
        const lat = parseFloat(project.Lat);
        const lng = parseFloat(project.Lng);
        const status = project.Status || "Proposed";

        let marker = null;
        if (!isNaN(lat) && !isNaN(lng)) {
          marker = L.marker([lat, lng], {
            icon: getCustomIcon(status)
          });

          const popupHtml = `
            <div class="popup-content" style="min-width: 250px;">
              <div class="popup-title" style="font-weight: bold; margin-bottom: 6px;">${project["Project Name"]}</div>
              <div><strong>Status:</strong> ${status || ''}</div>
              <div><strong>Address:</strong> ${project.Address || ''}</div>
              <div><strong>Class:</strong> ${project.Class || ''}</div>
              <div><strong>Floors:</strong> ${project.Floors || ''}</div>
              ${
                project.Class === "Office" || project.Class === "Civic"
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
          if (activeStatuses.has(status)) {
            markers.addLayer(marker);
          }
        }

        return {
          ...project,
          marker,
          lat,
          lng,
          status
        };
      });

      map.addLayer(markers);

      createLegend(iconURLs, statusLayers, markers, activeStatuses);
      setupLegendToggle();
      addSearchControl();
      injectErrorReportingUI();
      setupErrorReportingEvents();
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

      ['click', 'mousedown', 'mouseup', 'dblclick', 'touchstart', 'touchend'].forEach(evt => {
        checkbox.addEventListener(evt, e => e.stopPropagation());
        item.addEventListener(evt, e => e.stopPropagation());
      });

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

    toggleBtn.className = 'legend-toggle';

    ['click', 'mousedown', 'mouseup', 'dblclick', 'touchstart', 'touchend'].forEach(evt => {
      toggleBtn.addEventListener(evt, e => e.stopPropagation());
    });

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

  function addSearchControl() {
    const searchControl = L.control({ position: 'topleft' });

    searchControl.onAdd = function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      container.style.backgroundColor = 'white';
      container.style.padding = '6px';
      container.style.borderRadius = '4px';
      container.style.minWidth = '250px';
      container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.position = 'relative';

      const input = L.DomUtil.create('input', '', container);
      input.type = 'search';
      input.placeholder = 'Search by address or project name...';
      input.style.width = '100%';
      input.style.padding = '6px 8px';
      input.style.border = '1px solid #ccc';
      input.style.borderRadius = '4px';
      input.autocomplete = 'off';

      const dropdown = L.DomUtil.create('ul', 'search-dropdown', container);
      dropdown.style.listStyle = 'none';
      dropdown.style.padding = '0';
      dropdown.style.margin = '4px 0 0 0';
      dropdown.style.maxHeight = '200px';
      dropdown.style.overflowY = 'auto';
      dropdown.style.border = '1px solid #ccc';
      dropdown.style.borderRadius = '4px';
      dropdown.style.backgroundColor = 'white';
      dropdown.style.position = 'absolute';
      dropdown.style.width = '100%';
      dropdown.style.zIndex = '1000';
      dropdown.style.display = 'none';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        dropdown.innerHTML = '';
        if (query.length === 0) {
          dropdown.style.display = 'none';
          return;
        }

        const filtered = projects.filter(proj => {
          return (proj["Project Name"] && proj["Project Name"].toLowerCase().includes(query))
            || (proj.Address && proj.Address.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
          dropdown.style.display = 'none';
          return;
        }

        filtered.forEach((proj) => {
          if (!proj.marker) return;

          const li = document.createElement('li');
          li.style.padding = '6px 8px';
          li.style.cursor = 'pointer';
          li.style.borderBottom = '1px solid #eee';
          li.style.fontSize = '14px';

          li.innerHTML = `<strong>${proj["Project Name"]}</strong><br/><small>${proj.Address || ''}</small>`;

          li.addEventListener('click', () => {
            input.value = proj["Project Name"];
            dropdown.style.display = 'none';

            const marker = proj.marker;
            if (!marker) return;

            // If marker is in a cluster, zoom to cluster and spiderfy if needed before opening popup
            const parentCluster = markers.getVisibleParent(marker);

            if (parentCluster && parentCluster !== marker) {
              map.fitBounds(parentCluster.getBounds(), { maxZoom: 18 });

              function onZoomEnd() {
                if (map.getZoom() >= 17) {
                  // Spiderfy cluster to show individual markers
                  markers.spiderfy(parentCluster);

                  // Open the correct marker popup after spiderfy
                  marker.openPopup();

                  map.off('zoomend', onZoomEnd);
                }
              }

              map.on('zoomend', onZoomEnd);
            } else {
              // Marker is not clustered, just zoom and open popup
              map.setView(marker.getLatLng(), 16);
              marker.openPopup();
            }
          });

          dropdown.appendChild(li);
        });

        dropdown.style.display = 'block';
      });

      input.addEventListener('blur', () => {
        setTimeout(() => {
          dropdown.style.display = 'none';
        }, 200);
      });

      return container;
    };

    searchControl.addTo(map);
  }

  // Inject the new styled Report a Data Error link and modal HTML
  function injectErrorReportingUI() {
    const mapContainer = document.getElementById('project-map');
    if (!mapContainer) return;

    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '8px';
    linkContainer.style.marginBottom = '12px';
    linkContainer.style.fontSize = '14px';

    const flexDiv = document.createElement('div');
    flexDiv.style.display = 'flex';
    flexDiv.style.justifyContent = 'flex-start';
    flexDiv.style.alignItems = 'center';

    const reportLink = document.createElement('a');
    reportLink.href = '#';
    reportLink.id = 'report-error-link';
    reportLink.style.color = '#666';
    reportLink.style.textDecoration = 'underline';
    reportLink.textContent = 'Report a data error';

    flexDiv.appendChild(reportLink);
    linkContainer.appendChild(flexDiv);

    mapContainer.insertAdjacentElement('afterend', linkContainer);

    const modalDiv = document.createElement('div');
    modalDiv.id = 'data-error-modal';
    modalDiv.style.display = 'none';

    const modalContent = document.createElement('div');

    const closeBtn = document.createElement('span');
    closeBtn.id = 'data-error-close';
    closeBtn.textContent = '×';

    modalContent.appendChild(closeBtn);

    const heading = document.createElement('h3');
    heading.textContent = 'Report a Data Error';
    modalContent.appendChild(heading);

    const textarea = document.createElement('textarea');
    textarea.id = 'data-error-message';
    textarea.placeholder = 'Describe the data issue...';

    modalContent.appendChild(textarea);

    const submitBtn = document.createElement('button');
    submitBtn.id = 'data-error-submit';
    submitBtn.textContent = 'Submit';

    modalContent.appendChild(submitBtn);

    const successMsg = document.createElement('div');
    successMsg.id = 'data-error-success';
    successMsg.textContent = 'Thank you! Your report was sent.';
    successMsg.style.display = 'none';

    modalContent.appendChild(successMsg);

    const errorMsg = document.createElement('div');
    errorMsg.id = 'data-error-error';
    errorMsg.textContent = 'Oops! Something went wrong. Please try again.';
    errorMsg.style.display = 'none';

    modalContent.appendChild(errorMsg);

    modalDiv.appendChild(modalContent);

    document.body.appendChild(modalDiv);
  }

  // Setup event listeners for Report a Data Error UI
  function setupErrorReportingEvents() {
    const reportLink = document.getElementById('report-error-link');
    const modal = document.getElementById('data-error-modal');
    const closeBtn = document.getElementById('data-error-close');
    const submitBtn = document.getElementById('data-error-submit');
    const textarea = document.getElementById('data-error-message');
    const successMsg = document.getElementById('data-error-success');
    const errorMsg = document.getElementById('data-error-error');

    if (!reportLink || !modal || !closeBtn || !submitBtn || !textarea || !successMsg || !errorMsg) return;

    reportLink.addEventListener('click', (e) => {
      e.preventDefault();
      successMsg.style.display = 'none';
      errorMsg.style.display = 'none';
      textarea.value = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    submitBtn.addEventListener('click', () => {
      const message = textarea.value.trim();
      if (!message) {
        errorMsg.textContent = 'Please enter a description of the data issue.';
        errorMsg.style.display = 'block';
        successMsg.style.display = 'none';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      errorMsg.style.display = 'none';
      successMsg.style.display = 'none';

      const scriptURL = 'https://script.google.com/macros/s/AKfycbwu3EaIFnqf0Idj3CyieOpjw0xtfCcdfs5_GuD2FMH7-VwvXtATO0YUrhCk0VS7mvE/exec';

      const formData = new URLSearchParams();
      formData.append('message', message);
      formData.append('pageUrl', window.location.href);

      fetch(scriptURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formData.toString()
      })
      .then(response => response.json())
      .then(data => {
        if (data.result === 'success') {
          successMsg.style.display = 'block';
          textarea.value = '';
        } else {
          errorMsg.textContent = data.error || 'Oops! Something went wrong. Please try again.';
          errorMsg.style.display = 'block';
        }
      })
      .catch(() => {
        errorMsg.textContent = 'Oops! Something went wrong. Please try again.';
        errorMsg.style.display = 'block';
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      });
    });
  }
});

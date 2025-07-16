const map = L.map('map').setView([27.7676, -82.6403], 14); // Center on St. Pete

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const sheetUrl = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';

const statusColors = {
  'Proposed': 'gold',
  'Approved': 'green',
  'Under Construction': 'blue',
  'Complete': 'gray',
  'Cancelled': 'red'
};

fetch(sheetUrl)
  .then(res => res.json())
  .then(data => {
    data.forEach(project => {
      const lat = parseFloat(project.Latitude);
      const lng = parseFloat(project.Longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = statusColors[project.Status] || 'black';

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      const popupHtml = `
        <div class="popup-content">
          <div class="popup-title">${project["Project Name"]}</div>
          <div><strong>Address:</strong> ${project.Address || ''}</div>
          <div><strong>Class:</strong> ${project.Class || ''}</div>
          <div><strong>Floors:</strong> ${project.Floors || ''}</div>
          <div><strong>Units:</strong> ${project.Units || ''}</div>
          <div><strong>Completion:</strong> ${project.Completion || ''}</div>
          ${project.Rendering ? `<img src="${project.Rendering}" alt="Rendering">` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
    });
  })
  .catch(err => {
    console.error("Error loading project data:", err);
  });

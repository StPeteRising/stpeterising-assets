document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const slug = document.getElementById('page-title')?.textContent.trim() || '';
  const container = document.getElementById("project-info");

  if (!container) {
    console.error("Container element with id 'project-info' not found.");
    return;
  }

  fetch(sheetURL)
    .then(response => {
      if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
      return response.json();
    })
    .then(data => {
      const project = data.find(p => (p.Slug || '').trim() === slug);

      if (!project) {
        container.innerHTML = "Project not found.";
        return;
      }

      const statusRaw = project.Status || '';
      const status = statusRaw.trim().toLowerCase();

      // Determine fill booleans for progress bar (except Cancelled)
      const fillProposed = ['proposed', 'approved', 'under construction', 'complete'].includes(status);
      const fillApproved = ['approved', 'under construction', 'complete'].includes(status);
      const fillUnderConstruction = ['under construction', 'complete'].includes(status);
      const fillComplete = status === 'complete';

      // Format last updated date
      const lastUpdatedRaw = project["Last Updated"] || project["LastUpdated"] || '';
      let lastUpdatedFormatted = '';
      if (lastUpdatedRaw) {
        const d = new Date(lastUpdatedRaw);
        if (!isNaN(d)) {
          lastUpdatedFormatted = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }

      // Cancelled pill HTML (if applicable)
      const isCancelled = (status === 'cancelled');
      const cancelledPillHtml = isCancelled
        ? `<div class="cancelled-tag">Cancelled</div>`
        : '';

      // Grey progress bar segments if cancelled
      const segmentClass = isCancelled ? 'status-segment unfilled' : '';

      // Grey status labels if cancelled, black otherwise
      const statusLabelColor = isCancelled ? '#aaa' : '#000';

      container.innerHTML = `
        <div class="project-status-wrapper">
          <div class="project-status-label">Status</div>
          ${cancelledPillHtml}
          <div class="status-bar-container">
            <div class="status-segment ${isCancelled ? 'unfilled' : fillProposed ? 'proposed' : 'unfilled'}"></div>
            <div class="status-segment ${isCancelled ? 'unfilled' : fillApproved ? 'approved' : 'unfilled'}"></div>
            <div class="status-segment ${isCancelled ? 'unfilled' : fillUnderConstruction ? 'under-construction' : 'unfilled'}"></div>
            <div class="status-segment ${isCancelled ? 'unfilled' : fillComplete ? 'complete' : 'unfilled'}"></div>
          </div>
          <div class="status-steps-labels">
            <div class="status-step-label" style="color: ${statusLabelColor}">Proposed</div>
            <div class="status-step-label" style="color: ${statusLabelColor}">Approved</div>
            <div class="status-step-label" style="color: ${statusLabelColor}">Under Construction</div>
            <div class="status-step-label" style="color: ${statusLabelColor}">Complete</div>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat-block">
            <div class="label">Address</div>
            <span>${project.Address || ''}</span>
          </div>
          <div class="stat-block">
            <div class="label">Class</div>
            <span>${project.Class || ''}</span>
          </div>
          <div class="stat-block">
            <div class="label">Floors</div>
            <span>${project.Floors || ''}</span>
          </div>
          <div class="stat-block">
            <div class="label">Units</div>
            <span>${project.Units || ''}</span>
          </div>
          <div class="stat-block">
            <div class="label">Completion</div>
            <span>${project.Completion || ''}</span>
          </div>
        </div>

        ${lastUpdatedFormatted ? `<div class="last-updated-note">Last updated on ${lastUpdatedFormatted}</div>` : ''}
      `;
    })
    .catch(err => {
      container.innerHTML = "Error loading project data.";
      console.error(err);
    });
});

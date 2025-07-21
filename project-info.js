document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const container = document.getElementById("project-info");
  const slug = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();

  if (!container) {
    console.error("Container with id 'project-info' not found.");
    return;
  }

  fetch(sheetURL)
    .then(response => {
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const project = data.find(p => (p.Slug || '').toLowerCase() === slug);
      if (!project) {
        container.innerHTML = "Project not found.";
        return;
      }

      const statusRaw = project.Status || '';
      const status = statusRaw.trim().toLowerCase();
      const isCancelled = status === 'cancelled';

      if (isCancelled) {
        container.classList.add('cancelled');
      } else {
        container.classList.remove('cancelled');
      }

      const fillProposed = ['proposed', 'approved', 'under construction', 'complete'].includes(status);
      const fillApproved = ['approved', 'under construction', 'complete'].includes(status);
      const fillUnderConstruction = ['under construction', 'complete'].includes(status);
      const fillComplete = status === 'complete';

      const lastUpdatedRaw = project["Last Updated"] || project["LastUpdated"] || '';
      let lastUpdatedFormatted = '';
      if (lastUpdatedRaw) {
        const d = new Date(lastUpdatedRaw);
        if (!isNaN(d)) {
          lastUpdatedFormatted = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }

      const cancelledPillHtml = isCancelled
        ? `<span class="cancelled-tag">Cancelled</span>`
        : '';

      container.innerHTML = `
        <div class="project-status-wrapper">
          <div class="project-status-label">Status</div>
          ${cancelledPillHtml}
          <div class="status-bar-container">
            <div class="status-segment ${fillProposed ? 'proposed' : 'unfilled'}"></div>
            <div class="status-segment ${fillApproved ? 'approved' : 'unfilled'}"></div>
            <div class="status-segment ${fillUnderConstruction ? 'under-construction' : 'unfilled'}"></div>
            <div class="status-segment ${fillComplete ? 'complete' : 'unfilled'}"></div>
          </div>
          <div class="status-steps-labels">
            <div class="status-step-label">Proposed</div>
            <div class="status-step-label">Approved</div>
            <div class="status-step-label">Under Construction</div>
            <div class="status-step-label">Complete</div>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat-block"><div class="label">Address</div><span>${project.Address || ''}</span></div>
          <div class="stat-block"><div class="label">Class</div><span>${project.Class || ''}</span></div>
          <div class="stat-block"><div class="label">Floors</div><span>${project.Floors || ''}</span></div>
          <div class="stat-block"><div class="label">Units</div><span>${project.Units || ''}</span></div>
          <div class="stat-block"><div class="label">Completion</div><span>${project.Completion || ''}</span></div>
        </div>

        ${lastUpdatedFormatted ? `<div class="last-updated-note">Last updated on ${lastUpdatedFormatted}</div>` : ''}
        <p style="margin-top: 16px; font-size: 14px; text-align: right;">
          <a href="mailto:brian@stpeterising.com?subject=Reporting%20a%20Data%20Error" style="color: #666; text-decoration: underline;">
            Report a data error
          </a>
        </p>
      `;

      if (!isCancelled) {
        // Highlight current status label
        const steps = ['proposed', 'approved', 'under construction', 'complete'];
        const currentIndex = steps.indexOf(status);
        steps.forEach((step, i) => {
          if (i <= currentIndex) {
            const labels = container.querySelectorAll('.status-step-label');
            if (labels[i]) labels[i].style.color = "#000";
          }
        });
      }
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "Error loading project data.";
    });
});

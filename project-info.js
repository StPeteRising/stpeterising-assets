document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';

  // Get slug from URL path: "/3rd-3rd" => "3rd-3rd"
  const slug = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const container = document.getElementById("project-info");

  if (!container) {
    console.error("Container element with id 'project-info' not found.");
    return;
  }

  console.log("Looking for project slug:", slug);

  fetch(sheetURL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Fetched data rows:", data.length);

      if (!slug) {
        container.innerHTML = "Project slug not found in URL.";
        return;
      }

      // Find project where Slug column matches URL slug (case-insensitive)
      const project = data.find(p => (p.Slug || '').trim().toLowerCase() === slug);

      if (!project) {
        container.innerHTML = "Project not found.";
        console.error("No project matched slug:", slug);
        return;
      }

      console.log("Found project:", project);

      const statusRaw = project.Status || '';
      const status = statusRaw.trim().toLowerCase();
      const isCancelled = status === 'cancelled';

      // Determine which bars fill
      const fillProposed = ['proposed', 'approved', 'under construction', 'complete'].includes(status);
      const fillApproved = ['approved', 'under construction', 'complete'].includes(status);
      const fillUnderConstruction = ['under construction', 'complete'].includes(status);
      const fillComplete = status === 'complete';

      // Format last updated date if present
      const lastUpdatedRaw = project["Last Updated"] || project["LastUpdated"] || '';
      let lastUpdatedFormatted = '';
      if (lastUpdatedRaw) {
        const d = new Date(lastUpdatedRaw);
        if (!isNaN(d)) {
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          lastUpdatedFormatted = d.toLocaleDateString(undefined, options);
        }
      }

      // Prepare Cancelled pill HTML if needed
      const cancelledPillHtml = isCancelled
        ? `<span class="cancelled-tag">Cancelled</span>`
        : '';

      container.innerHTML = `
        <div class="project-status-wrapper" style="${isCancelled ? 'filter: grayscale(1); opacity: 0.7;' : ''}">
          <div class="project-status-label">Status</div>
          ${cancelledPillHtml}
          <div class="status-bar-container">
            <div class="status-segment ${fillProposed && !isCancelled ? 'proposed' : 'unfilled'}"></div>
            <div class="status-segment ${fillApproved && !isCancelled ? 'approved' : 'unfilled'}"></div>
            <div class="status-segment ${fillUnderConstruction && !isCancelled ? 'under-construction' : 'unfilled'}"></div>
            <div class="status-segment ${fillComplete && !isCancelled ? 'complete' : 'unfilled'}"></div>
          </div>
          <div class="status-steps-labels" style="${isCancelled ? 'color: #888;' : ''}">
            <div id="status-label-proposed" class="status-step-label">Proposed</div>
            <div id="status-label-approved" class="status-step-label">Approved</div>
            <div id="status-label-under-construction" class="status-step-label">Under Construction</div>
            <div id="status-label-complete" class="status-step-label">Complete</div>
          </div>
        </div>

        <div class="project-stats" style="${isCancelled ? 'filter: grayscale(1); opacity: 0.7;' : ''}">
          <div class="stat-block"><div class="label">Address</div><span>${project.Address || ''}</span></div>
          <div class="stat-block"><div class="label">Class</div><span>${project.Class || ''}</span></div>
          <div class="stat-block"><div class="label">Floors</div><span>${project.Floors || ''}</span></div>
          <div class="stat-block"><div class="label">Units</div><span>${project.Units || ''}</span></div>
          <div class="stat-block"><div class="label">Completion</div><span>${project.Completion || ''}</span></div>
        </div>

        ${lastUpdatedFormatted ? `<div class="last-updated-note">Last updated on ${lastUpdatedFormatted}</div>` : ''}
      `;

      // Darken completed steps (unless cancelled)
      if (!isCancelled) {
        const steps = ['proposed', 'approved', 'under construction', 'complete'];
        const currentIndex = steps.indexOf(status);
        steps.forEach((step, i) => {
          if (i <= currentIndex) {
            const id = `status-label-${step.replace(/\s+/g, '-')}`;
            const el = document.getElementById(id);
            if (el) el.style.color = "#000";
          }
        });
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      container.innerHTML = "Error loading project data.";
    });
});

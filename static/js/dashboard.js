(function () {
  const profileForm = document.getElementById('profile-form');
  const applicationForm = document.getElementById('application-form');
  const applicationsTable = document.getElementById('applications-table');
  const suggestionsContainer = document.getElementById('suggestions');
  const alertBox = document.getElementById('dashboard-alert');
  const refreshApplicationsBtn = document.getElementById('refresh-applications');
  const refreshSuggestionsBtn = document.getElementById('refresh-suggestions');
  const educationForm = document.getElementById('education-form');
  const educationTable = document.getElementById('education-table');
  const educationCancelBtn = document.getElementById('education-cancel');
  const educationResetBtn = document.getElementById('education-reset');
  const publicationForm = document.getElementById('publication-form');
  const publicationTable = document.getElementById('publication-table');
  const publicationCancelBtn = document.getElementById('publication-cancel');
  const publicationResetBtn = document.getElementById('publication-reset');

  const educationStore = new Map();
  const publicationStore = new Map();
  let educationEditingId = null;
  let publicationEditingId = null;

  if (!profileForm || !applicationForm) {
    return;
  }

  function formToJSON(form) {
    const data = new FormData(form);
    const json = {};
    data.forEach((value, key) => {
      json[key] = value;
    });
    Array.from(form.elements).forEach((element) => {
      if (element instanceof HTMLInputElement && element.type === 'checkbox' && element.name) {
        json[element.name] = element.checked;
      }
    });
    return json;
  }

  function cleanupPayload(payload) {
    const numericFields = [
      'gpa',
      'gpa_scale',
      'gre_total',
      'toefl_total',
      'start_year',
      'end_year',
      'year',
    ];
    numericFields.forEach((field) => {
      if (field in payload) {
        const value = payload[field];
        if (value === '' || value === null || Number.isNaN(Number(value))) {
          delete payload[field];
        } else {
          payload[field] = Number(value);
        }
      }
    });
    return payload;
  }

  function showAlert(message, type = 'info') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
  }

  async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || 'Request failed';
      throw new Error(message);
    }
    return data;
  }

  async function loadProfile() {
    try {
      const data = await apiFetch('/api/profile');
      const profile = data.profile || {};
      Object.entries(profile).forEach(([key, value]) => {
        const field = profileForm.elements[key];
        if (!field) return;
        if (field.type === 'checkbox') {
          field.checked = Boolean(value);
        } else {
          field.value = value ?? '';
        }
      });
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function loadEducations() {
    if (!educationTable) return;
    try {
      const educations = await apiFetch('/api/education');
      renderEducations(educations);
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function loadPublications() {
    if (!publicationTable) return;
    try {
      const publications = await apiFetch('/api/publications');
      renderPublications(publications);
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const spinner = document.getElementById('profile-loading');
    const payload = cleanupPayload(formToJSON(profileForm));
    try {
      if (spinner) spinner.classList.remove('d-none');
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showAlert('Profile saved successfully!', 'success');
      await loadSuggestions();
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'danger');
    } finally {
      if (spinner) spinner.classList.add('d-none');
    }
  }

  function formatEducationYears(entry) {
    if (!entry) {
      return '-';
    }
    const start = entry.start_year || '';
    const end = entry.end_year || '';
    if (start || end) {
      const endLabel = entry.currently_enrolled ? 'Present' : end || '';
      return `${start || ''}${start && (endLabel || entry.currently_enrolled) ? ' - ' : ''}${endLabel}` || '-';
    }
    return entry.currently_enrolled ? 'In progress' : '-';
  }

  function renderEducations(list) {
    educationStore.clear();
    const rows = (list || []).map((entry) => {
      educationStore.set(entry.id, entry);
      const years = formatEducationYears(entry);
      const major = entry.field_of_study || '-';
      const gpa = entry.gpa ? `${entry.gpa}${entry.gpa_scale ? ` / ${entry.gpa_scale}` : ''}` : '-';
      return `
        <tr>
          <td>${entry.institution || '-'}</td>
          <td>${major}</td>
          <td>${years}</td>
          <td>${gpa}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-link" data-edit-education="${entry.id}">Edit</button>
            <button class="btn btn-sm btn-link text-danger" data-delete-education="${entry.id}">Delete</button>
          </td>
        </tr>`;
    });
    if (!rows.length) {
      educationTable.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-3">No education records yet.</td>
        </tr>`;
    } else {
      educationTable.innerHTML = rows.join('');
    }
  }

  function renderPublications(list) {
    publicationStore.clear();
    const rows = (list || []).map((entry) => {
      publicationStore.set(entry.id, entry);
      const authorRole = entry.author_type || (entry.first_author ? 'First Author' : 'Co-author');
      return `
        <tr>
          <td>${entry.title}</td>
          <td>${entry.venue || '-'}</td>
          <td>${entry.year || '-'}</td>
          <td>${entry.journal_type || '-'}</td>
          <td>${authorRole || '-'}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-link" data-edit-publication="${entry.id}">Edit</button>
            <button class="btn btn-sm btn-link text-danger" data-delete-publication="${entry.id}">Delete</button>
          </td>
        </tr>`;
    });
    if (!rows.length) {
      publicationTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-3">No publications recorded.</td>
        </tr>`;
    } else {
      publicationTable.innerHTML = rows.join('');
    }
  }

  function populateEducationForm(entry) {
    if (!entry || !educationForm) return;
    educationEditingId = entry.id;
    educationForm.education_id.value = entry.id;
    ['institution', 'degree', 'field_of_study', 'start_year', 'end_year', 'gpa', 'gpa_scale'].forEach((field) => {
      if (educationForm.elements[field]) {
        educationForm.elements[field].value = entry[field] ?? '';
      }
    });
    if (educationForm.elements.currently_enrolled) {
      educationForm.elements.currently_enrolled.checked = Boolean(entry.currently_enrolled);
    }
    educationCancelBtn?.classList.remove('d-none');
  }

  function resetEducationForm() {
    if (!educationForm) return;
    educationEditingId = null;
    educationForm.reset();
    educationForm.education_id.value = '';
    educationCancelBtn?.classList.add('d-none');
  }

  function populatePublicationForm(entry) {
    if (!entry || !publicationForm) return;
    publicationEditingId = entry.id;
    publicationForm.publication_id.value = entry.id;
    ['title', 'venue', 'year', 'journal_type', 'url'].forEach((field) => {
      if (publicationForm.elements[field]) {
        publicationForm.elements[field].value = entry[field] ?? '';
      }
    });
    const authorField = publicationForm.elements.author_type;
    if (authorField) {
      authorField.value = entry.author_type || (entry.first_author ? 'First Author' : 'Co-author');
    }
    publicationCancelBtn?.classList.remove('d-none');
  }

  function resetPublicationForm() {
    if (!publicationForm) return;
    publicationEditingId = null;
    publicationForm.reset();
    publicationForm.publication_id.value = '';
    publicationCancelBtn?.classList.add('d-none');
  }

  async function loadApplications() {
    try {
      const apps = await apiFetch('/api/applications/my');
      if (applicationsTable) {
        applicationsTable.innerHTML =
          apps
            .map(
              (app) => `
            <tr>
              <td>${app.university}</td>
              <td>${app.program}</td>
              <td>${app.term || '-'}</td>
              <td>
                <span class="badge bg-${badgeForResult(app.result)}">${app.result}</span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-link text-danger" data-delete="${app.id}">Delete</button>
              </td>
            </tr>
          `,
            )
            .join('');
      }
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  function badgeForResult(result) {
    switch ((result || '').toLowerCase()) {
      case 'admit':
        return 'success';
      case 'waitlist':
        return 'warning text-dark';
      default:
        return 'secondary';
    }
  }

  async function createApplication(event) {
    event.preventDefault();
    const payload = cleanupPayload(formToJSON(applicationForm));
    try {
      await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      applicationForm.reset();
      showAlert('Application added', 'success');
      await loadApplications();
      await loadSuggestions();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function deleteApplication(id) {
    if (!id) return;
    try {
      await apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
      showAlert('Application deleted', 'info');
      await loadApplications();
      await loadSuggestions();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function saveEducation(event) {
    event.preventDefault();
    const payload = cleanupPayload(formToJSON(educationForm));
    delete payload.education_id;
    try {
      if (educationEditingId) {
        await apiFetch(`/api/education/${educationEditingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/education', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      showAlert('Education saved', 'success');
      resetEducationForm();
      await loadEducations();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function deleteEducation(id) {
    if (!id) return;
    try {
      await apiFetch(`/api/education/${id}`, { method: 'DELETE' });
      if (educationEditingId === Number(id)) {
        resetEducationForm();
      }
      showAlert('Education entry deleted', 'info');
      await loadEducations();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function savePublication(event) {
    event.preventDefault();
    const payload = cleanupPayload(formToJSON(publicationForm));
    delete payload.publication_id;
    payload.first_author = payload.author_type === 'First Author';
    try {
      if (publicationEditingId) {
        await apiFetch(`/api/publications/${publicationEditingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/publications', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      showAlert('Publication saved', 'success');
      resetPublicationForm();
      await loadPublications();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function deletePublication(id) {
    if (!id) return;
    try {
      await apiFetch(`/api/publications/${id}`, { method: 'DELETE' });
      if (publicationEditingId === Number(id)) {
        resetPublicationForm();
      }
      showAlert('Publication deleted', 'info');
      await loadPublications();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function loadSuggestions() {
    if (!suggestionsContainer) return;
    suggestionsContainer.innerHTML = '<p class="text-muted">Loading…</p>';
    try {
      const data = await apiFetch('/api/match/suggestions', { method: 'GET', headers: {} });
      const sections = ['reach', 'match', 'safe'];
      suggestionsContainer.innerHTML = sections
        .map((section) => renderSuggestionSection(section, data[section] || []))
        .join('');
    } catch (error) {
      suggestionsContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
    }
  }

  function renderSuggestionSection(section, list) {
    if (!list.length) {
      return `
        <div class="suggestion-card ${section}">
          <div class="fw-semibold text-capitalize">${section}</div>
          <p class="mb-0 text-muted">Not enough data yet.</p>
        </div>`;
    }
    return `
      <div class="suggestion-card ${section}">
        <div class="fw-semibold text-capitalize mb-1">${section} (${list.length})</div>
        ${
          list
            .map(
              (item) => `
                <div class="mb-2">
                  <div>${item.university} · ${item.program}</div>
                  <small class="text-muted">Admit rate: ${(item.admit_rate * 100 || 0).toFixed(1)}% · Avg GPA: ${
                    item.avg_gpa ?? 'N/A'
                  }</small>
                </div>
              `,
            )
            .join('')
        }
      </div>`;
  }

  applicationsTable?.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('[data-delete]')) {
      const id = target.getAttribute('data-delete');
      deleteApplication(id);
    }
  });

  educationTable?.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('[data-edit-education]')) {
      const id = Number(target.getAttribute('data-edit-education'));
      populateEducationForm(educationStore.get(id));
    }
    if (target.matches('[data-delete-education]')) {
      const id = target.getAttribute('data-delete-education');
      deleteEducation(id);
    }
  });

  publicationTable?.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('[data-edit-publication]')) {
      const id = Number(target.getAttribute('data-edit-publication'));
      populatePublicationForm(publicationStore.get(id));
    }
    if (target.matches('[data-delete-publication]')) {
      const id = target.getAttribute('data-delete-publication');
      deletePublication(id);
    }
  });

  profileForm.addEventListener('submit', saveProfile);
  applicationForm.addEventListener('submit', createApplication);
  refreshApplicationsBtn?.addEventListener('click', loadApplications);
  refreshSuggestionsBtn?.addEventListener('click', loadSuggestions);
  educationForm?.addEventListener('submit', saveEducation);
  educationCancelBtn?.addEventListener('click', resetEducationForm);
  educationResetBtn?.addEventListener('click', resetEducationForm);
  publicationForm?.addEventListener('submit', savePublication);
  publicationCancelBtn?.addEventListener('click', resetPublicationForm);
  publicationResetBtn?.addEventListener('click', resetPublicationForm);

  loadProfile();
  loadApplications();
  loadSuggestions();
  loadEducations();
  loadPublications();
})();

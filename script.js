const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const fetchButton = document.getElementById('fetchButton');
const loadingOverlay = document.getElementById('loadingOverlay');
const modal = document.getElementById('imageModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

var ky = 'vfQl3ltRaQEVO6rvD3SeWCySjVUSc7Ex9xEdxdwh';
setupDateInputs(startInput, endInput);

fetchButton.addEventListener('click', fetchApodRange);
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

async function fetchApodRange() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderMessage('Please choose both a start date and an end date.');
    return;
  }

  if (startDate > endDate) {
    renderMessage('Start date must be earlier than or equal to end date.');
    return;
  }

  showLoading(true);

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${ky}&start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NASA API request failed with status ${response.status}.`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data.slice().reverse() : [data];
    renderGallery(items);
  } catch (error) {
    renderMessage(`Unable to load NASA images right now. ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function renderGallery(items) {
  const imageItems = items.filter((item) => item.media_type === 'image');
  const skippedCount = items.length - imageItems.length;

  if (imageItems.length === 0) {
    renderMessage('No APOD images were returned for that date range. NASA may have videos only for those dates.');
    return;
  }

  gallery.innerHTML = imageItems.map((item) => {
    const explanation = truncate(item.explanation || '', 180);
    const safeTitle = escapeHtml(item.title || 'NASA APOD');
    const safeDate = escapeHtml(item.date || '');
    const safeExplanation = escapeHtml(item.explanation || '');
    const safeUrl = escapeHtml(item.url || '');
    const safeHdUrl = escapeHtml(item.hdurl || item.url || '');

    return `
      <article class="gallery-item">
        <img
          src="${safeUrl}"
          alt="${safeTitle}"
          class="gallery-thumb"
          data-title="${safeTitle}"
          data-date="${safeDate}"
          data-explanation="${safeExplanation}"
          data-url="${safeHdUrl}"
        />
        <div class="gallery-body">
          <h2 class="gallery-title">${safeTitle}</h2>
          <p class="gallery-date">${safeDate}</p>
          <p class="gallery-desc">${escapeHtml(explanation)}</p>
          ${skippedCount > 0 ? `<p class="gallery-note">Skipped ${skippedCount} non-image item${skippedCount === 1 ? '' : 's'} from this range.</p>` : ''}
        </div>
      </article>
    `;
  }).join('');

  gallery.querySelectorAll('.gallery-thumb').forEach((img) => {
    img.addEventListener('click', () => openModal(img.dataset));
  });
}

function renderMessage(message) {
  gallery.innerHTML = `
    <div class="message-card">
      <div class="placeholder-icon">🛰️</div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function openModal(data) {
  modalImage.src = data.url;
  modalImage.alt = data.title;
  modalTitle.textContent = data.title;
  modalDate.textContent = data.date;
  modalExplanation.textContent = data.explanation;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  modalImage.src = '';
}

function showLoading(isLoading) {
  loadingOverlay.classList.toggle('hidden', !isLoading);
  fetchButton.disabled = isLoading;
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

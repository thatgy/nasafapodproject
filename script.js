const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchBtn = document.getElementById('fetchBtn');
const gallery = document.getElementById('gallery');
const loadingOverlay = document.getElementById('loadingOverlay');
const modal = document.getElementById('mediaModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const closeModalBtn = document.getElementById('closeModalBtn');
const factText = document.getElementById('spaceFact');
const newFactBtn = document.getElementById('newFactBtn');

const apiKey = 'vfQl3ltRaQEVO6rvD3SeWCySjVUSc7Ex9xEdxdwh';
const apodUrl = 'https://api.nasa.gov/planetary/apod';

const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'Neutron stars can spin at hundreds of times per second.',
  'The footprints left on the Moon can last for millions of years because there is no wind there.',
  'Jupiter has the shortest day of any planet in the Solar System at about 10 hours.',
  'One spoonful of a neutron star would weigh billions of tons on Earth.',
  'The Milky Way galaxy is estimated to contain hundreds of billions of stars.',
  'Olympus Mons on Mars is the tallest known volcano in the Solar System.',
  'Saturn would float in a giant enough pool because its average density is lower than water.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'There may be more stars in the universe than grains of sand on all of Earth’s beaches.'
];

setupDateInputs(startInput, endInput);
showRandomFact();

fetchBtn.addEventListener('click', fetchApodRange);
newFactBtn.addEventListener('click', showRandomFact);
closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target.dataset.closeModal === 'true') {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

async function fetchApodRange() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderMessage('Please select both a start date and an end date.', 'error');
    return;
  }

  if (startDate > endDate) {
    renderMessage('The start date must be on or before the end date.', 'error');
    return;
  }

  setLoading(true);
  showRandomFact();

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      start_date: startDate,
      end_date: endDate
    });

    const response = await fetch(`${apodUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`NASA API request failed with status ${response.status}.`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data.slice().reverse() : [data];
    renderGallery(items);
  } catch (error) {
    renderMessage(`Unable to load APOD entries right now. ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

function renderGallery(items) {
  gallery.innerHTML = '';

  if (!items.length) {
    renderMessage('No APOD entries were returned for that date range.');
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'gallery-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'media-button';
    trigger.setAttribute('aria-label', `Open ${item.title} in modal view`);

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'media-wrap';

    const mediaPreview = createPreviewMedia(item);
    mediaPreview.classList.add('media-preview');
    mediaWrap.appendChild(mediaPreview);

    const badge = document.createElement('span');
    badge.className = 'media-badge';
    badge.textContent = item.media_type === 'video' ? 'VIDEO' : 'IMAGE';
    mediaWrap.appendChild(badge);

    trigger.appendChild(mediaWrap);
    trigger.addEventListener('click', () => openModal(item));

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title || 'Untitled APOD';

    const date = document.createElement('p');
    date.className = 'card-date';
    date.textContent = item.date || '';

    const text = document.createElement('p');
    text.className = 'card-text';
    text.textContent = truncateText(item.explanation || 'No explanation provided.', 170);

    content.append(title, date, text);
    card.append(trigger, content);
    gallery.appendChild(card);
  });
}

function createPreviewMedia(item) {
  if (item.media_type === 'video') {
    const embedUrl = getVideoEmbedUrl(item.url);

    if (embedUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.title = item.title || 'NASA APOD video';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.tabIndex = -1;
      return iframe;
    }

    const fallback = document.createElement('div');
    fallback.className = 'video-fallback';
    fallback.textContent = '▶ APOD Video';
    return fallback;
  }

  const img = document.createElement('img');
  img.src = item.url;
  img.alt = item.title || 'NASA APOD image';
  img.loading = 'lazy';
  return img;
}

function openModal(item) {
  modalTitle.textContent = item.title || 'Untitled APOD';
  modalDate.textContent = item.date || '';
  modalExplanation.textContent = item.explanation || 'No explanation provided.';
  modalMedia.innerHTML = '';

  if (item.media_type === 'video') {
    const embedUrl = getVideoEmbedUrl(item.url);

    if (embedUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.title = item.title || 'NASA APOD video';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'modal-video-fallback';
      fallback.innerHTML = `<div><p>This APOD entry is a video hosted externally.</p><p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Open video source</a></p></div>`;
      modalMedia.appendChild(fallback);
    }
  } else {
    const img = document.createElement('img');
    img.src = item.hdurl || item.url;
    img.alt = item.title || 'NASA APOD image';
    modalMedia.appendChild(img);
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  modalMedia.innerHTML = '';
  document.body.style.overflow = '';
}

function getVideoEmbedUrl(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes('player.vimeo.com')) {
      return url;
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }

    return '';
  } catch {
    return '';
  }
}

function renderMessage(message, type = 'empty') {
  gallery.innerHTML = `<div class="${type === 'error' ? 'error-note' : 'empty-note'}"><p>${message}</p></div>`;
}

function setLoading(isLoading) {
  loadingOverlay.classList.toggle('hidden', !isLoading);
  loadingOverlay.setAttribute('aria-hidden', String(!isLoading));
  fetchBtn.disabled = isLoading;
  fetchBtn.textContent = isLoading ? 'Loading...' : 'Get Space Images';
}

function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factText.textContent = spaceFacts[randomIndex];
}

function truncateText(text, limit) {
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

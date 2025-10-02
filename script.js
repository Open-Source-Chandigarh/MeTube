// Constants (keep API key and endpoints)
const API_KEY = 'AIzaSyCQqvQhNs-lX7KoUCErol_05C5pM15YCRQ';
const SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';

// Default video to show initially (popular YouTube API demo video)
const DEFAULT_VIDEO_ID = 'M7lc1UVf-VE'; // YouTube IFrame API demo video [Google sample]

// UI state
let isDescriptionVisible = true;
let isCommentVisible = false;

// Category dropdown handler
function onCategoryChange(value) {
  // Trigger a search filtered by category keyword
  searchVideos(value);
}

// Search videos
function searchVideos(category = '') {
  const searchInput = document.getElementById('searchInput').value;
  const results = document.getElementById('searchResults');
  const titleEl = document.getElementById('videoTitle');
  const descEl = document.getElementById('descriptionContainer');
  const commEl = document.getElementById('commentContainer');

  // Reset results and hide panels until a video is chosen
  results.innerHTML = '';
  titleEl.innerText = '';
  descEl.style.display = 'none';
  commEl.style.display = 'none';
  hideButtons();

  let query = searchInput;
  if (category && category !== 'all') {
    query = category;
  }

  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;
          const thumb = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '';
          const channel = item.snippet.channelTitle || '';

          const resultItem = document.createElement('div');
          resultItem.classList.add('card');
          resultItem.innerHTML = `
            <img class="thumb" src="${thumb}" alt="Thumbnail">
            <div class="info">
              <h3 class="title">${title}</h3>
              <div class="sub">${channel}</div>
            </div>
          `;
          resultItem.addEventListener('click', () => playVideo(videoId));
          results.appendChild(resultItem);
        });
      } else {
        results.innerHTML = '<div class="empty">No videos found. Try another search or category.</div>';
      }
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      alert('An error occurred while fetching data.');
    });
}

// Initialize with a default video so container is never blank
function initDefaultVideo() {
  playVideo(DEFAULT_VIDEO_ID, { showCommentsAfter: true });
}

// Hide Description/Comments buttons
function hideButtons() {
  const descriptionButton = document.getElementById('toggleDescriptionButton');
  const commentButton = document.getElementById('toggleCommentButton');
  descriptionButton.style.display = 'none';
  commentButton.style.display = 'none';
}

// Show Description/Comments buttons
function showButtons() {
  const descriptionButton = document.getElementById('toggleDescriptionButton');
  const commentButton = document.getElementById('toggleCommentButton');
  descriptionButton.style.display = 'inline-flex';
  commentButton.style.display = 'inline-flex';
}

// Load a video into the player and populate title/description; optionally load comments immediately
function playVideo(videoId, options = {}) {
  const { showCommentsAfter = false } = options;
  const iframe = document.getElementById('videoPlayer');
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  updateVideoTitle(videoId);
  updateDescription(videoId);
  showButtons();
  setTab('desc');

  if (showCommentsAfter) {
    displayComments(videoId);
  }
}

// Fetch and set the video title
function updateVideoTitle(selectedVideoId) {
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${selectedVideoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const titleEl = document.getElementById('videoTitle');
      if (data.items && data.items.length > 0) {
        titleEl.innerText = data.items[0].snippet.title || '';
      } else {
        titleEl.innerText = '';
      }
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      alert('An error occurred while fetching video details.');
    });
}

// Fetch and show description and meta
function updateDescription(selectedVideoId) {
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${selectedVideoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const descriptionContainer = document.getElementById('descriptionContainer');
      if (data.items && data.items.length > 0) {
        const snip = data.items[0].snippet || {};
        const description = snip.description || '';
        const channelTitle = snip.channelTitle || '';
        const publishedAt = snip.publishedAt ? new Date(snip.publishedAt).toLocaleString() : '';

        descriptionContainer.innerHTML = `
          <h3 style="margin:0 0 8px 0;">Description</h3>
          <div class="meta">
            <span>${channelTitle}</span>
            <span>•</span>
            <span>${publishedAt}</span>
          </div>
          <p style="white-space:pre-wrap;margin-top:8px;">${description || 'No description available.'}</p>
        `;
        descriptionContainer.style.display = 'block';
      } else {
        descriptionContainer.innerHTML = '<p>No description available.</p>';
        descriptionContainer.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      alert('An error occurred while fetching video details.');
    });
}

// Tabs between Description/Comments
function setTab(tab) {
  const descBtn = document.getElementById('toggleDescriptionButton');
  const commBtn = document.getElementById('toggleCommentButton');
  const desc = document.getElementById('descriptionContainer');
  const comm = document.getElementById('commentContainer');

  if (tab === 'desc') {
    descBtn.classList.add('is-active');
    commBtn.classList.remove('is-active');
    descBtn.setAttribute('aria-selected', 'true');
    commBtn.setAttribute('aria-selected', 'false');
    desc.style.display = 'block';
    comm.style.display = 'none';
    isDescriptionVisible = true;
    isCommentVisible = false;
  } else {
    commBtn.classList.add('is-active');
    descBtn.classList.remove('is-active');
    commBtn.setAttribute('aria-selected', 'true');
    descBtn.setAttribute('aria-selected', 'false');
    desc.style.display = 'none';
    comm.style.display = 'block';
    isDescriptionVisible = false;
    isCommentVisible = true;
  }
}

function toggleDescription() {
  setTab('desc');
}

// For backward compatibility if referenced elsewhere
function toggleComments() {
  setTab('comm');
}

// Toggle and load comments
function showComments() {
  const videoId = getVideoIdFromPlayer();
  if (!videoId) {
    alert('Please select a video first.');
    return;
  }
  setTab('comm');
  displayComments(videoId);
}

// Get current video ID from iframe URL
function getVideoIdFromPlayer() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoUrl = videoPlayer.src;
  if (!videoUrl) return '';
  const parts = videoUrl.split('/embed/');
  return parts[1]?.split('?')[0] || '';
}

// Fetch top-level comments via commentThreads.list
function displayComments(videoId) {
  fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=10&videoId=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const commentContainer = document.getElementById('commentContainer');
      if (data.items && data.items.length > 0) {
        const list = data.items.map(item => {
          const c = item.snippet.topLevelComment.snippet;
          const author = c.authorDisplayName || 'User';
          const avatar = c.authorProfileImageUrl || '';
          const text = c.textDisplay || '';
          const likes = typeof c.likeCount === 'number' ? c.likeCount : 0;
          const time = c.publishedAt ? new Date(c.publishedAt).toLocaleString() : '';

          return `
            <div class="comment">
              <img class="avatar" src="${avatar}" alt="${author}">
              <div class="content">
                <div class="meta"><strong>${author}</strong><span>${time}</span><span>👍 ${likes}</span></div>
                <div class="text">${text}</div>
              </div>
            </div>
          `;
        }).join('');

        commentContainer.innerHTML = `
          <h3 style="margin:0 0 8px 0;">Comments</h3>
          ${list}
        `;
        commentContainer.style.display = 'block';
      } else {
        commentContainer.innerHTML = '<p>No comments found for this video.</p>';
        commentContainer.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error fetching comments:', error);
      alert('An error occurred while fetching comments.');
    });
}

// Dark mode toggle
function toggleDarkMode() {
  const body = document.body;
  const darkModeIcon = document.getElementById('darkModeIcon');
  body.classList.toggle("dark-mode");
  darkModeIcon.innerText = body.classList.contains("dark-mode") ? 'light_mode' : 'dark_mode';
}

// Enter to search
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchVideos();
    }
  });

  // Ensure buttons are hidden until a video is shown
  hideButtons();

  // Load the default video so the container is not blank
  initDefaultVideo();
});

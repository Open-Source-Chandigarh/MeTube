const API_KEY = 'AIzaSyCQqvQhNs-lX7KoUCErol_05C5pM15YCRQ';
const SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
let isDescriptionVisible = true;
let isCommentVisible = false;

// Category dropdown handler
function onCategoryChange(value){
  if(value === 'all'){
    showTrending();
  }else{
    searchVideos(value);
  }
}

function searchVideos(category = '') {
  const searchInput = document.getElementById('searchInput').value;
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const welcomeMessage = document.getElementById('welcomeMessage');

  // Hide left/right until a video is picked
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');

  // Hide welcome message and clear results
  welcomeMessage.classList.add('hidden');
  document.getElementById('videoPlayer').src = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = '';
  document.getElementById('descriptionContainer').style.display = 'none';
  document.getElementById('commentContainer').style.display = 'none';
  hideButtons();

  let query = searchInput;
  if (category && category !== 'all') query = category;

  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const resultsContainer = document.getElementById('searchResults');
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;
          const thumb = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '';

          const resultItem = document.createElement('div');
          resultItem.classList.add('result-item');
          resultItem.innerHTML = `
            <img src="${thumb}" alt="Thumbnail">
            <p>${title}</p>
          `;
          resultItem.addEventListener('click', () => playVideo(videoId));
          resultsContainer.appendChild(resultItem);
        });
      } else {
        resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.1rem; color: #666;">No videos found.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      alert('An error occurred while fetching data.');
    });
}

function hideButtons() {
  const descriptionButton = document.getElementById('toggleDescriptionButton');
  const commentButton = document.getElementById('toggleCommentButton');
  descriptionButton.style.display = 'none';
  commentButton.style.display = 'none';
}
hideButtons();

function playVideo(videoId) {
  const videoUrl = `https://www.youtube.com/embed/${videoId}`;
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');

  // Show the video wrapper and section when a video is selected
  videoWrapper.classList.add('show');
  videoSection.classList.remove('no-video');

  document.getElementById('videoPlayer').src = videoUrl;
  updateVideoTitle(videoId); // Update the video title
  updateDescription(videoId); // Update the video description
  showButtons(); // Show buttons when video is selected

  if (videoSection) {
    videoSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function updateVideoTitle(selectedVideoId) {
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${selectedVideoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        const title = data.items[0].snippet.title || '';
        document.getElementById('videoTitle').innerText = title;
      } else {
        document.getElementById('videoTitle').innerText = '';
      }
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      alert('An error occurred while fetching video details.');
    });
}

function showButtons() {
  const descriptionButton = document.getElementById('toggleDescriptionButton');
  const commentButton = document.getElementById('toggleCommentButton');
  descriptionButton.style.display = 'block';
  commentButton.style.display = 'block';
}

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
          <h3>Description</h3>
          <p style="margin:.25rem 0 .5rem 0;opacity:.9">${channelTitle} • ${publishedAt}</p>
          <p>${description ? description.replace(/\n/g,'<br>') : 'No description available.'}</p>
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

function toggleDescription() {
  const descriptionElement = document.getElementById('descriptionContainer');
  isDescriptionVisible = !isDescriptionVisible;
  descriptionElement.style.display = isDescriptionVisible ? 'block' : 'none';
}

function toggleComments() {
  const commentContainer = document.getElementById('commentContainer');
  isCommentVisible = !isCommentVisible;
  commentContainer.style.display = isCommentVisible ? 'block' : 'none';
}

function toggleDarkMode() {
  const body = document.body;
  const darkModeIcon = document.getElementById('darkModeIcon');
  body.classList.toggle("dark-mode");
  darkModeIcon.innerText = body.classList.contains("dark-mode") ? 'light_mode' : 'dark_mode';
}

function getVideoIdFromPlayer() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoUrl = videoPlayer.src;
  const parts = videoUrl.split('/embed/');
  return parts[1]?.split('?')[0] || '';
}

function displayComments(videoId) {
  fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=10&videoId=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const commentContainer = document.getElementById('commentContainer');
      if (data.items && data.items.length > 0) {
        const firstComment = data.items[0].snippet?.topLevelComment?.snippet;
        const commentText = firstComment?.textDisplay || 'No comments found.';
        commentContainer.innerHTML = `<h3>Pinned Comment:</h3><p>${commentText}</p>`;
      } else {
        commentContainer.innerHTML = '<h3>Comments</h3><p>No comments found.</p>';
      }
      commentContainer.style.display = 'block';
    })
    .catch(error => {
      console.error('Error fetching comments:', error);
      const commentContainer = document.getElementById('commentContainer');
      commentContainer.innerHTML = '<h3>Comments</h3><p>Unable to load comments.</p>';
      commentContainer.style.display = 'block';
    });
}

function showComments() {
  const videoId = getVideoIdFromPlayer();
  if (!videoId) {
    alert('Please select a video first.');
    return;
  }
  const commentContainer = document.getElementById('commentContainer');
  if (commentContainer.style.display === 'block') {
    commentContainer.style.display = 'none';
  } else {
    displayComments(videoId);
    commentContainer.style.display = 'block';
  }
}

// Enter-to-search and default states
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const videoSection = document.querySelector('.video-section');

  // Hide video section by default
  videoSection.classList.add('no-video');

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchVideos();
    }
  });
});

// Trending “All” handler
function showTrending() {
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const welcomeMessage = document.getElementById('welcomeMessage');

  // Hide video wrapper and section when showing trending
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');

  // Hide welcome message
  welcomeMessage.classList.add('hidden');

  document.getElementById('videoPlayer').src = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = '';
  document.getElementById('descriptionContainer').style.display = 'none';
  document.getElementById('commentContainer').style.display = 'none';
  hideButtons();

  const query = 'trending popular videos';

  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const resultsContainer = document.getElementById('searchResults');
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;
          const thumb = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '';

          const resultItem = document.createElement('div');
          resultItem.classList.add('result-item');
          resultItem.innerHTML = `
            <img src="${thumb}" alt="Thumbnail">
            <p>${title}</p>
          `;
          resultItem.addEventListener('click', () => playVideo(videoId));
          resultsContainer.appendChild(resultItem);
        });
      } else {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">No trending videos found at the moment.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching trending videos:', error);
      const resultsContainer = document.getElementById('searchResults');
      resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">Unable to load trending videos.</p>';
    });
}

const API_KEY = 'AIzaSyCQqvQhNs-lX7KoUCErol_05C5pM15YCRQ';
const SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
let isDescriptionVisible = true;
let isCommentVisible = false;

function searchVideos(category = '') {
  const searchInput = document.getElementById('searchInput').value;
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const welcomeMessage = document.getElementById('welcomeMessage');
  
  // Hide video wrapper and section when searching
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');
  
  // Hide welcome message when searching
  welcomeMessage.classList.add('hidden');
  
  document.getElementById('videoPlayer').src = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = ''; // Clear video title
  document.getElementById('descriptionContainer').style.display = 'none'; // Hide description container
  document.getElementById('commentContainer').style.display = 'none'; // Hide comment container
  hideButtons(); // Hide buttons

  let query = searchInput;
  if (category && category !== 'all') {
    query = category; // Override the search query if a category is selected
  }

  // Make API request to search for videos
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        // Display search results
        const resultsContainer = document.getElementById('searchResults');
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;

          // Create result item
          const resultItem = document.createElement('div');
          resultItem.classList.add('result-item');
          resultItem.innerHTML = `
            <img src="${item.snippet.thumbnails.medium.url}" alt="Thumbnail">
            <p>${title}</p>
          `;
          resultItem.addEventListener('click', () => playVideo(videoId));
          resultsContainer.appendChild(resultItem);
        });
      } else {
        alert('No videos found.');
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
      if (data.items.length > 0) {
        const title = data.items[0].snippet.title;
        document.getElementById('videoTitle').innerText = title; // Set the video title
      } else {
        document.getElementById('videoTitle').innerText = ''; // Clear video title if no data found
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
      if (data.items.length > 0) {
        const description = data.items[0].snippet.description;
        const descriptionContainer = document.getElementById('descriptionContainer');
        if (description) {
          descriptionContainer.innerHTML = `<h3>Description Box:</h3><p>${description}</p>`;
          descriptionContainer.style.display = 'block'; // Display description container
        } else {
          descriptionContainer.innerHTML = '<p>No description available.</p>';
          descriptionContainer.style.display = 'none'; // Hide description container if no description
        }
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

function toggleNav() {
  const searchContainer = document.querySelector('.search-container');
  searchContainer.classList.toggle('open');
}


function getVideoIdFromPlayer() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoUrl = videoPlayer.src;
  const videoId = videoUrl.split('/').pop();
  return videoId;
}

function displayComments(videoId) {
  fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const firstComment = data.items[0];
      const commentContainer = document.getElementById('commentContainer');
      if (firstComment) {
        const commentText = firstComment.snippet.topLevelComment.snippet.textDisplay;
        commentContainer.innerHTML = `<h3>Pinned Comment:</h3><p>${commentText}</p>`;
        commentContainer.style.display = 'block';
      } else {
        commentContainer.innerHTML = '<p>No comments found.</p>';
        commentContainer.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error fetching comments:', error);
      alert('An error occurred while fetching comments.');
    });
}

function showComments() {
  const commentContainer = document.getElementById('commentContainer');
  if (commentContainer.style.display === 'block') {
    commentContainer.style.display = 'none';
  } else {
    const videoId = getVideoIdFromPlayer();
    displayComments(videoId);
    commentContainer.style.display = 'block';
  }
}

//adding search functionality by pressing enter key
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

// Function to show trending videos when "All" is clicked
function showTrending() {
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const welcomeMessage = document.getElementById('welcomeMessage');
  
  // Hide video wrapper and section when showing trending
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');
  
  // Hide welcome message when searching
  welcomeMessage.classList.add('hidden');
  
  document.getElementById('videoPlayer').src = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = '';
  document.getElementById('descriptionContainer').style.display = 'none';
  document.getElementById('commentContainer').style.display = 'none';
  hideButtons();

  // Search for trending/popular content
  const query = 'trending popular videos';
  
  // Make API request to search for trending videos
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        // Display search results
        const resultsContainer = document.getElementById('searchResults');
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;

          // Create result item
          const resultItem = document.createElement('div');
          resultItem.classList.add('result-item');
          resultItem.innerHTML = `
            <img src="${item.snippet.thumbnails.medium.url}" alt="Thumbnail">
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

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
  document.getElementById('descriptionContainer').style.display = 'none'; 
  document.getElementById('commentContainer').style.display = 'none'; 
  hideButtons(); 

  let query = searchInput;
  if (category && category !== 'all') {
    query = category;
  }

  // API request
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = ''; // clear old results
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;

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
  document.getElementById('toggleDescriptionButton').style.display = 'none';
  document.getElementById('toggleCommentButton').style.display = 'none';
}

hideButtons();

function playVideo(videoId) {
  const videoUrl = `https://www.youtube.com/embed/${videoId}`;
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  
  // Show video section
  videoWrapper.classList.add('show');
  videoSection.classList.remove('no-video');
  
  document.getElementById('videoPlayer').src = videoUrl;
  updateVideoTitle(videoId);
  updateDescription(videoId);
  showButtons();

  // smooth scroll to video
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
        document.getElementById('videoTitle').innerText = data.items[0].snippet.title;
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
  document.getElementById('toggleDescriptionButton').style.display = 'block';
  document.getElementById('toggleCommentButton').style.display = 'block';
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
          descriptionContainer.style.display = 'block';
        } else {
          descriptionContainer.innerHTML = '<p>No description available.</p>';
          descriptionContainer.style.display = 'block'; 
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
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

window.onload = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
};

function getVideoIdFromPlayer() {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoUrl = videoPlayer.src;
  return videoUrl.split('/').pop();
}

function displayComments(videoId) {
  fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const commentContainer = document.getElementById('commentContainer');
      if (data.items && data.items.length > 0) {
        const firstComment = data.items[0];
        const commentText = firstComment.snippet.topLevelComment.snippet.textDisplay;
        commentContainer.innerHTML = `<h3>Pinned Comment:</h3><p>${commentText}</p>`;
        commentContainer.style.display = 'block';
      } else {
        commentContainer.innerHTML = '<p>No comments found.</p>';
        commentContainer.style.display = 'block';
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

// Search by pressing Enter
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const videoSection = document.querySelector('.video-section');
  
  videoSection.classList.add('no-video');

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchVideos();
    }
  });
});

// Show trending videos
function showTrending() {
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const welcomeMessage = document.getElementById('welcomeMessage');
  
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');
  welcomeMessage.classList.add('hidden');
  
  document.getElementById('videoPlayer').src = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = '';
  document.getElementById('descriptionContainer').style.display = 'none';
  document.getElementById('commentContainer').style.display = 'none';
  hideButtons();

  const query = 'trending popular videos';
  
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const resultsContainer = document.getElementById('searchResults');
      resultsContainer.innerHTML = '';
      if (data.items.length > 0) {
        data.items.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;

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
        resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">No trending videos found at the moment.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching trending videos:', error);
      const resultsContainer = document.getElementById('searchResults');
      resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">Unable to load trending videos.</p>';
    });
}

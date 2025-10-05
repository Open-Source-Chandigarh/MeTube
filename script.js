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
  if (document.getElementById('searchResults')) document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = ''; // Clear video title
  document.getElementById('descriptionContainer').style.display = 'none'; // Hide description container
  if (document.getElementById('commentsContainer')) document.getElementById('commentsContainer').style.display = 'none';
  if (document.getElementById('relatedVideos')) document.getElementById('relatedVideos').innerHTML = '';
  
  fullDescription = '';
  isDescriptionExpanded = false;
  if (document.getElementById('showMoreBtn')) document.getElementById('showMoreBtn').style.display = 'none';

  let query = searchInput;
  if (category && category !== 'all') {
    query = category; // Override the search query if a category is selected
  }

  // Make API request to search for videos
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.items.length > 0) {
        const videoResults = data.items.filter(item => {
          return item.id && item.id.videoId && item.id.kind === 'youtube#video';
        });
        
        if (videoResults.length > 0) {
          // Display search results
          const resultsContainer = document.getElementById('searchResults');
          videoResults.slice(0, 10).forEach(item => {
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
          document.getElementById('searchResults').innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">No videos found for your search.</p>';
        }
      } else {
        alert('No videos found.');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      const resultsContainer = document.getElementById('searchResults');
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #ff4757;">
            <p>Sorry, an error occurred while fetching the data.</p>
            <p style="font-size: 0.9em; color: #666;">Please try again later or check your connection.</p>
          </div>
        `;
      }
    });
}


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
  loadRelatedVideos(videoId); // Load related videos in sidebar
  loadVideoComments(videoId); // Load video comments

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




let fullDescription = '';
let isDescriptionExpanded = false;

function updateDescription(selectedVideoId) {
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${selectedVideoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        const description = data.items[0].snippet.description;
        const descriptionElement = document.getElementById('videoDescription');
        const descriptionContainer = document.getElementById('descriptionContainer');
        const showMoreBtn = document.getElementById('showMoreBtn');
        
        if (description && description.trim()) {
          fullDescription = description;
          isDescriptionExpanded = false;
          
          if (description.length > 200) {
            const truncatedDescription = description.substring(0, 200) + '...';
            descriptionElement.innerHTML = formatDescription(truncatedDescription);
            showMoreBtn.style.display = 'inline-block';
            showMoreBtn.textContent = 'Show More';
          } else {
            descriptionElement.innerHTML = formatDescription(description);
            showMoreBtn.style.display = 'none';
          }
          
          descriptionContainer.style.display = 'block';
        } else {
          descriptionElement.textContent = 'No description available.';
          showMoreBtn.style.display = 'none';
          descriptionContainer.style.display = 'block';
        }
      }
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      const descriptionElement = document.getElementById('videoDescription');
      const showMoreBtn = document.getElementById('showMoreBtn');
      descriptionElement.textContent = 'Error loading description.';
      showMoreBtn.style.display = 'none';
    });
}

function formatDescription(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="description-link">$1</a>');
}

function toggleDescription() {
  const descriptionElement = document.getElementById('videoDescription');
  const showMoreBtn = document.getElementById('showMoreBtn');
  
  if (isDescriptionExpanded) {
    const truncatedDescription = fullDescription.substring(0, 200) + '...';
    descriptionElement.innerHTML = formatDescription(truncatedDescription);
    showMoreBtn.textContent = 'Show More';
    isDescriptionExpanded = false;
  } else {
    descriptionElement.innerHTML = formatDescription(fullDescription);
    showMoreBtn.textContent = 'Show Less';
    isDescriptionExpanded = true;
  }
}




function toggleDarkMode() {
  const body = document.body;
  const darkModeIcon = document.getElementById('darkModeIcon');
  body.classList.toggle("dark-mode");
  darkModeIcon.innerText = body.classList.contains("dark-mode") ? 'light_mode' : 'dark_mode';
}






// Function to load related videos in sidebar
function loadRelatedVideos(videoId) {
  // Get video details to extract tags/category for better related video search
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        const videoTags = data.items[0].snippet.tags;
        const videoTitle = data.items[0].snippet.title;
        
        // Use tags or title keywords to search for related videos
        let searchQuery = '';
        if (videoTags && videoTags.length > 0) {
          searchQuery = videoTags.slice(0, 3).join(' ');
        } else {
          // Extract first few words from title as search query
          searchQuery = videoTitle.split(' ').slice(0, 3).join(' ');
        }
        
        // Search for related videos
        fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=12&q=${encodeURIComponent(searchQuery)}&type=video&key=${API_KEY}`)
          .then(response => response.json())
          .then(relatedData => {
            const filteredVideos = relatedData.items.filter(item => {
              return item.id && item.id.videoId && item.id.kind === 'youtube#video' && item.id.videoId !== videoId;
            });
            displayRelatedVideos(filteredVideos);
          })
          .catch(error => {
            console.error('Error fetching related videos:', error);
          });
      }
    })
    .catch(error => {
      console.error('Error fetching video details for related search:', error);
    });
}

// Function to display related videos in sidebar
function displayRelatedVideos(videos) {
  const relatedVideosContainer = document.getElementById('relatedVideos');
  relatedVideosContainer.innerHTML = '';
  
  videos.slice(0, 6).forEach(video => {
    const videoItem = document.createElement('div');
    videoItem.classList.add('related-video-item');
    videoItem.innerHTML = `
      <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" class="related-video-thumbnail">
      <div class="related-video-info">
        <p class="related-video-title">${video.snippet.title}</p>
        <p class="related-video-channel">${video.snippet.channelTitle}</p>
      </div>
    `;
    
    videoItem.addEventListener('click', () => {
      playVideo(video.id.videoId);
    });
    
    relatedVideosContainer.appendChild(videoItem);
  });
}

function loadVideoComments(videoId) {
  const commentsContainer = document.getElementById('commentsContainer');
  const commentsLoading = document.getElementById('commentsLoading');
  const commentsList = document.getElementById('commentsList');
  
  commentsContainer.style.display = 'block';
  commentsLoading.style.display = 'block';
  commentsList.innerHTML = '';
  
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(videoData => {
      const channelId = videoData.items[0]?.snippet?.channelId;
      
      fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=15&order=relevance&key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
          commentsLoading.style.display = 'none';
          
          if (data.items && data.items.length > 0) {
            displayComments(data.items, channelId);
          } else {
            commentsList.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">No comments available for this video.</p>';
          }
        })
        .catch(error => {
          console.error('Error fetching comments:', error);
          commentsLoading.style.display = 'none';
          commentsList.innerHTML = '<p style="text-align: center; color: #ff4757; font-style: italic;">Comments are disabled for this video or could not be loaded.</p>';
        });
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      commentsLoading.style.display = 'none';
      commentsList.innerHTML = '<p style="text-align: center; color: #ff4757; font-style: italic;">Could not load comments.</p>';
    });
}

function displayComments(comments, videoChannelId) {
  const commentsList = document.getElementById('commentsList');
  
  const pinnedComments = [];
  const regularComments = [];
  
  comments.forEach(commentThread => {
    const comment = commentThread.snippet.topLevelComment.snippet;
    
    const isChannelOwner = comment.authorChannelId && 
                          comment.authorChannelId.value === videoChannelId;
    
    const hasHighEngagement = comment.likeCount > 100; // High like count might indicate importance
    
    const containsPinnedKeywords = comment.textDisplay.toLowerCase().includes('pinned') ||
                                  comment.textDisplay.toLowerCase().includes('pin') ||
                                  comment.textDisplay.toLowerCase().includes('heart');
    
    const isPinned = isChannelOwner || 
                    (hasHighEngagement && pinnedComments.length === 0) ||
                    containsPinnedKeywords;
    
    if (isPinned && pinnedComments.length < 2) { // Limit to max 2 pinned comments
      pinnedComments.push({...commentThread, isChannelOwner});
    } else {
      regularComments.push(commentThread);
    }
  });
  
  pinnedComments.forEach(commentThread => {
    const comment = commentThread.snippet.topLevelComment.snippet;
    createCommentElement(comment, true, commentsList, commentThread.isChannelOwner);
  });
  
  regularComments.slice(0, 8).forEach(commentThread => {
    const comment = commentThread.snippet.topLevelComment.snippet;
    createCommentElement(comment, false, commentsList, false);
  });
}

function createCommentElement(comment, isPinned, container, isChannelOwner = false) {
  const commentItem = document.createElement('div');
  commentItem.classList.add('comment-item');
  if (isPinned) {
    commentItem.classList.add('pinned-comment');
  }
  
  const publishDate = new Date(comment.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const maxLength = isPinned ? 300 : 200;
  const commentText = comment.textDisplay.length > maxLength 
    ? comment.textDisplay.substring(0, maxLength) + '...' 
    : comment.textDisplay;
  
  let badge = '';
  if (isPinned) {
    if (isChannelOwner) {
      badge = '<span class="pinned-badge creator-badge">Creator</span>';
    } else {
      badge = '<span class="pinned-badge">Pinned</span>';
    }
  }
  
  const authorName = isChannelOwner ? 
    `<span class="creator-name">${comment.authorDisplayName}</span>` : 
    comment.authorDisplayName;
  
  commentItem.innerHTML = `
    <div class="comment-header">
      <p class="comment-author">${authorName}</p>
      ${badge}
    </div>
    <p class="comment-text">${commentText}</p>
    <div class="comment-meta">
      <span class="comment-date">${publishDate}</span>
      <span class="comment-likes">
        <span>👍</span>
        <span>${comment.likeCount || 0}</span>
      </span>
    </div>
  `;
  
  container.appendChild(commentItem);
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

function handleSubscribe(event) {
  if (event) event.preventDefault();
  const emailInput = document.getElementById('newsletterEmail');
  const msg = document.getElementById('newsletterMsg');
  const email = emailInput && emailInput.value ? emailInput.value.trim() : '';

  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
  if (!email || !re.test(email)) {
    msg.textContent = 'Please enter a valid email address.';
    msg.style.color = '#d9534f';
    return false;
  }

  msg.textContent = 'Thanks for subscribing! Check your inbox for updates.';
  msg.style.color = '#2a7a2a';
  emailInput.value = '';
  return false;
}

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
  document.getElementById('commentsContainer').style.display = 'none'; // Hide comments container
  document.getElementById('relatedVideos').innerHTML = ''; // Clear related videos
  
  // Reset description state
  fullDescription = '';
  isDescriptionExpanded = false;
  document.getElementById('showMoreBtn').style.display = 'none';

  // Search for trending/popular content
  const query = 'trending popular videos';
  
  // Make API request to search for trending videos
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=15&q=${query}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        const videoResults = data.items.filter(item => {
          return item.id && item.id.videoId && item.id.kind === 'youtube#video';
        });
        
        if (videoResults.length > 0) {
          // Display search results
          const resultsContainer = document.getElementById('searchResults');
          videoResults.slice(0, 10).forEach(item => {
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
          const resultsContainer = document.getElementById('searchResults');
          resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">No videos found at the moment.</p>';
        }
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

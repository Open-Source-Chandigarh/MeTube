const API_KEY = 'AIzaSyCKECoE9j8tmYKZ5g0qvbmPT0ZA0D3N2Vo';
const SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
let isDescriptionVisible = true;
let isCommentVisible = false;

// View Mode Toggle
let currentView = localStorage.getItem('viewMode') || 'grid';

// Theme System
let currentTheme = localStorage.getItem('theme') || 'light';

function searchVideos(category = '') {
  const searchInput = document.getElementById('searchInput').value;
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const filterButtons = document.getElementById('filterButtons');
  const backButton = document.getElementById('backButton');
  const backToolbar = document.getElementById('backToolbar');
  
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');
  if (filterButtons) filterButtons.classList.remove('hidden');
  if (backToolbar) backToolbar.style.display = 'none';

  setActiveCategory(category && category !== 'all' ? category : '');
  
  // Hide welcome message when searching
  welcomeMessage.classList.add('hidden');
  
  // Only clear video player if it's not in PiP mode
  if (!isPiPActive) {
    document.getElementById('videoPlayer').src = '';
  }
  
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = ''; // Clear video title
  document.getElementById('descriptionContainer').style.display = 'none'; // Hide description container
  document.getElementById('commentsContainer').style.display = 'none'; // Hide comments container
  document.getElementById('relatedVideos').innerHTML = ''; // Clear related videos
  
  fullDescription = '';
  isDescriptionExpanded = false;
  document.getElementById('showMoreBtn').style.display = 'none';

  let query = searchInput;
  if (category && category !== 'all') {
    query = category; // Override the search query if a category is selected
  }

  // Attempt to serve from sessionStorage cache first (5-minute TTL)
  try {
    const key = 'metube:search:' + encodeURIComponent((query || '').trim().toLowerCase());
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw);
      const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
      if (cached && typeof cached.ts === 'number' && Array.isArray(cached.data)) {
        if ((Date.now() - cached.ts) < SEARCH_CACHE_TTL_MS) {
          const videoResults = cached.data;
          if (videoResults.length > 0) {
            const resultsContainer = document.getElementById('searchResults');
            resultsContainer.innerHTML = '';
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
          return; // Served from cache; skip network
        } else {
          // Expired cache; clean up
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    // Ignore cache errors (e.g., storage disabled)
  }

  // Show enhanced search skeletons while fetching
  try {
    const tpl = document.getElementById('searchResultSkeleton');
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.classList.add('content-loading');
    
    if (tpl && tpl.content) {
      const skeletonCount = currentView === 'grid' ? 8 : 5;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < skeletonCount; i++) {
        const skeleton = tpl.content.cloneNode(true);
        const skeletonEl = skeleton.querySelector('.result-item');
        if (skeletonEl) {
          skeletonEl.style.animationDelay = `${i * 0.05}s`;
        }
        frag.appendChild(skeleton);
      }
      resultsContainer.innerHTML = '';
      resultsContainer.appendChild(frag);
    }
  } catch (_) {}

  // Make API request to search for videos
  fetch(`${SEARCH_ENDPOINT}?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.items.length > 0) {
        const videoResults = data.items.filter(item => {
          return item.id && item.id.videoId && item.id.kind === 'youtube#video';
        });
        
        // Store results in cache (even if empty array) with timestamp
        try {
          const key = 'metube:search:' + encodeURIComponent((query || '').trim().toLowerCase());
          sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: videoResults }));
        } catch (e) {
          // Ignore quota or serialization errors
        }
        
        if (videoResults.length > 0) {
          // Get video IDs to fetch durations and stats
          const videoIds = videoResults.slice(0, 10).map(item => item.id.videoId).join(',');
          
          // Fetch video details (duration, views, etc.)
          fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`)
            .then(response => response.json())
            .then(videoDetailsData => {
              // Create a map of video details by ID
              const videoDetailsMap = {};
              if (videoDetailsData.items) {
                videoDetailsData.items.forEach(item => {
                  videoDetailsMap[item.id] = {
                    duration: item.contentDetails.duration,
                    viewCount: item.statistics.viewCount,
                    likeCount: item.statistics.likeCount
                  };
                });
              }
              
              // Display search results with animations and video details
              const resultsContainer = document.getElementById('searchResults');
              resultsContainer.classList.remove('content-loading');
              resultsContainer.innerHTML = '';
              
              videoResults.slice(0, 10).forEach((item, index) => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const channelTitle = item.snippet.channelTitle;
                const publishedAt = item.snippet.publishedAt;
                const videoDetails = videoDetailsMap[videoId] || {};

                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.style.animationDelay = `${index * 0.05}s`;
                
                // Format duration
                const duration = videoDetails.duration ? formatDuration(videoDetails.duration) : '';
                
                // Format view count
                const viewCount = videoDetails.viewCount ? formatViewCount(videoDetails.viewCount) : '';
                
                // Format upload date
                const uploadDate = formatUploadDate(publishedAt);
                
                resultItem.innerHTML = `
                  <div class="thumbnail-container">
                    <img src="${item.snippet.thumbnails.medium.url}" alt="Thumbnail" loading="lazy">
                    ${duration ? `<span class="video-duration">${duration}</span>` : ''}
                  </div>
                  <div class="video-info">
                    <p class="video-title">${title}</p>
                    <p class="video-channel">${channelTitle}</p>
                    <div class="video-meta">
                      ${viewCount ? `<span class="video-views">${viewCount} views</span>` : ''}
                      ${viewCount && uploadDate ? '<span class="meta-separator">•</span>' : ''}
                      ${uploadDate ? `<span class="video-date">${uploadDate}</span>` : ''}
                    </div>
                  </div>
                `;
                resultItem.addEventListener('click', () => playVideo(videoId));
                resultsContainer.appendChild(resultItem);
              });
            })
            .catch(error => {
              console.error('Error fetching video details:', error);
              // Fallback to displaying without durations
              const resultsContainer = document.getElementById('searchResults');
              resultsContainer.classList.remove('content-loading');
              resultsContainer.innerHTML = '';
              
              videoResults.slice(0, 10).forEach((item, index) => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;

                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.style.animationDelay = `${index * 0.05}s`;
                resultItem.innerHTML = `
                  <img src="${item.snippet.thumbnails.medium.url}" alt="Thumbnail" loading="lazy">
                  <p>${title}</p>
                `;
                resultItem.addEventListener('click', () => playVideo(videoId));
                resultsContainer.appendChild(resultItem);
              });
            });
        } else {
          const resultsContainer = document.getElementById('searchResults');
          resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">No videos found for your search.</p>';
        }
      } else {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">No videos found.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      const resultsContainer = document.getElementById('searchResults');
      resultsContainer.innerHTML = '<p style="text-align: center; margin: 2rem; font-size: 1.2rem; color: #666;">An error occurred while fetching data.</p>';
    });
}


function playVideo(videoId) {
  const videoUrl = `https://www.youtube.com/embed/${videoId}`;
  const videoWrapper = document.getElementById('videoWrapper');
  const videoSection = document.querySelector('.video-section');
  const filterButtons = document.getElementById('filterButtons');
  const backButton = document.getElementById('backButton');
  const backToolbar = document.getElementById('backToolbar');
  const miniPlayer = document.getElementById('miniPlayer');
  const videoPlayer = document.getElementById('videoPlayer');
  
  // Close PiP if it's active and move iframe back to main player
  if (isPiPActive && miniPlayer) {
    const miniVideoContainer = document.querySelector('.mini-player-video');
    const iframeInMini = miniVideoContainer ? miniVideoContainer.querySelector('iframe') : null;
    
    if (iframeInMini && videoWrapper) {
      // Move iframe back to main wrapper
      videoWrapper.appendChild(iframeInMini);
    }
    
    // Close mini player
    miniPlayer.style.display = 'none';
    miniPlayer.classList.remove('active');
    if (videoSection) videoSection.classList.remove('pip-active');
    isPiPActive = false;
    updatePipButton(false);
  }
  
  videoWrapper.classList.add('show');
  videoSection.classList.remove('no-video');
  if (filterButtons) filterButtons.classList.add('hidden');
  if (backToolbar) backToolbar.style.display = 'block';
  
  // Set the new video URL
  if (videoPlayer) {
    videoPlayer.src = videoUrl;
  }
  
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




function toggleViewMode() {
  const searchResults = document.getElementById('searchResults');
  const viewIcon = document.getElementById('viewIcon');
  
  if (currentView === 'grid') {
    currentView = 'list';
    searchResults.classList.add('list-view');
    viewIcon.textContent = 'view_list';
  } else {
    currentView = 'grid';
    searchResults.classList.remove('list-view');
    viewIcon.textContent = 'grid_view';
  }
  
  localStorage.setItem('viewMode', currentView);
  
  // Add transition animation
  searchResults.style.opacity = '0';
  setTimeout(() => {
    searchResults.style.opacity = '1';
  }, 200);
}

// Theme System Functions
function setTheme(theme) {
  const body = document.body;
  
  // Remove all theme classes
  body.classList.remove('dark-mode', 'sepia-theme', 'contrast-theme');
  
  // Apply new theme
  switch(theme) {
    case 'dark':
      body.classList.add('dark-mode');
      break;
    case 'sepia':
      body.classList.add('sepia-theme');
      break;
    case 'contrast':
      body.classList.add('contrast-theme');
      break;
    default:
      // Light theme (default)
      break;
  }
  
  currentTheme = theme;
  localStorage.setItem('theme', theme);
  
  // Close theme menu
  document.getElementById('themeMenu').classList.add('hidden');
  
  // Animate theme transition
  body.style.transition = 'all 0.3s ease';
}

function toggleThemeMenu() {
  const themeMenu = document.getElementById('themeMenu');
  themeMenu.classList.toggle('hidden');
  
  // Close menu when clicking outside
  if (!themeMenu.classList.contains('hidden')) {
    setTimeout(() => {
      document.addEventListener('click', closeThemeMenu);
    }, 100);
  }
}

function closeThemeMenu(e) {
  const themeSelector = document.querySelector('.theme-selector');
  if (!themeSelector.contains(e.target)) {
    document.getElementById('themeMenu').classList.add('hidden');
    document.removeEventListener('click', closeThemeMenu);
  }
}

// Keep old toggleDarkMode for backward compatibility
function toggleDarkMode() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}




// Function to load related videos in sidebar
function loadRelatedVideos(videoId) {
  // Show skeletons in sidebar while fetching related videos
  try {
    const container = document.getElementById('relatedVideos');
    const tpl = document.getElementById('relatedVideoSkeleton');
    if (container) {
      container.innerHTML = '';
      if (tpl && tpl.content) {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 6; i++) {
          frag.appendChild(tpl.content.cloneNode(true));
        }
        container.appendChild(frag);
      }
    }
  } catch(_) {}
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
            const container = document.getElementById('relatedVideos');
            if (container) {
              container.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">Unable to load related videos.</p>';
            }
          });
      }
    })
    .catch(error => {
      console.error('Error fetching video details for related search:', error);
      const container = document.getElementById('relatedVideos');
      if (container) {
        container.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">Unable to load related videos.</p>';
      }
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
  commentsList.innerHTML = '';
  
  // Render comment skeletons while fetching
  try {
    const tpl = document.getElementById('commentSkeleton');
    if (tpl && tpl.content) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 6; i++) {
        frag.appendChild(tpl.content.cloneNode(true));
      }
      commentsLoading.innerHTML = '';
      commentsLoading.appendChild(frag);
      commentsLoading.style.display = 'block';
    } else {
      commentsLoading.style.display = 'block';
    }
  } catch (_) {}
  
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`)
    .then(response => response.json())
    .then(videoData => {
      const channelId = videoData.items[0]?.snippet?.channelId;
      
      fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=15&order=relevance&key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
          commentsLoading.style.display = 'none';
          commentsLoading.innerHTML = '';
          
          if (data.items && data.items.length > 0) {
            displayComments(data.items, channelId);
          } else {
            commentsList.innerHTML = '<p style="text-align: center; color: #888; font-style: italic;">No comments available for this video.</p>';
          }
        })
        .catch(error => {
          console.error('Error fetching comments:', error);
          commentsLoading.style.display = 'none';
          commentsLoading.innerHTML = '';
          commentsList.innerHTML = '<p style="text-align: center; color: #ff4757; font-style: italic;">Comments are disabled for this video or could not be loaded.</p>';
        });
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      commentsLoading.style.display = 'none';
      commentsLoading.innerHTML = '';
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
  const navbar = document.querySelector('.navbar');
  const backButton = document.getElementById('backButton');
  const filterButtons = document.getElementById('filterButtons');
  
  videoSection.classList.add('no-video');
  
  // Apply saved theme on load
  if (currentTheme !== 'light') {
    setTheme(currentTheme);
  }
  
  // Apply saved view mode on load
  if (currentView === 'list') {
    document.getElementById('searchResults').classList.add('list-view');
    document.getElementById('viewIcon').textContent = 'view_list';
  }

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchVideos();
    }
  });

  let lastKnownScrollY = 0;
  let ticking = false;
  function onScroll() {
    lastKnownScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (navbar) {
          const shouldShrink = lastKnownScrollY > 120; // shrink threshold
          const shouldExpand = lastKnownScrollY < 40;  // expand threshold
          if (shouldShrink) {
            navbar.classList.add('shrink');
            document.body.classList.add('navbar-shrink');
          } else if (shouldExpand) {
            navbar.classList.remove('shrink');
            document.body.classList.remove('navbar-shrink');
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if (backButton) {
    backButton.addEventListener('click', () => {
      const videoWrapper = document.getElementById('videoWrapper');
      const results = document.getElementById('searchResults');
      const mainPlayer = document.getElementById('videoPlayer');

      // If a video is currently playing, move it to PiP instead of unloading it
      if (mainPlayer && mainPlayer.src && mainPlayer.src !== '') {
        // Activate PiP so playback continues while user navigates back
        if (!isPiPActive) togglePictureInPicture();
        // Hide the large player container UI while PiP is visible
        videoWrapper.classList.remove('show');
        videoSection.classList.add('no-video');
        if (filterButtons) filterButtons.classList.remove('hidden');
        const backToolbar = document.getElementById('backToolbar');
        if (backToolbar) backToolbar.style.display = 'none';
        if (!results || results.children.length === 0) {
          showTrending();
        }
        return;
      }

      // Fallback: if no video is playing, behave as before
      videoWrapper.classList.remove('show');
      videoSection.classList.add('no-video');
      if (filterButtons) filterButtons.classList.remove('hidden');
      const backToolbar = document.getElementById('backToolbar');
      if (backToolbar) backToolbar.style.display = 'none';
      if (!results || results.children.length === 0) {
        showTrending();
      }
      // Keep scroll position constant when going back from a video
    });
  }
  setActiveCategory('all');
});

function setActiveCategory(category) {
  const container = document.getElementById('filterButtons');
  if (!container) return;
  const buttons = container.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (!category || category === 'all') {
    const allBtn = container.querySelector('[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');
    return;
  }
  const target = container.querySelector(`[data-category="${CSS.escape(category)}"]`);
  if (target) target.classList.add('active');
}

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
  const miniPlayer = document.getElementById('miniPlayer');
  
  // Hide video wrapper and section when showing trending
  videoWrapper.classList.remove('show');
  videoSection.classList.add('no-video');
  
  // Hide welcome message when searching
  welcomeMessage.classList.add('hidden');
  
  // Only clear iframe if it's not in PiP mode
  const isPipActive = miniPlayer && miniPlayer.style.display !== 'none';
  if (!isPipActive) {
    document.getElementById('videoPlayer').src = '';
  }
  
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('videoTitle').innerText = '';
  document.getElementById('descriptionContainer').style.display = 'none';
  document.getElementById('commentsContainer').style.display = 'none'; // Hide comments container
  document.getElementById('relatedVideos').innerHTML = ''; // Clear related videos
  
  // Reset description state
  fullDescription = '';
  isDescriptionExpanded = false;
  document.getElementById('showMoreBtn').style.display = 'none';

  // Mark 'All' as active
  setActiveCategory('all');

  // Show skeletons while fetching trending
  try {
    const tpl = document.getElementById('searchResultSkeleton');
    const resultsContainer = document.getElementById('searchResults');
    if (tpl && tpl.content) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 8; i++) {
        frag.appendChild(tpl.content.cloneNode(true));
      }
      resultsContainer.appendChild(frag);
    }
  } catch (_) {}

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
          // Get video IDs to fetch durations and stats
          const videoIds = videoResults.slice(0, 10).map(item => item.id.videoId).join(',');
          
          // Fetch video details (duration, views, etc.)
          fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`)
            .then(response => response.json())
            .then(videoDetailsData => {
              // Create a map of video details by ID
              const videoDetailsMap = {};
              if (videoDetailsData.items) {
                videoDetailsData.items.forEach(item => {
                  videoDetailsMap[item.id] = {
                    duration: item.contentDetails.duration,
                    viewCount: item.statistics.viewCount,
                    likeCount: item.statistics.likeCount
                  };
                });
              }
              
              // Display trending results with animations and video details
              const resultsContainer = document.getElementById('searchResults');
              resultsContainer.innerHTML = '';
              
              videoResults.slice(0, 10).forEach((item, index) => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const channelTitle = item.snippet.channelTitle;
                const publishedAt = item.snippet.publishedAt;
                const videoDetails = videoDetailsMap[videoId] || {};

                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.style.animationDelay = `${index * 0.05}s`;
                
                // Format duration
                const duration = videoDetails.duration ? formatDuration(videoDetails.duration) : '';
                
                // Format view count
                const viewCount = videoDetails.viewCount ? formatViewCount(videoDetails.viewCount) : '';
                
                // Format upload date
                const uploadDate = formatUploadDate(publishedAt);
                
                resultItem.innerHTML = `
                  <div class="thumbnail-container">
                    <img src="${item.snippet.thumbnails.medium.url}" alt="Thumbnail" loading="lazy">
                    ${duration ? `<span class="video-duration">${duration}</span>` : ''}
                  </div>
                  <div class="video-info">
                    <p class="video-title">${title}</p>
                    <p class="video-channel">${channelTitle}</p>
                    <div class="video-meta">
                      ${viewCount ? `<span class="video-views">${viewCount} views</span>` : ''}
                      ${viewCount && uploadDate ? '<span class="meta-separator">•</span>' : ''}
                      ${uploadDate ? `<span class="video-date">${uploadDate}</span>` : ''}
                    </div>
                  </div>
                `;
                resultItem.addEventListener('click', () => playVideo(videoId));
                resultsContainer.appendChild(resultItem);
              });
            })
            .catch(error => {
              console.error('Error fetching video details for trending:', error);
              // Fallback to displaying without durations
              const resultsContainer = document.getElementById('searchResults');
              resultsContainer.innerHTML = '';
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

// Scroll to Top Button Functionality
const scrollTopBtn = document.getElementById("scrollTopBtn");

// Show button when user scrolls down 200px
window.onscroll = function () {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        scrollTopBtn.style.display = "block";
    } else {
        scrollTopBtn.style.display = "none";
    }
};

// Scroll smoothly to top when clicked
scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Voice Search Functionality
let recognition = null;
let isListening = false;

function initializeSpeechRecognition() {
  // Check if browser supports Speech Recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure speech recognition
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Event listeners for speech recognition
    recognition.onstart = function() {
      console.log('Voice recognition started');
      isListening = true;
      updateVoiceSearchUI('listening');
    };
    
    recognition.onresult = function(event) {
      let transcript = '';
      let isFinal = false;
      
      // Get the transcript from the speech recognition results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }
      
      // Update the transcript display
      document.getElementById('voiceTranscript').textContent = transcript || 'Say something...';
      
      // If final result, perform search
      if (isFinal && transcript.trim()) {
        console.log('Final transcript:', transcript);
        performVoiceSearch(transcript.trim());
      }
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      updateVoiceSearchUI('error');
      
      // Handle different error types
      let errorMessage = 'Voice search failed. Please try again.';
      switch(event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
      }
      
      document.getElementById('voiceStatusText').textContent = errorMessage;
      setTimeout(() => {
        stopVoiceSearch();
      }, 2000);
    };
    
    recognition.onend = function() {
      console.log('Voice recognition ended');
      isListening = false;
      updateVoiceSearchUI('idle');
    };
    
    return true;
  } else {
    console.log('Speech Recognition not supported');
    return false;
  }
}

function startVoiceSearch() {
  // Initialize speech recognition if not already done
  if (!recognition) {
    if (!initializeSpeechRecognition()) {
      alert('Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
  }
  
  // Check if already listening
  if (isListening) {
    stopVoiceSearch();
    return;
  }
  
  // Show the voice search modal
  const modal = document.getElementById('voiceSearchModal');
  modal.style.display = 'flex';
  
  // Reset UI
  document.getElementById('voiceStatusText').textContent = 'Listening...';
  document.getElementById('voiceTranscript').textContent = 'Say something...';
  
  // Start speech recognition
  try {
    recognition.start();
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    alert('Failed to start voice search. Please try again.');
    stopVoiceSearch();
  }
}

function stopVoiceSearch() {
  // Stop speech recognition
  if (recognition && isListening) {
    recognition.stop();
  }
  
  // Hide the modal
  const modal = document.getElementById('voiceSearchModal');
  modal.style.display = 'none';
  
  // Reset button state
  updateVoiceSearchUI('idle');
  isListening = false;
}

function updateVoiceSearchUI(state) {
  const voiceButton = document.getElementById('voiceSearchButton');
  
  // Remove all state classes
  voiceButton.classList.remove('listening', 'error');
  
  switch(state) {
    case 'listening':
      voiceButton.classList.add('listening');
      document.getElementById('voiceStatusText').textContent = 'Listening...';
      break;
    case 'error':
      voiceButton.classList.add('error');
      break;
    case 'idle':
    default:
      // Default state - no additional classes needed
      break;
  }
}

function performVoiceSearch(transcript) {
  // Set the search input value
  document.getElementById('searchInput').value = transcript;
  
  // Close the voice search modal
  stopVoiceSearch();
  
  // Perform the search
  searchVideos();
  
  // Show success message (optional)
  console.log('Voice search performed for:', transcript);
}

// Initialize voice search when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize speech recognition
  initializeSpeechRecognition();
  
  // Add keyboard shortcut for voice search (Ctrl/Cmd + Shift + V)
  document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
      event.preventDefault();
      startVoiceSearch();
    }
  });
  
  // Close modal when clicking outside
  document.getElementById('voiceSearchModal').addEventListener('click', function(event) {
    if (event.target === this) {
      stopVoiceSearch();
    }
  });
  
  // Initialize keyboard shortcuts
  initializeKeyboardShortcuts();
});

// Keyboard Shortcuts Functionality
function initializeKeyboardShortcuts() {
  let shortcutsVisible = false;
  
  document.addEventListener('keydown', function(event) {
    // Ignore shortcuts if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      // Allow Escape to work even in input fields
      if (event.key === 'Escape') {
        event.target.blur();
      }
      return;
    }
    
    // Keyboard shortcuts
    switch(event.key.toLowerCase()) {
      case '/':
        // Focus search bar
        event.preventDefault();
        document.getElementById('searchInput').focus();
        break;
        
      case 'escape':
        // Close modals or blur search
        if (document.getElementById('voiceSearchModal').style.display === 'flex') {
          stopVoiceSearch();
        } else {
          document.activeElement.blur();
        }
        break;
        
      case 'd':
        // Toggle dark mode
        toggleDarkMode();
        break;
        
      case 's':
        // Scroll to search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults && searchResults.children.length > 0) {
          searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
        
      case 'h':
        // Scroll to top (Home)
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
        
      case 'p':
        // Toggle Picture-in-Picture: work whether iframe is in main or mini container
        const videoPlayer = document.getElementById('videoPlayer');
        const miniPlayerIframe = document.querySelector('.mini-player-video iframe');
        if ((videoPlayer && videoPlayer.src && videoPlayer.src !== '') || miniPlayerIframe) {
          togglePictureInPicture();
        }
        break;
        
      case '?':
        // Toggle keyboard shortcuts help
        event.preventDefault();
        toggleKeyboardShortcutsHelp();
        break;
    }
  });
}

// Helper function to format ISO 8601 duration to readable format
function formatDuration(isoDuration) {
  // Parse ISO 8601 duration format (e.g., PT4M13S, PT1H2M10S, PT45S)
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return '';
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `0:${seconds.toString().padStart(2, '0')}`;
  }
}

// Helper function to format view count
function formatViewCount(count) {
  const num = parseInt(count);
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return num.toString();
  }
}

// Helper function to format upload date
function formatUploadDate(dateString) {
  const uploadDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - uploadDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }
}

function toggleKeyboardShortcutsHelp() {
  let helpModal = document.getElementById('keyboardShortcutsModal');
  
  if (!helpModal) {
    // Create the modal if it doesn't exist
    helpModal = document.createElement('div');
    helpModal.id = 'keyboardShortcutsModal';
    helpModal.className = 'keyboard-shortcuts-modal';
    helpModal.innerHTML = `
      <div class="keyboard-shortcuts-content">
        <div class="shortcuts-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button class="shortcuts-close-btn" onclick="toggleKeyboardShortcutsHelp()">×</button>
        </div>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="shortcut-key">/</span>
            <span class="shortcut-description">Focus search bar</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">D</span>
            <span class="shortcut-description">Toggle dark mode</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">S</span>
            <span class="shortcut-description">Scroll to search results</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">H</span>
            <span class="shortcut-description">Scroll to top (Home)</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">P</span>
            <span class="shortcut-description">Toggle Picture-in-Picture</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">Esc</span>
            <span class="shortcut-description">Close modals / Blur search</span>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-key">?</span>
            <span class="shortcut-description">Show/hide this help</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(helpModal);
    
    // Close when clicking outside
    helpModal.addEventListener('click', function(event) {
      if (event.target === this) {
        toggleKeyboardShortcutsHelp();
      }
    });
  }
  
  // Toggle visibility
  if (helpModal.style.display === 'flex') {
    helpModal.style.display = 'none';
  } else {
    helpModal.style.display = 'flex';
  }
}

// Enable horizontal scroll for related videos on mobile
const relatedVideosContainer = document.getElementById('relatedVideos');
if (relatedVideosContainer) {
    relatedVideosContainer.style.display = 'flex';
    relatedVideosContainer.style.overflowX = 'auto';
}
// ===== PICTURE-IN-PICTURE FUNCTIONALITY =====
let isPiPActive = false;
let miniPlayerDragData = { isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 };

function togglePictureInPicture() {
  const mainPlayer = document.getElementById('videoPlayer');
  const miniPlayer = document.getElementById('miniPlayer');
  const videoTitle = document.getElementById('videoTitle').textContent;
  const miniPlayerTitle = document.getElementById('miniPlayerTitle');

  // If there's no video playing, abort
  if (!mainPlayer || !mainPlayer.src || mainPlayer.src === '') {
    alert('Please play a video first!');
    return;
  }

  if (!isPiPActive) {
    // Activate PiP mode by moving the iframe to mini player
    const miniVideoContainer = document.querySelector('.mini-player-video');

    // Update title
    miniPlayerTitle.textContent = videoTitle || 'Now Playing';

    // Move the iframe element to mini player (preserves playback)
    if (mainPlayer && miniVideoContainer) {
      miniVideoContainer.appendChild(mainPlayer);
    }

    // Show mini player
    miniPlayer.style.display = 'block';
    miniPlayer.classList.add('active');
    document.querySelector('.video-section').classList.add('pip-active');

    isPiPActive = true;
    initializeMiniPlayerDrag();
    updatePipButton(true);
  } else {
    // Deactivate PiP mode (maximize)
    maximizeMiniPlayer();
  }
}

function maximizeMiniPlayer() {
  const miniPlayer = document.getElementById('miniPlayer');
  const miniVideoContainer = document.querySelector('.mini-player-video');
  const videoSection = document.querySelector('.video-section');
  const videoWrapper = document.getElementById('videoWrapper');

  if (!isPiPActive) return;

  // Move the iframe back into the main player container
  const iframeNode = miniVideoContainer ? miniVideoContainer.querySelector('iframe') : null;
  if (iframeNode && videoWrapper) {
    videoWrapper.appendChild(iframeNode);
  }

  // Hide mini player with animation
  miniPlayer.classList.add('closing');
  miniPlayer.classList.remove('active');
  setTimeout(() => {
    miniPlayer.style.display = 'none';
    miniPlayer.classList.remove('closing');
  }, 300);

  // Show main video section
  videoSection.classList.remove('pip-active');
  videoWrapper.classList.add('show');

  isPiPActive = false;
  updatePipButton(false);

  // Scroll to video
  videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeMiniPlayer() {
  const miniPlayer = document.getElementById('miniPlayer');
  const miniVideoContainer = document.querySelector('.mini-player-video');
  const videoSection = document.querySelector('.video-section');

  if (!isPiPActive) return;

  // Remove the iframe from mini player (stops playback)
  const iframeNode = miniVideoContainer ? miniVideoContainer.querySelector('iframe') : null;
  if (iframeNode) {
    iframeNode.remove();
    
    // Recreate a fresh iframe in the main player for future plays
    const newIframe = document.createElement('iframe');
    newIframe.id = 'videoPlayer';
    newIframe.setAttribute('frameborder', '0');
    newIframe.setAttribute('allowfullscreen', '');
    const videoWrapper = document.getElementById('videoWrapper');
    if (videoWrapper) videoWrapper.appendChild(newIframe);
  }

  // Hide mini player with animation
  miniPlayer.classList.add('closing');
  miniPlayer.classList.remove('active');
  setTimeout(() => {
    miniPlayer.style.display = 'none';
    miniPlayer.classList.remove('closing');
  }, 300);

  // Update state
  videoSection.classList.remove('pip-active');
  isPiPActive = false;
  updatePipButton(false);
}

function updatePipButton(isActive) {
  const pipButton = document.getElementById('pipButton');
  if (!pipButton) return;
  
  const icon = pipButton.querySelector('.material-symbols-outlined');
  if (isActive) {
    icon.textContent = 'picture_in_picture_off';
    pipButton.title = 'Exit Picture-in-Picture';
  } else {
    icon.textContent = 'picture_in_picture_alt';
    pipButton.title = 'Picture-in-Picture';
  }
}

// Mini Player Drag Functionality
function initializeMiniPlayerDrag() {
  const miniPlayer = document.getElementById('miniPlayer');
  const header = document.getElementById('miniPlayerHeader');
  
  if (!header) return;
  
  header.addEventListener('mousedown', startDragging);
  header.addEventListener('touchstart', startDragging);
}

function startDragging(e) {
  const miniPlayer = document.getElementById('miniPlayer');
  
  miniPlayerDragData.isDragging = true;
  miniPlayer.classList.add('dragging');
  
  // Get initial positions
  const rect = miniPlayer.getBoundingClientRect();
  miniPlayerDragData.initialX = rect.left;
  miniPlayerDragData.initialY = rect.top;
  
  // Get cursor/touch position
  if (e.type === 'touchstart') {
    miniPlayerDragData.startX = e.touches[0].clientX;
    miniPlayerDragData.startY = e.touches[0].clientY;
  } else {
    miniPlayerDragData.startX = e.clientX;
    miniPlayerDragData.startY = e.clientY;
  }
  
  // Add event listeners
  document.addEventListener('mousemove', dragMiniPlayer);
  document.addEventListener('touchmove', dragMiniPlayer);
  document.addEventListener('mouseup', stopDragging);
  document.addEventListener('touchend', stopDragging);
  
  e.preventDefault();
}

function dragMiniPlayer(e) {
  if (!miniPlayerDragData.isDragging) return;
  
  const miniPlayer = document.getElementById('miniPlayer');
  
  // Get current cursor/touch position
  let currentX, currentY;
  if (e.type === 'touchmove') {
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
  } else {
    currentX = e.clientX;
    currentY = e.clientY;
  }
  
  // Calculate new position
  const deltaX = currentX - miniPlayerDragData.startX;
  const deltaY = currentY - miniPlayerDragData.startY;
  
  let newX = miniPlayerDragData.initialX + deltaX;
  let newY = miniPlayerDragData.initialY + deltaY;
  
  // Keep within viewport bounds
  const maxX = window.innerWidth - miniPlayer.offsetWidth;
  const maxY = window.innerHeight - miniPlayer.offsetHeight;
  
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));
  
  // Apply position
  miniPlayer.style.left = newX + 'px';
  miniPlayer.style.top = newY + 'px';
  miniPlayer.style.right = 'auto';
  miniPlayer.style.bottom = 'auto';
  
  e.preventDefault();
}

function stopDragging() {
  const miniPlayer = document.getElementById('miniPlayer');
  
  miniPlayerDragData.isDragging = false;
  miniPlayer.classList.remove('dragging');
  
  // Remove event listeners
  document.removeEventListener('mousemove', dragMiniPlayer);
  document.removeEventListener('touchmove', dragMiniPlayer);
  document.removeEventListener('mouseup', stopDragging);
  document.removeEventListener('touchend', stopDragging);
}

// Add PiP button visibility when video is playing
document.addEventListener('DOMContentLoaded', function() {
  const videoWrapper = document.getElementById('videoWrapper');
  
  if (videoWrapper) {
    // Show PiP button when hovering over video
    videoWrapper.addEventListener('mouseenter', function() {
      const pipButton = document.getElementById('pipButton');
      const hasMainIframe = document.getElementById('videoPlayer') !== null && document.getElementById('videoPlayer').src && document.getElementById('videoPlayer').src !== '';
      const hasMiniIframe = document.querySelector('.mini-player-video iframe') !== null;
      if (pipButton && (hasMainIframe || hasMiniIframe)) {
        pipButton.style.opacity = '1';
      }
    });
  }
});

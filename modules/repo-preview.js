// GitHub Enhancer - Repo Preview Module
// Shows GitHub repo link hover previews with stars, description, language
(function() {
  'use strict';

  const GH = window.GitHubEnhancer = window.GitHubEnhancer || {};

  // Cache for repo data
  const repoPreviewCache = {
    data: {},
    requestCount: 0,
    requestWindowStart: Date.now(),

    get(repoKey) {
      if (this.data[repoKey]) return this.data[repoKey];

      try {
        const cached = localStorage.getItem(`gh-enhancer-repo-${repoKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            this.data[repoKey] = parsed.data;
            return parsed.data;
          }
        }
      } catch (e) {}
      return null;
    },

    set(repoKey, data) {
      this.data[repoKey] = data;
      try {
        localStorage.setItem(`gh-enhancer-repo-${repoKey}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {}
    },

    canRequest() {
      const now = Date.now();
      if (now - this.requestWindowStart > 60 * 60 * 1000) {
        this.requestCount = 0;
        this.requestWindowStart = now;
      }
      return this.requestCount < 50;
    },

    incrementRequests() {
      this.requestCount++;
    }
  };

  const pendingFetches = {};

  async function fetchRepoData(owner, repo) {
    const repoKey = `${owner}/${repo}`;

    const cached = repoPreviewCache.get(repoKey);
    if (cached) return cached;

    if (pendingFetches[repoKey]) {
      return pendingFetches[repoKey];
    }

    if (!repoPreviewCache.canRequest()) {
      return null;
    }

    pendingFetches[repoKey] = (async () => {
      try {
        repoPreviewCache.incrementRequests();
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            repoPreviewCache.set(repoKey, { notFound: true });
          }
          return null;
        }

        const data = await response.json();
        const repoData = {
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          topics: data.topics?.slice(0, 3) || [],
          isArchived: data.archived,
          isFork: data.fork,
          updatedAt: data.updated_at,
          owner: {
            avatar: data.owner.avatar_url,
            type: data.owner.type
          }
        };

        repoPreviewCache.set(repoKey, repoData);
        return repoData;
      } catch (e) {
        console.error('[GitHub Enhancer] Failed to fetch repo data:', e);
        return null;
      } finally {
        delete pendingFetches[repoKey];
      }
    })();

    return pendingFetches[repoKey];
  }

  const languageColors = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'C++': '#f34b7d',
    'C': '#555555',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'Dart': '#00B4AB',
    'Vue': '#41b883',
    'CSS': '#563d7c',
    'HTML': '#e34c26',
    'Shell': '#89e051',
    'Scala': '#c22d40',
    'Elixir': '#6e4a7e'
  };

  function createRepoPreviewPopup(data, rect) {
    const popup = document.createElement('div');
    popup.className = 'gh-enhancer-repo-preview';

    const langColor = data.language ? (languageColors[data.language] || '#8b949e') : null;
    const [owner, repo] = data.name.split('/');
    const repoUrl = `https://github.com/${data.name}`;

    popup.innerHTML = `
      <div class="gh-enhancer-repo-preview-header">
        <a href="https://github.com/${owner}" class="gh-enhancer-repo-preview-avatar-link" title="${owner}">
          <img class="gh-enhancer-repo-preview-avatar" src="${data.owner.avatar}&s=32" alt="" width="16" height="16">
        </a>
        <a href="${repoUrl}" class="gh-enhancer-repo-preview-name">${data.name}</a>
        ${data.isArchived ? '<span class="gh-enhancer-repo-preview-badge gh-enhancer-repo-archived">Archived</span>' : ''}
        ${data.isFork ? '<span class="gh-enhancer-repo-preview-badge gh-enhancer-repo-fork">Fork</span>' : ''}
      </div>
      ${data.description ? `<p class="gh-enhancer-repo-preview-desc">${data.description}</p>` : ''}
      <div class="gh-enhancer-repo-preview-stats">
        <a href="${repoUrl}/stargazers" class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-stat-link" title="Stars">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          ${GH.utils.formatNumber(data.stars)}
        </a>
        <a href="${repoUrl}/forks" class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-stat-link" title="Forks">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
          </svg>
          ${GH.utils.formatNumber(data.forks)}
        </a>
        ${data.language ? `
          <a href="${repoUrl}/search?l=${encodeURIComponent(data.language.toLowerCase())}" class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-stat-link gh-enhancer-repo-preview-lang" title="Search ${data.language} files">
            <span class="gh-enhancer-repo-preview-lang-dot" style="background: ${langColor}"></span>
            ${data.language}
          </a>
        ` : ''}
        <span class="gh-enhancer-repo-preview-stat gh-enhancer-repo-preview-updated" title="Last updated">
          Updated ${GH.utils.timeAgo(data.updatedAt)}
        </span>
      </div>
      ${data.topics.length > 0 ? `
        <div class="gh-enhancer-repo-preview-topics">
          ${data.topics.map(t => `<a href="https://github.com/topics/${encodeURIComponent(t)}" class="gh-enhancer-repo-preview-topic">${t}</a>`).join('')}
        </div>
      ` : ''}
    `;

    document.body.appendChild(popup);

    const popupRect = popup.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 8;

    if (left + popupRect.width > window.innerWidth - 16) {
      left = window.innerWidth - popupRect.width - 16;
    }
    if (left < 16) left = 16;

    if (top + popupRect.height > window.innerHeight + window.scrollY - 16) {
      top = rect.top + window.scrollY - popupRect.height - 8;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    return popup;
  }

  function addGitHubRepoLinkPreviews() {
    const readme = GH.utils.findReadme();
    if (!readme) return;

    const repoLinkPattern = /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?$/;

    const links = readme.querySelectorAll('a[href*="github.com"]');
    let currentPreview = null;
    let hoverTimeout = null;
    let leaveTimeout = null;

    links.forEach(link => {
      if (link.dataset.ghEnhancerRepoPreview) return;

      const href = link.getAttribute('href');
      const match = href?.match(repoLinkPattern);
      if (!match) return;

      const [, owner, repo] = match;

      const currentPath = window.location.pathname;
      if (currentPath === `/${owner}/${repo}` || currentPath === `/${owner}/${repo}/`) return;

      link.dataset.ghEnhancerRepoPreview = 'true';
      link.classList.add('gh-enhancer-repo-link');

      link.addEventListener('mouseenter', async () => {
        clearTimeout(leaveTimeout);

        hoverTimeout = setTimeout(async () => {
          const data = await fetchRepoData(owner, repo);

          if (!data || data.notFound) return;

          if (currentPreview) {
            currentPreview.remove();
            currentPreview = null;
          }

          const rect = link.getBoundingClientRect();
          currentPreview = createRepoPreviewPopup(data, rect);

          currentPreview.addEventListener('mouseenter', () => {
            clearTimeout(leaveTimeout);
          });

          currentPreview.addEventListener('mouseleave', () => {
            leaveTimeout = setTimeout(() => {
              if (currentPreview) {
                currentPreview.remove();
                currentPreview = null;
              }
            }, 100);
          });
        }, 300);
      });

      link.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        leaveTimeout = setTimeout(() => {
          if (currentPreview) {
            currentPreview.remove();
            currentPreview = null;
          }
        }, 100);
      });
    });
  }

  function init() {
    addGitHubRepoLinkPreviews();
  }

  function reset() {
    document.querySelectorAll('.gh-enhancer-repo-preview').forEach(el => el.remove());
  }

  GH.repoPreview = { init, reset };
})();

const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  C: '#555555', 'C++': '#f34b7d', 'C#': '#178600', HTML: '#e34c26',
  CSS: '#563d7c', Shell: '#89e051', Dockerfile: '#384d54',
  Java: '#b07219', Rust: '#dea584', Go: '#00ADD8', Ruby: '#701516',
  PHP: '#4F5D95', Swift: '#f05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  Lua: '#000080', Scala: '#c22d40', Zig: '#ec915c', Julia: '#a270ba',
  Vue: '#41b883', Svelte: '#ff3e00', R: '#198ce7',
};

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

const FETCH_OPTIONS = { headers: { Accept: 'application/vnd.github.v3+json' } };

async function json(url) {
  const res = await fetch(url, FETCH_OPTIONS);
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

export async function renderGitHubSection(username = 'mowardan') {
  const root = document.getElementById('github-section');
  if (!root) return;
  root.innerHTML = '<div class="gh-loading"><span class="gh-spinner"></span>Syncing GitHub...</div>';

  try {
    const [user, repos] = await Promise.all([
      json(`https://api.github.com/users/${username}`),
      json(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=100&type=public`),
    ]);

    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    const topRepos = repos.slice(0, 6);

    const reposWithLangs = await Promise.all(
      topRepos.map(async (r) => {
        try { return { ...r, languages: await json(r.languages_url) }; }
        catch { return { ...r, languages: {} }; }
      })
    );

    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);

    let contribData = null;
    let recentEvents = [];

    if (GITHUB_TOKEN) {
      try { contribData = await fetchContributionsGraphQL(username); }
      catch {}
    }

    if (!contribData) {
      try {
        const events = await json(`https://api.github.com/users/${username}/events?per_page=15`);
        recentEvents = events.filter(e =>
          e.type === 'PushEvent' || e.type === 'PullRequestEvent' ||
          e.type === 'IssuesEvent' || e.type === 'CreateEvent' ||
          e.type === 'ForkEvent'
        ).slice(0, 10);
      } catch {}
    }

    root.innerHTML = (
      renderStats(user, totalStars) +
      (contribData ? renderContributionGraph(contribData) : renderRecentActivity(recentEvents)) +
      renderRepos(reposWithLangs) +
      `<a href="https://github.com/${username}" target="_blank" class="btn secondary gh-profile-link">View Full Profile \u2192</a>`
    );
  } catch {
    root.innerHTML = `<div class="gh-loading gh-error"><p>Could not load GitHub data.</p><a href="https://github.com/${username}" target="_blank" class="btn secondary">Visit GitHub \u2192</a></div>`;
  }
}

async function fetchContributionsGraphQL(username) {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays { contributionCount date }
          }
        }
      }
    }
  }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  const jsonRes = await res.json();
  if (jsonRes.errors) throw new Error(jsonRes.errors[0].message);

  const data = {};
  for (const week of jsonRes.data.user.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      data[day.date] = day.contributionCount;
    }
  }
  return data;
}

function renderStats(user, totalStars) {
  return `<div class="gh-stats">
    <div class="gh-stat"><strong>${user.public_repos}</strong><span>Repositories</span></div>
    <div class="gh-stat"><strong>${totalStars}</strong><span>Stars</span></div>
    <div class="gh-stat"><strong>${user.followers}</strong><span>Followers</span></div>
    <div class="gh-stat"><strong>${user.following}</strong><span>Following</span></div>
  </div>`;
}

function renderContributionGraph(contribData) {
  const today = new Date();
  const days = [];

  for (let i = 174; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const count = contribData[key] || 0;
    const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 8 ? 2 : count <= 15 ? 3 : 4;
    days.push({ level, count, date: key });
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = [];
  let col = new Array(7).fill(null);

  days.forEach((d, i) => {
    const dow = new Date(d.date).getDay();
    col[dow] = d;
    if (dow === 6 || i === days.length - 1) {
      weeks.push(col);
      col = new Array(7).fill(null);
    }
  });

  return `<div class="gh-contrib">
    <div class="gh-contrib-header">
      <span>${Object.keys(contribData).length} contributions in the last year</span>
      <div class="gh-contrib-legend">
        <span>Less</span>
        <span class="gh-cell gh-cell--0"></span>
        <span class="gh-cell gh-cell--1"></span>
        <span class="gh-cell gh-cell--2"></span>
        <span class="gh-cell gh-cell--3"></span>
        <span class="gh-cell gh-cell--4"></span>
        <span>More</span>
      </div>
    </div>
    <div class="gh-contrib-grid">
      <div class="gh-contrib-labels">
        ${dayNames.map(n => `<span class="gh-row-label">${n}</span>`).join('')}
      </div>
      <div class="gh-contrib-cells">
        ${weeks.map(w =>
          `<div class="gh-week">${w.map(c =>
            c ? `<span class="gh-cell gh-cell--${c.level}" title="${c.date}: ${c.count} contributions"></span>`
              : `<span class="gh-cell gh-cell--none"></span>`
          ).join('')}</div>`
        ).join('')}
      </div>
    </div>
  </div>`;
}

function renderRecentActivity(events) {
  if (!events.length) return '';

  const icons = {
    PushEvent: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25A2.25 2.25 0 013.75 1h8.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-8.5A2.25 2.25 0 011.5 13V3.25zM3.75 2.5a.75.75 0 00-.75.75v.5h10v-.5a.75.75 0 00-.75-.75h-8.5zm10 3H3v7.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-7.5z"/></svg>`,
    PullRequestEvent: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.25 2.25 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854V2.5h1A2.5 2.5 0 0113.5 5v5.628a2.251 2.251 0 11-1.5 0V5a1 1 0 00-1-1h-1v1.646a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5zm8 0a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg>`,
    IssuesEvent: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"/></svg>`,
    CreateEvent: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/></svg>`,
    ForkEvent: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0z"/></svg>`,
  };

  function formatEvent(e) {
    switch (e.type) {
      case 'PushEvent':
        return `Pushed to <strong>${e.repo.name}</strong>`;
      case 'PullRequestEvent':
        return `${e.payload.action === 'opened' ? 'Opened' : e.payload.action === 'closed' && e.payload.pull_request?.merged ? 'Merged' : e.payload.action === 'closed' ? 'Closed' : e.payload.action} PR in <strong>${e.repo.name}</strong>`;
      case 'IssuesEvent':
        return `${e.payload.action === 'opened' ? 'Opened' : e.payload.action} issue in <strong>${e.repo.name}</strong>`;
      case 'CreateEvent':
        return `Created ${e.payload.ref_type}${e.payload.ref ? ` <em>${e.payload.ref}</em>` : ''} in <strong>${e.repo.name}</strong>`;
      case 'ForkEvent':
        return `Forked <strong>${e.repo.name}</strong>`;
      default:
        return `Activity in <strong>${e.repo.name}</strong>`;
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return `<div class="gh-contrib">
    <div class="gh-contrib-header">
      <span>Recent Activity</span>
    </div>
    <div class="gh-activity">
      ${events.map(e => `
        <a href="https://github.com/${e.repo.name}" target="_blank" class="gh-activity-item">
          <span class="gh-activity-icon">${icons[e.type] || ''}</span>
          <span class="gh-activity-msg">${formatEvent(e)}</span>
          <span class="gh-activity-time">${timeAgo(e.created_at)}</span>
        </a>
      `).join('')}
    </div>
  </div>`;
}

function renderRepos(repos) {
  if (!repos.length) return '';
  return `<div class="gh-repos">
    <h3 class="gh-repos-title">Top Repositories</h3>
    <div class="gh-repos-grid">${repos.map(renderRepoCard).join('')}</div>
  </div>`;
}

function renderRepoCard(r) {
  const langs = Object.entries(r.languages);
  const total = langs.reduce((s, [, v]) => s + v, 0);

  const bars = langs.length
    ? `<div class="gh-lang-bars">${langs.map(([n, v]) =>
      `<span class="gh-lang-bar" style="width:${(v / total * 100).toFixed(1)}%;background:${LANG_COLORS[n] || '#6b7280'}" title="${n}: ${(v / total * 100).toFixed(1)}%"></span>`
    ).join('')}</div>
      <div class="gh-lang-labels">${langs.slice(0, 4).map(([n]) =>
        `<span class="gh-lang-label"><span class="gh-lang-dot" style="background:${LANG_COLORS[n] || '#6b7280'}"></span>${n}</span>`
      ).join('')}${langs.length > 4 ? `<span class="gh-lang-label">+${langs.length - 4}</span>` : ''}</div>`
    : '';

  return `<a href="${r.html_url}" target="_blank" class="gh-repo-card">
    <div class="gh-repo-header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>
      <span class="gh-repo-name">${r.name}</span>
    </div>
    ${r.description ? `<p class="gh-repo-desc">${r.description}</p>` : ''}
    <div class="gh-repo-meta">
      ${langs.length ? `<span class="gh-repo-primary-lang"><span class="gh-lang-dot" style="background:${LANG_COLORS[langs[0][0]] || '#6b7280'}"></span>${langs[0][0]}</span>` : ''}
      <span><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg> ${r.stargazers_count}</span>
      <span><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM3.5 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm9 0a.75.75 0 100 1.5.75.75 0 000-1.5zM6.5 12.5a.75.75 0 100 1.5.75.75 0 000-1.5z"/></svg> ${r.forks_count}</span>
    </div>
    ${bars}
  </a>`;
}

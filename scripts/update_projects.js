// scripts/update_projects.js
// Place this file at: scripts/update_projects.js

const fs = require('fs');

const USERNAME = process.env.GITHUB_USERNAME || 'DilipHS';
const TOKEN = process.env.GITHUB_TOKEN;

const SKIP_REPOS = [USERNAME]; // skip the profile repo itself

const LANG_COLORS = {
  JavaScript: '🟨', Java: '🟧', Python: '🐍',
  HTML: '🟥', CSS: '🟦', TypeScript: '🔷', default: '⬜'
};

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
    { headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'readme-bot' } }
  );
  const repos = await res.json();
  return repos
    .filter(r => !r.fork && !r.private && !SKIP_REPOS.includes(r.name))
    .sort((a, b) => (b.stargazers_count - a.stargazers_count) || new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8); // show top 8 repos
}

function buildTable(repos) {
  if (!repos.length) return '_No public repositories yet._\n';

  let table = '| Project | Description | Language | Stars |\n';
  table    += '|---|---|---|---|\n';

  for (const repo of repos) {
    const name  = `[${repo.name}](${repo.html_url})`;
    const desc  = (repo.description || '_No description_').replace(/\|/g, '\\|');
    const lang  = repo.language || 'N/A';
    const icon  = LANG_COLORS[lang] || LANG_COLORS.default;
    const stars = repo.stargazers_count > 0 ? `⭐ ${repo.stargazers_count}` : '—';
    table += `| ${name} | ${desc} | ${icon} ${lang} | ${stars} |\n`;
  }

  return table;
}

async function main() {
  const repos = await fetchRepos();
  const table = buildTable(repos);

  const readme = fs.readFileSync('README.md', 'utf8');
  const updated = readme.replace(
    /<!-- AUTO-PROJECTS-START -->[\s\S]*?<!-- AUTO-PROJECTS-END -->/,
    `<!-- AUTO-PROJECTS-START -->\n<!-- This section is updated automatically by GitHub Actions. Do not edit manually. -->\n\n${table}\n<!-- AUTO-PROJECTS-END -->`
  );

  fs.writeFileSync('README.md', updated);
  console.log(`✓ Updated projects section with ${repos.length} repos.`);
}

main().catch(err => { console.error(err); process.exit(1); });

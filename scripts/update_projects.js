// scripts/update_projects.js

const fs = require('fs');

const USERNAME = process.env.GITHUB_USERNAME || 'DilipHS';
const TOKEN    = process.env.GITHUB_TOKEN;
const HEADERS  = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'readme-bot' };
const SKIP     = [USERNAME];

// ── Badge map: add more here as you learn new tech ──────────────────────────
const BADGE_MAP = {
  // Languages
  'Java':        'https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white',
  'JavaScript':  'https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black',
  'TypeScript':  'https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white',
  'Python':      'https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white',
  'C':           'https://img.shields.io/badge/C-A8B9CC?style=for-the-badge&logo=c&logoColor=black',
  'C++':         'https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=cplusplus&logoColor=white',
  'C#':          'https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white',
  'HTML':        'https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white',
  'CSS':         'https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white',
  'Shell':       'https://img.shields.io/badge/Shell-121011?style=for-the-badge&logo=gnu-bash&logoColor=white',
  'Kotlin':      'https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white',
  'Swift':       'https://img.shields.io/badge/Swift-FA7343?style=for-the-badge&logo=swift&logoColor=white',
  'Dart':        'https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white',
  'Go':          'https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white',
  'Rust':        'https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white',
  'Ruby':        'https://img.shields.io/badge/Ruby-CC342D?style=for-the-badge&logo=ruby&logoColor=white',
  'PHP':         'https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white',
  // Tools always shown (pinned)
  'SQL':         'https://img.shields.io/badge/SQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white',
  'Git':         'https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white',
  'GitHub':      'https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white',
};

// These always appear even if not detected in repos
const PINNED = ['SQL', 'Git', 'GitHub'];

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
    { headers: HEADERS }
  );
  return (await res.json()).filter(r => !r.fork && !r.private && !SKIP.includes(r.name));
}

async function fetchLanguages(repo) {
  const res = await fetch(repo.languages_url, { headers: HEADERS });
  return Object.keys(await res.json());
}

async function buildTechStack(repos) {
  const detected = new Set(PINNED);

  // Fetch languages from all repos in parallel
  const allLangs = await Promise.all(repos.map(fetchLanguages));
  allLangs.flat().forEach(lang => detected.add(lang));

  const badges = [...detected]
    .filter(lang => BADGE_MAP[lang])
    .map(lang => `  <img src="${BADGE_MAP[lang]}"/>`)
    .join('\n');

  return `<p>\n${badges}\n</p>`;
}

async function buildProjectsTable(repos) {
  const LANG_ICONS = {
    JavaScript:'🟨', Java:'🟧', Python:'🐍', HTML:'🟥',
    CSS:'🟦', TypeScript:'🔷', default:'⬜'
  };

  const top = repos
    .sort((a,b) => (b.stargazers_count - a.stargazers_count) || new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8);

  if (!top.length) return '_No public repositories yet._\n';

  let table = '| Project | Description | Language | Stars |\n';
  table    += '|---|---|---|---|\n';
  for (const r of top) {
    const name  = `[${r.name}](${r.html_url})`;
    const desc  = (r.description || '_No description_').replace(/\|/g,'\\|');
    const lang  = r.language || 'N/A';
    const icon  = LANG_ICONS[lang] || LANG_ICONS.default;
    const stars = r.stargazers_count > 0 ? `⭐ ${r.stargazers_count}` : '—';
    table += `| ${name} | ${desc} | ${icon} ${lang} | ${stars} |\n`;
  }
  return table;
}

function replace(content, startTag, endTag, newContent) {
  const re = new RegExp(`${startTag}[\\s\\S]*?${endTag}`);
  return content.replace(re, `${startTag}\n${newContent}\n${endTag}`);
}

async function main() {
  const repos = await fetchRepos();

  const [techStack, projectsTable] = await Promise.all([
    buildTechStack(repos),
    buildProjectsTable(repos),
  ]);

  let readme = fs.readFileSync('README.md', 'utf8');
  readme = replace(readme, '<!-- AUTO-TECHSTACK-START -->', '<!-- AUTO-TECHSTACK-END -->', techStack);
  readme = replace(readme, '<!-- AUTO-PROJECTS-START -->', '<!-- AUTO-PROJECTS-END -->', projectsTable);

  fs.writeFileSync('README.md', readme);
  console.log(`✓ Tech stack updated | ✓ Projects updated (${repos.length} repos scanned)`);
}

main().catch(err => { console.error(err); process.exit(1); });

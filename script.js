/* PROGRESS + SCROLL TOP */
const progressBar = document.getElementById('progressBar');
const scrollTopBtn = document.getElementById('scrollTop');
const tocProgressFill = document.getElementById('tocProgressFill');
window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = pct + '%';
  if (tocProgressFill) tocProgressFill.style.width = pct + '%';
  scrollTopBtn.classList.toggle('visible', window.scrollY > 600);
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* THEME */
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('cwc-theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
else if (window.matchMedia('(prefers-color-scheme: light)').matches) document.documentElement.setAttribute('data-theme', 'light');
function updateThemeIcon() { themeToggle.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '◑' : '◐'; }
updateThemeIcon();
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cwc-theme', next);
  updateThemeIcon();
});

/* TOC ACTIVE */
const sections = document.querySelectorAll('section[id]');
const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
const navAnchors = document.querySelectorAll('.nav-links a[data-nav]');
function updateActiveSection() {
  const y = window.scrollY + 120;
  let cur = '';
  sections.forEach(s => { if (s.offsetTop <= y) cur = s.id; });
  tocLinks.forEach(l => l.classList.toggle('toc-active', l.getAttribute('href') === '#' + cur));
  navAnchors.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
}
window.addEventListener('scroll', updateActiveSection);
updateActiveSection();

/* DRAWER */
const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('drawerBackdrop');
const burger = document.getElementById('navBurger');
function openDrawer() { drawer.classList.add('open'); backdrop.classList.add('open'); }
function closeDrawer() { drawer.classList.remove('open'); backdrop.classList.remove('open'); }
burger.addEventListener('click', openDrawer);
backdrop.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
document.getElementById('drawerCmdk').addEventListener('click', e => { e.preventDefault(); closeDrawer(); openCmdk(); });
document.getElementById('drawerPrint').addEventListener('click', e => { e.preventDefault(); closeDrawer(); window.print(); });

/* CMDK */
const cmdkBackdrop = document.getElementById('cmdkBackdrop');
const cmdkInput = document.getElementById('cmdkInput');
const cmdkResults = document.getElementById('cmdkResults');
const cmdTrigger = document.getElementById('cmdTrigger');
function openCmdk() { cmdkBackdrop.classList.add('open'); setTimeout(() => cmdkInput.focus(), 50); }
function closeCmdk() { cmdkBackdrop.classList.remove('open'); cmdkInput.value = ''; filterCmdk(''); }
cmdTrigger.addEventListener('click', openCmdk);
cmdkBackdrop.addEventListener('click', e => { if (e.target === cmdkBackdrop) closeCmdk(); });
window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); }
  if (e.key === 'Escape') { closeCmdk(); closeModal(); }
});
function filterCmdk(q) {
  q = q.trim().toLowerCase();
  cmdkResults.querySelectorAll('.cmdk-item').forEach(it => {
    const match = q === '' || it.textContent.toLowerCase().includes(q);
    it.style.display = match ? 'flex' : 'none';
  });
}
cmdkInput.addEventListener('input', e => filterCmdk(e.target.value));
cmdkResults.querySelectorAll('.cmdk-item').forEach(it => {
  it.addEventListener('click', () => {
    const tgt = document.querySelector(it.dataset.target);
    if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeCmdk();
    const fid = it.dataset.feature;
    if (fid) setTimeout(() => {
      const card = document.querySelector('.feature-card[data-detail="'+fid+'"]');
      if (card) card.click();
    }, 600);
  });
});

/* COMPARATOR */
document.querySelectorAll('.comparator-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.comparator-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const f = tab.dataset.tab;
    document.querySelectorAll('.comparator-row').forEach(r => {
      r.style.display = (f === 'all' || r.dataset.tab === f) ? 'grid' : 'none';
    });
  });
});

/* MATRIX */
const matrixState = { layer: 'all', status: 'all' };
function applyFilters() {
  document.querySelectorAll('#featureGrid .feature-card').forEach(card => {
    const okLayer = matrixState.layer === 'all' || card.dataset.layer === matrixState.layer;
    const okStatus = matrixState.status === 'all' || card.dataset.status === matrixState.status;
    card.classList.toggle('hidden', !(okLayer && okStatus));
  });
}
document.querySelectorAll('.matrix-toolbar .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    if (f.startsWith('layer-')) {
      document.querySelectorAll('.chip[data-filter^="layer-"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      matrixState.layer = f.replace('layer-', '');
    } else if (f.startsWith('status-')) {
      document.querySelectorAll('.chip[data-filter^="status-"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      matrixState.status = f.replace('status-', '');
    }
    applyFilters();
  });
});

/* FEATURE DETAILS */
const featureDetails = {
  'auto-mode': {
    title: 'Auto Mode',
    tags: ['<span class="badge badge-layer-autonomy">Autonomy</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Historiquement, Claude Code s'arrêtait à chaque action (lecture fichier, exécution commande) pour demander la permission. Auto Mode supprime la plupart de ces stops via un double check interne avant action :</p>
    <ul><li><strong>Check 1</strong> — l'action est-elle destructive ?</li><li><strong>Check 2</strong> — ressemble-t-elle à une prompt injection ?</li></ul>
    <p>Si les deux passent, Claude agit et continue. Sinon, chemin alternatif sûr, puis demande à l'humain en dernier recours.</p>
    <h5>Source officielle</h5><p><a href="https://claude.com/blog/code-w-claude-sf-2026-sf" target="_blank" rel="noopener">Building on the AI exponential — Anthropic</a></p>`
  },
  'routines': {
    title: 'Routines',
    tags: ['<span class="badge badge-layer-autonomy">Autonomy</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p><strong>L'annonce DX la plus importante de l'année.</strong> Une routine = une session Claude Code <em>sans humain pour la démarrer</em>. Prompt + repos + connecteurs packagés une fois, exécutés automatiquement sur le cloud Anthropic.</p>
    <h5>Trois types de triggers</h5>
    <pre><code><span class="tok-key">trigger</span>:
  <span class="tok-key">- type</span>: <span class="tok-str">scheduled</span>      <span class="tok-com"># cron</span>
    <span class="tok-key">cron</span>: <span class="tok-str">"0 7 * * 1-5"</span>
  <span class="tok-key">- type</span>: <span class="tok-str">github</span>         <span class="tok-com"># PR, issue, release</span>
    <span class="tok-key">event</span>: <span class="tok-str">pull_request.opened</span>
  <span class="tok-key">- type</span>: <span class="tok-str">api</span>            <span class="tok-com"># HTTP POST</span>
    <span class="tok-key">endpoint</span>: <span class="tok-str">/routines/{id}/run</span></code></pre>
    <h5>Quotas</h5><p>Pro <strong>5/jour</strong> · Max <strong>15/jour</strong> · Team &amp; Enterprise <strong>25/jour</strong>. Disponible Pro+ avec Claude Code Web activé.</p>
    <h5>Source officielle</h5><p><a href="https://claude.com/blog/introducing-routines-in-claude-code" target="_blank" rel="noopener">Introducing Routines in Claude Code</a> · <a href="https://code.claude.com/docs/en/routines" target="_blank" rel="noopener">Docs Routines</a></p>`
  },
  'ci-autofix': {
    title: 'CI Autofix',
    tags: ['<span class="badge badge-layer-autonomy">Autonomy</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Extension de Routines. Surveille une PR de sa création à son merge. Gère automatiquement : code review comments, security flags, conflits de merge, échecs CI flaky.</p>
    <p>Sur la démo Day 1, un timeout réseau a fait échouer la CI → Autofix l'a diagnostiqué comme issue infra connue et a relancé le job. <em>L'engineer qui a ouvert la PR n'a jamais vu le X rouge.</em></p>
    <h5>Détail important</h5><p>Les équipes internes d'Anthropic ont configuré Autofix pour <em>fixer la root cause</em>, pas juste retry. À grande échelle, la distinction compte.</p>`
  },
  'work-trees': {
    title: 'Work Trees (support natif)',
    tags: ['<span class="badge badge-layer-autonomy">Autonomy</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Existait déjà mais c'était cassant. Désormais natif : chaque session Claude Code parallèle sur un même repo a sa copie isolée du projet dans un sous-répertoire. Plus d'agents qui s'écrasent mutuellement les fichiers.</p>
    <pre><code><span class="tok-key">claude</span> --work-tree   <span class="tok-com"># crée et isole automatiquement</span></code></pre>
    <p>Dans l'app Desktop, c'est une simple checkbox à la création de session.</p>`
  },
  'auto-memory': {
    title: 'Auto Memory',
    tags: ['<span class="badge badge-layer-autonomy">Autonomy</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Chaque session démarrait à zéro. Tu ré-expliquais tes préférences, patterns de debug, choix d'architecture. Auto Memory résout ça : Claude prend silencieusement des notes pendant la session (style de code, décisions archi, patterns projet) et les sauve dans un <code>memory.md</code> local.</p>
    <p>Le fichier <strong>ne quitte jamais ta machine</strong>, n'est pas push sur GitHub. Indexé, pas monolithique → progressive discovery, on charge uniquement les mémoires pertinentes.</p>
    <h5>Analogie</h5><p><code>CLAUDE.md</code> = doc d'onboarding que tu donnes à Claude le jour 1. <code>memory.md</code> = carnet que Claude tient en faisant le boulot.</p>`
  },
  'agent-view': {
    title: 'Agent View (CLI)',
    tags: ['<span class="badge badge-layer-visibility">Visibility</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Nouveau top-level view dans le CLI. Un écran. Toutes les sessions, leur statut (running, waiting input, complete). On peut dispatcher des prompts à une session individuelle <strong>sans y entrer</strong>. Les sessions tournent en arrière-plan dans tous les cas.</p>
    <p>Cas d'usage : ce que la team Anthropic appelle <em>« multi-Cloding »</em>. Quand tu fais tourner 5+ sessions, c'est la feature dont tu ne savais pas que tu avais besoin tant que le terminal n'était pas devenu un chaos.</p>`
  },
  'remote-control': {
    title: 'Remote Control',
    tags: ['<span class="badge badge-layer-visibility">Visibility</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Tu lances une session sur ta machine, tu la contrôles depuis l'app mobile Claude ou n'importe quel browser. Push notif quand Claude a besoin d'input, réponse inline depuis ton téléphone.</p>
    <pre><code>{ <span class="tok-str">"remoteControl"</span>: <span class="tok-str">"always"</span> }</code></pre>`
  },
  'desktop': {
    title: 'Desktop App — full rebuild',
    tags: ['<span class="badge badge-layer-visibility">Visibility</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>L'app Desktop a été refondée. Changements clés :</p>
    <ul>
      <li>Sessions <strong>groupées par repo GitHub</strong> → sessions parallèles navigables</li>
      <li>Tu peux voir le <strong>plan généré</strong> pour n'importe quelle conversation passée</li>
      <li>Inline comments sur plans et diffs → renvoyés à Claude comme instructions</li>
      <li>Intégration GitHub native : diffs et file tree sans quitter l'app</li>
    </ul>`
  },
  'tui': {
    title: 'Flicker-Free Terminal (Full Screen TUI)',
    tags: ['<span class="badge badge-layer-visibility">Visibility</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Les longues sessions causaient du flicker car chaque nouvelle sortie déclenchait un repaint complet du scrollback.</p>
    <pre><code><span class="tok-key">/tui</span> fullscreen</code></pre>
    <p>Le nouveau mode virtualise le scrollback (seul ce qui est à l'écran est rendu), <strong>mémoire flat</strong> sur des sessions très longues. Bonus : éléments cliquables dans le terminal.</p>`
  },
  'sandboxes': {
    title: 'Self-Hosted Sandboxes',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Jusqu'ici, quand un Managed Agent exécutait du code, il le faisait dans les sandboxes d'Anthropic. Maintenant : <em>bring your own compute</em>.</p>
    <p>Mécanique : l'agent place un work item dans une queue → ton infra le prend, spin up un sandbox dans <strong>ton</strong> environnement, exécute, renvoie le résultat. Tu contrôles network policies, audit logs, spin up/idle.</p>
    <p>Support first-class au launch : <strong>Cloudflare</strong>, <strong>Daytona</strong>, <strong>Modal</strong>, <strong>Vercel</strong>.</p>
    <p>Pour les équipes avec contraintes compliance ou qui ne peuvent pas laisser l'exécution sortir du VPC, c'est probablement ce qui bloquait l'adoption des Managed Agents.</p>`
  },
  'mcp-tunnels': {
    title: 'MCP Tunnels',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-preview">Research preview</span>'],
    body: `<p>Permet aux Managed Agents d'accéder à des serveurs MCP privés (derrière firewall) <em>sans les exposer sur internet public</em>.</p>
    <p>Setup : tu fais tourner un proxy léger dans ton réseau privé qui établit un tunnel sécurisé vers Anthropic. Les agents appellent ton DW interne, feature flag service, etc. comme un MCP standard. Pas de VPN, pas de network config complexe.</p>
    <pre><code>Claude Managed Agent
      ↓ TLS
Anthropic Platform
      ↓ tunnel
Tunnel Proxy (your VPC)
      ↓
DW · Feature Flags · Internal APIs</code></pre>`
  },
  'security': {
    title: 'Claude Security',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Nouveau produit dédié. Scanne ton codebase <strong>la nuit</strong>, surface les vulnérabilités classées par sévérité, et crée un path direct pour kicker une session Claude Code qui adresse chacune.</p>
    <p>Le contexte : les équipes shippent à vitesse AI, génèrent plus de PRs que la sécu peut review manuellement. Claude Security ferme le gap.</p>`
  },
  'advisor': {
    title: 'Advisor Strategy',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Nouvelle primitive d'API. Pair un <strong>petit executor</strong> (Haiku ou Sonnet) avec un <strong>gros advisor</strong> (Opus) qui n'est activé que sur les cas difficiles.</p>
    <h5>Cas Eve Legal · démontré Day 1</h5>
    <div class="advisor-demo">
      <div class="advisor-row"><span><span class="advisor-tag tag-sonnet">SONNET</span> Lit le contrat (50p)</span><span class="advisor-tag tag-action">cheap · fast</span></div>
      <div class="advisor-row"><span><span class="advisor-tag tag-sonnet">SONNET</span> Classifie : low/medium/high</span><span class="advisor-tag tag-action">cheap · fast</span></div>
      <div class="advisor-row"><span><span class="advisor-tag tag-sonnet">SONNET</span> Détecte signal faible → Opus</span><span class="advisor-tag tag-action">decision</span></div>
      <div class="advisor-row"><span><span class="advisor-tag tag-opus">OPUS</span> Signataire indispo à la date</span><span class="advisor-tag tag-action">expensive · deep</span></div>
      <div class="advisor-row"><span><span class="advisor-tag tag-opus">OPUS</span> Re-classifie : <strong style="color:var(--accent);">AT RISK</strong></span><span class="advisor-tag tag-action">verdict</span></div>
    </div>
    <p><em>Sonnet seul aurait raté le détail. Opus à chaque tour aurait coûté beaucoup plus cher.</em></p>`
  },
  'tool-search': {
    title: 'Tool Search',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Au lieu de charger tout le schéma de tools dans le contexte à chaque tour, Tool Search permet à l'agent de retrieve dynamiquement <em>juste l'outil pertinent</em>. Un meta-tool léger décrit ce qui est dispo ; Claude query pour identifier ce dont il a besoin, puis fetch ce schéma uniquement.</p>
    <p><strong>Résultat reporté par Lovable :</strong> –10% de tokens totaux, performance améliorée. Moins de contexte non pertinent = meilleur signal.</p>`
  },
  'prog-tool': {
    title: 'Programmatic Tool Calling',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Quand un tool retourne un gros résultat, tu n'as probablement pas besoin de tout. Programmatic Tool Calling fait écrire à Claude un <strong>petit script</strong> qui appelle le tool, extrait la portion pertinente, et stream juste ça en contexte.</p>
    <p>Démo : un tool de sales recordings retournait 60min de transcripts complets. Claude a écrit une boucle pour extraire <em>l'aggregate sentiment uniquement</em>. Le bloc massif est devenu quelques lignes pertinentes.</p>`
  },
  'cache': {
    title: 'Automatic Prompt Caching',
    tags: ['<span class="badge badge-layer-infra">Infrastructure</span>', '<span class="badge badge-status-ga">GA</span>'],
    body: `<p>Le prompt caching existait, mais demandait config manuelle des cache breakpoints. Automatic prompt caching gère ça en une ligne.</p>
    <p>Brad Abrams a remis les chiffres en perspective au Day 1 : viser <strong>&gt; 80% de cache hit rate</strong> en prod. Cursor, Replit, Perplexity et Claude Code lui-même tournent dans les 90s. GitHub vise <strong>&gt; 94%</strong> ; un drop à 70% signale typiquement un bug d'assembly.</p>
    <h5>Règles simples</h5><ul><li>Keep unused tool schemas out</li><li>Keep raw tool output out</li><li>Use programmatic tool calling</li></ul>`
  }
};

const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalTags = document.getElementById('modalTags');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
function openModal(detailKey) {
  const d = featureDetails[detailKey];
  if (!d) return;
  modalTitle.textContent = d.title;
  modalTags.innerHTML = d.tags.join(' ');
  modalBody.innerHTML = d.body;
  modalBackdrop.classList.add('open');
}
function closeModal() { modalBackdrop.classList.remove('open'); }
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.detail));
});

/* COPY BUTTONS */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const header = btn.closest('.code-header');
    const pre = header ? header.nextElementSibling : null;
    if (!pre) return;
    navigator.clipboard.writeText(pre.innerText).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copié ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
    }).catch(() => { btn.textContent = 'Erreur'; setTimeout(() => btn.textContent = 'Copier', 1400); });
  });
});

/* GLOSSARY FILTER */
const glossInput = document.getElementById('glossarySearch');
glossInput.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('#glossaryGrid .glossary-term').forEach(t => {
    t.classList.toggle('hidden', q !== '' && !t.textContent.toLowerCase().includes(q));
  });
});

/* KANBAN persistence */
const kanbanKey = 'cwc-kanban-state';
const kanbanState = JSON.parse(localStorage.getItem(kanbanKey) || '{}');
document.querySelectorAll('.kanban-task input[type="checkbox"]').forEach(cb => {
  const id = cb.dataset.task;
  if (kanbanState[id]) { cb.checked = true; cb.closest('.kanban-task').classList.add('done'); }
  cb.addEventListener('change', () => {
    kanbanState[id] = cb.checked;
    localStorage.setItem(kanbanKey, JSON.stringify(kanbanState));
    cb.closest('.kanban-task').classList.toggle('done', cb.checked);
  });
});

/* STEPPER (workshops) */
const stepDetails = document.querySelectorAll('.step-detail');
document.querySelectorAll('.step').forEach(step => {
  step.addEventListener('click', () => {
    const idx = step.dataset.step;
    const detail = document.querySelector('.step-detail[data-step-detail="'+idx+'"]');
    const isOpen = detail && detail.classList.contains('open');
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    stepDetails.forEach(d => d.classList.remove('open'));
    if (!isOpen && detail) {
      step.classList.add('active');
      detail.classList.add('open');
    }
  });
});
// Open first step by default
const firstStep = document.querySelector('.step[data-step="1"]');
if (firstStep) firstStep.click();

/* HARNESS demo */
const harnessAgents = {
  planner: { title: '1. Planner', body: "Décompose un product spec en chunks discrets, tractables. Chaque chunk devient une tâche auto-contenue, avec assez de contexte pour qu'un agent fresh l'exécute à froid. Le Planner ne génère pas de code — il décompose et spécifie." },
  generator: { title: '2. Generator', body: "Prend la sortie du Planner et produit code, tests, configuration CI, documentation. Son job c'est le throughput : générer une sortie correcte étant donné un goal bien spécifié. Pas d'auto-évaluation, juste de la génération." },
  evaluator: { title: '3. Evaluator', body: "Les agents sont mauvais pour évaluer leur propre output (ils surnotent systématiquement). L'Evaluator fournit une évaluation indépendante, dans un contexte séparé. Quand l'output ne passe pas, il pointe précisément ce qui doit changer." }
};
document.querySelectorAll('.harness-agent').forEach(card => {
  card.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.harness-agent').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const data = harnessAgents[card.dataset.agent];
    document.getElementById('harnessDetail').innerHTML = '<strong style="color:var(--text);display:block;margin-bottom:8px;">' + data.title + '</strong>' + data.body;
  });
});

/* EFFORT SLIDER (draggable) */
const sliderTrack = document.getElementById('sliderTrack');
const sliderFill = document.getElementById('sliderFill');
const sliderThumb = document.getElementById('sliderThumb');
const sliderOutput = document.getElementById('sliderOutput');
const effortLevels = [
  { min: 0, max: 25, title: 'Low', desc: 'Speedrun mode. Claude prend des raccourcis, vise le minimum viable. Peut tricher un peu. Utile pour des tâches répétitives sans enjeu.' },
  { min: 25, max: 55, title: 'Default', desc: 'Comportement standard. Plan implicite, exécution directe. Le bon défaut pour 80% des tâches. La plupart des gens chez Anthropic ne le changent pas.' },
  { min: 55, max: 80, title: 'High', desc: 'Plus de planification explicite. Claude découpe en étapes, vérifie ses hypothèses, fait des tool calls supplémentaires. Coût plus élevé mais sortie plus solide.' },
  { min: 80, max: 100, title: 'Extra high', desc: 'Plan ultra-précis. Claude vise le chemin optimal, examine plusieurs approches, raisonne longuement. Réservé aux tâches critiques. Coût significativement plus élevé.' }
];
function setSlider(pct) {
  pct = Math.max(0, Math.min(100, pct));
  sliderFill.style.width = pct + '%';
  sliderThumb.style.left = pct + '%';
  let level = effortLevels[1];
  for (const l of effortLevels) { if (pct >= l.min && pct < l.max) { level = l; break; } }
  if (pct >= 80) level = effortLevels[3];
  sliderOutput.innerHTML = '<strong>' + level.title + '</strong>' + level.desc;
}
let dragging = false;
function updateFromEvent(e) {
  const rect = sliderTrack.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const pct = ((clientX - rect.left) / rect.width) * 100;
  setSlider(pct);
}
sliderTrack.addEventListener('mousedown', e => { dragging = true; updateFromEvent(e); });
window.addEventListener('mousemove', e => { if (dragging) updateFromEvent(e); });
window.addEventListener('mouseup', () => { dragging = false; });
sliderTrack.addEventListener('touchstart', e => { dragging = true; updateFromEvent(e); }, { passive: true });
window.addEventListener('touchmove', e => { if (dragging) updateFromEvent(e); }, { passive: true });
window.addEventListener('touchend', () => { dragging = false; });
setSlider(40);

/* COST CALCULATOR */
const ccCalls = document.getElementById('ccCalls');
const ccHard = document.getElementById('ccHard');
const ccTokens = document.getElementById('ccTokens');
const ccCallsVal = document.getElementById('ccCallsVal');
const ccHardVal = document.getElementById('ccHardVal');
const ccTokensVal = document.getElementById('ccTokensVal');
const ccOpus = document.getElementById('ccOpus');
const ccAdvisor = document.getElementById('ccAdvisor');
const ccSavings = document.getElementById('ccSavings');
// Pricing assumptions per Mtok (input/output approximated as combined avg)
const PRICE = {
  opus_in: 15, opus_out: 75,
  son_in: 3, son_out: 15
};
function fmt(n) { return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }); }
function recalc() {
  const calls = +ccCalls.value;
  const hard = +ccHard.value / 100;
  const tokens = +ccTokens.value;
  // Assume 60% input, 40% output (rough)
  const inTok = tokens * 0.6;
  const outTok = tokens * 0.4;
  const opusPerCall = (inTok * PRICE.opus_in + outTok * PRICE.opus_out) / 1_000_000;
  const sonPerCall = (inTok * PRICE.son_in + outTok * PRICE.son_out) / 1_000_000;
  const opusTotal = calls * opusPerCall;
  const advisorTotal = calls * sonPerCall + calls * hard * opusPerCall;
  const savings = opusTotal - advisorTotal;
  ccCallsVal.textContent = fmt(calls);
  ccHardVal.textContent = (hard * 100).toFixed(0) + '%';
  ccTokensVal.textContent = fmt(tokens);
  ccOpus.textContent = '$' + fmt(opusTotal);
  ccAdvisor.textContent = '$' + fmt(advisorTotal);
  ccSavings.textContent = '−$' + fmt(savings) + ' (' + Math.round((savings / opusTotal) * 100) + '%)';
}
[ccCalls, ccHard, ccTokens].forEach(el => el.addEventListener('input', recalc));
recalc();

/* CONTACT FORM — mailto */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('cfName').value.trim();
    const email = document.getElementById('cfEmail').value.trim();
    const topic = document.getElementById('cfTopic').value;
    const message = document.getElementById('cfMessage').value.trim();
    if (!name || !email || !message) {
      alert('Merci de remplir nom, email et message.');
      return;
    }
    const subject = encodeURIComponent('[CwC Recap] ' + topic);
    const body = encodeURIComponent(
      message + '\n\n— ' + name + '\n' + email + '\n\n' +
      '(Envoyé depuis le recap CwC London — ' + window.location.href + ')'
    );
    window.location.href = 'mailto:robin.detant@sagora.eu?subject=' + subject + '&body=' + body;
  });
}

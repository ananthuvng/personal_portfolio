/**
 * contentPages.js
 * Renders rich HTML content popups for the 3D world interactions.
 * Replaces the old image-slider approach with real web content.
 */

// ===== Shared helpers =====
function createOverlay(windowStateManager) {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out',
    overflow: 'auto',
    padding: '20px',
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (windowStateManager) windowStateManager._onaAnotherWindow = false;
    }, 300);
  });

  return { overlay, closeBtn };
}

function createContentContainer() {
  const isMobile = window.innerWidth <= 768;
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'relative',
    boxSizing: 'border-box',
    width: isMobile ? '95%' : '80%',
    maxWidth: '900px',
    maxHeight: '85vh',
    backgroundColor: 'rgba(10, 10, 20, 0.92)',
    borderRadius: isMobile ? '14px' : '20px',
    padding: isMobile ? '28px 20px' : '48px',
    color: 'white',
    fontFamily: "'Outfit', Arial, sans-serif",
    overflow: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitOverflowScrolling: 'touch',
  });
  return container;
}

function showPage(windowStateManager, container, closeBtn) {
  const { overlay } = createOverlay(windowStateManager);
  // Re-attach closeBtn logic to this overlay
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (windowStateManager) windowStateManager._onaAnotherWindow = false;
    }, 300);
  });
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

// ===== Shared CSS-in-JS styles =====
const S = {
  sectionLabel: 'font-family:"JetBrains Mono",monospace;font-size:12px;color:#26fffd;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;',
  title: 'font-family:"Space Grotesk",sans-serif;font-size:2rem;font-weight:800;margin-bottom:16px;letter-spacing:-0.5px;',
  subtitle: 'font-family:"Space Grotesk",sans-serif;font-size:1.2rem;font-weight:700;margin-bottom:6px;',
  body: 'color:rgba(240,240,245,0.75);font-size:0.95rem;line-height:1.75;margin-bottom:16px;',
  accent: 'color:#26fffd;',
  divider: 'width:100%;height:1px;background:rgba(255,255,255,0.08);margin:28px 0;',
  tag: 'display:inline-block;padding:4px 14px;border-radius:50px;font-size:12px;font-weight:500;background:rgba(38,255,253,0.1);border:1px solid rgba(38,255,253,0.15);color:#26fffd;margin:0 6px 6px 0;',
  card: 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:24px;margin-bottom:20px;',
  timelineDate: 'font-family:"JetBrains Mono",monospace;font-size:12px;color:#26fffd;margin-bottom:6px;',
  listItem: 'position:relative;padding-left:18px;margin-bottom:8px;color:rgba(240,240,245,0.75);font-size:0.9rem;line-height:1.65;',
};

// ===== ABOUT PAGE =====
export function showAboutPage(windowStateManager) {
  const container = createContentContainer();
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');

  container.innerHTML = `
    <p style="${S.sectionLabel}">// About Me</p>
    <h2 style="${S.title}">Hello, I'm <span style="${S.accent}">Ananthu Vengassery</span></h2>
    <p style="${S.body}">
      I'm a Full Stack Developer with expertise in React and NestJS, currently working as a 
      Software Engineer at Ellucian Higher Education. With a creative mindset and strong 
      problem-solving skills, I build innovative, scalable solutions that drive impact.
    </p>
    <p style="${S.body}">
      Let's collaborate to bring your ideas to life with code that inspires and performs.
    </p>
    <div style="${S.divider}"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">
      <div style="text-align:center;padding:18px 10px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#26fffd,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">3+</div>
        <div style="font-size:11px;color:rgba(240,240,245,0.4);text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Years Exp</div>
      </div>
      <div style="text-align:center;padding:18px 10px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#26fffd,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">8.9</div>
        <div style="font-size:11px;color:rgba(240,240,245,0.4);text-transform:uppercase;letter-spacing:1px;margin-top:4px;">CGPA</div>
      </div>
      <div style="text-align:center;padding:18px 10px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#26fffd,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AWS</div>
        <div style="font-size:11px;color:rgba(240,240,245,0.4);text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Certified</div>
      </div>
    </div>
    <div style="${S.divider}"></div>
    <p style="${S.sectionLabel}">// Education</p>
    <div style="${S.card}">
      <h3 style="${S.subtitle}">NSS College of Engineering</h3>
      <p style="color:rgba(240,240,245,0.4);font-size:0.85rem;margin-bottom:8px;">July 2019 — July 2023</p>
      <p style="${S.body}margin-bottom:0;">BTech in Computer Science Engineering — CGPA: 8.9 / 10.0</p>
    </div>
    <p style="${S.sectionLabel}">// Publication</p>
    <div style="${S.card}">
      <h3 style="${S.subtitle}">EMG Interface for SCI Patients</h3>
      <p style="color:rgba(240,240,245,0.4);font-size:0.85rem;margin-bottom:8px;">Published: Nov 2023 · IEEE ICCCNT</p>
      <p style="${S.body}margin-bottom:8px;">ML-powered wheelchair control system for spinal cord injury patients using EMG-based hand gesture recognition.</p>
      <a href="https://doi.org/10.1109/ICCCNT56998.2023.10308150" target="_blank" style="color:#26fffd;font-size:0.85rem;">View Publication →</a>
    </div>
  `;

  const { overlay } = createOverlay(windowStateManager);
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (windowStateManager) windowStateManager._onaAnotherWindow = false;
    }, 300);
  });
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

// ===== EXPERIENCE PAGE =====
export function showExperiencePage(windowStateManager) {
  const container = createContentContainer();
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');

  container.innerHTML = `
    <p style="${S.sectionLabel}">// Experience</p>
    <h2 style="${S.title}">Where I've Worked</h2>
    <p style="${S.body}">My professional journey building scalable enterprise software.</p>
    <div style="${S.divider}"></div>

    <div style="${S.card}">
      <p style="${S.timelineDate}">July 2024 — Present</p>
      <h3 style="${S.subtitle}">Software Engineer II</h3>
      <p style="color:rgba(240,240,245,0.4);font-size:0.85rem;margin-bottom:14px;">Ellucian Higher Education Systems · Remote</p>
      <ul style="list-style:none;padding:0;margin:0;">
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Built and shipped major UI features including drag-and-drop file importer (XML, JSON, Excel), student self-service portal, and campus management workflows.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Implemented RPA workflow using Playwright to automate government web portal interactions.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Built an MCP server integrated with GitHub Copilot that generates production-ready UI code from legacy screenshots, accelerating frontend development.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Designed ECS-level observability dashboard in Datadog; remediated security vulnerabilities across SonarQube, Snyk, and Checkmarx.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Contributed to DevOps pipelines including S3 bucket consolidation and CI/CD troubleshooting.</li>
      </ul>
    </div>

    <div style="${S.card}">
      <p style="${S.timelineDate}">July 2023 — July 2024</p>
      <h3 style="${S.subtitle}">Software Engineer I</h3>
      <p style="color:rgba(240,240,245,0.4);font-size:0.85rem;margin-bottom:14px;">Ellucian Higher Education Systems · Remote</p>
      <ul style="list-style:none;padding:0;margin:0;">
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Designed and developed 3+ scalable backend services using NestJS, TypeScript, and PostgreSQL.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Created a reusable React component for dynamic, JSON-configurable forms, reducing dev time.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Implemented Redis caching, then migrated to Valkey — reducing latency and cost.</li>
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Increased front-end test coverage to over 85% and automated UI testing with Playwright.</li>
      </ul>
    </div>

    <div style="${S.card}">
      <p style="${S.timelineDate}">July 2021 — Aug 2021</p>
      <h3 style="${S.subtitle}">Android App Developer Intern</h3>
      <p style="color:rgba(240,240,245,0.4);font-size:0.85rem;margin-bottom:14px;">CISCO Thingqbator</p>
      <ul style="list-style:none;padding:0;margin:0;">
        <li style="${S.listItem}"><span style="position:absolute;left:0;color:#26fffd;">▸</span>Developed a travel-focused Android app for an early-stage startup using Flutter and Firebase.</li>
      </ul>
    </div>

    <div style="${S.divider}"></div>
    <p style="${S.sectionLabel}">// Certification</p>
    <div style="display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border-radius:12px;background:rgba(38,255,253,0.06);border:1px solid rgba(38,255,253,0.15);">
      <span style="font-size:1.4rem;">☁️</span>
      <span style="font-size:0.95rem;font-weight:600;">AWS Certified Cloud Practitioner</span>
    </div>
  `;

  const { overlay } = createOverlay(windowStateManager);
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (windowStateManager) windowStateManager._onaAnotherWindow = false;
    }, 300);
  });
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

// ===== PROJECTS PAGE =====
export function showProjectsPage(windowStateManager) {
  const container = createContentContainer();
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');

  container.innerHTML = `
    <p style="${S.sectionLabel}">// Projects</p>
    <h2 style="${S.title}">Things I've Built</h2>
    <p style="${S.body}">A selection of side projects and research work.</p>
    <div style="${S.divider}"></div>

    <div style="${S.card}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <span style="font-size:1.6rem;">📹</span>
        <h3 style="${S.subtitle}margin-bottom:0;">SOLE — Social Video App</h3>
      </div>
      <p style="${S.body}">
        A video chat app where strangers from around the world can connect anonymously. 
        Users create rooms with specific topics, so instead of random chats, you find 
        and join video conversations that match your interests — movies, technology, or anything else.
      </p>
      <div style="margin-bottom:14px;">
        <span style="${S.tag}">Flutter</span>
        <span style="${S.tag}">Agora SDK</span>
        <span style="${S.tag}">Firebase</span>
      </div>
      <a href="https://github.com/Souls" target="_blank" style="color:#26fffd;font-size:0.85rem;">View on GitHub →</a>
    </div>

    <div style="${S.card}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <span style="font-size:1.6rem;">🗺️</span>
        <h3 style="${S.subtitle}margin-bottom:0;">Sanchari — Travel Companion</h3>
      </div>
      <p style="${S.body}">
        A travel companion app with trip planning, weather forecasts, news updates, 
        emergency SOS features, and friend location sharing via Google Maps integration.
      </p>
      <div style="margin-bottom:14px;">
        <span style="${S.tag}">Flutter</span>
        <span style="${S.tag}">Google Maps</span>
        <span style="${S.tag}">Firebase</span>
      </div>
    </div>

    <div style="${S.card}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <span style="font-size:1.6rem;">🧠</span>
        <h3 style="${S.subtitle}margin-bottom:0;">EMG Interface for SCI Patients</h3>
      </div>
      <p style="${S.body}">
        ML-powered wheelchair control system for spinal cord injury patients using EMG-based 
        hand gesture recognition. Addressed cross-patient signal variation via robust ML classification.
        Published at IEEE ICCCNT 2023.
      </p>
      <div style="margin-bottom:14px;">
        <span style="${S.tag}">Python</span>
        <span style="${S.tag}">Machine Learning</span>
        <span style="${S.tag}">IEEE Published</span>
      </div>
      <a href="https://github.com/SAHAYOG13" target="_blank" style="color:#26fffd;font-size:0.85rem;">View on GitHub →</a>
    </div>
  `;

  const { overlay } = createOverlay(windowStateManager);
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (windowStateManager) windowStateManager._onaAnotherWindow = false;
    }, 300);
  });
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

// ===== BLOG PAGE =====
export function showBlogPage(windowStateManager) {
  const container = createContentContainer();
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');

  container.innerHTML = `
    <p style="${S.sectionLabel}">// Blog & Writings</p>
    <h2 style="${S.title}">Thoughts & Articles</h2>
    <p style="${S.body}">I occasionally write about tech, development practices, and things I find interesting.</p>
    <div style="${S.divider}"></div>

    <div style="${S.card}cursor:pointer;transition:border-color 0.3s;" onmouseover="this.style.borderColor='rgba(38,255,253,0.25)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="${S.tag}">Dev Tools</span>
        <span style="font-size:12px;color:rgba(240,240,245,0.4);">2024</span>
      </div>
      <h3 style="${S.subtitle}">Building an MCP Server for AI-Powered Code Generation</h3>
      <p style="${S.body}margin-bottom:0;">
        How I built a Model Context Protocol server integrated with GitHub Copilot 
        to generate production-ready UI code from legacy screenshots and user stories, 
        accelerating frontend development across teams.
      </p>
    </div>

    <div style="${S.card}cursor:pointer;transition:border-color 0.3s;" onmouseover="this.style.borderColor='rgba(38,255,253,0.25)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="${S.tag}">Backend</span>
        <span style="font-size:12px;color:rgba(240,240,245,0.4);">2024</span>
      </div>
      <h3 style="${S.subtitle}">Redis to Valkey: Migrating Caching for Cost Efficiency</h3>
      <p style="${S.body}margin-bottom:0;">
        A walkthrough of migrating from Redis to Valkey for caching infrequently 
        changing data, building a reusable NestJS package, and the cost benefits.
      </p>
    </div>

    <div style="${S.card}cursor:pointer;transition:border-color 0.3s;" onmouseover="this.style.borderColor='rgba(38,255,253,0.25)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="${S.tag}">Automation</span>
        <span style="font-size:12px;color:rgba(240,240,245,0.4);">2024</span>
      </div>
      <h3 style="${S.subtitle}">Automating Government Portals with Playwright RPA</h3>
      <p style="${S.body}margin-bottom:0;">
        How I used Playwright to build an RPA workflow that automates form submissions 
        and data retrieval from a government web portal — integrated directly into a core platform feature.
      </p>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="color:rgba(240,240,245,0.4);font-size:0.85rem;">More articles coming soon ✨</p>
    </div>
  `;

  const { overlay } = createOverlay(windowStateManager);
  closeBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (windowStateManager) windowStateManager._onaAnotherWindow = false;
    }, 300);
  });
  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

(() => {
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const root = document.documentElement;

  const setHidden = (element, hidden) => {
    if (!element) return;
    element.hidden = hidden;
  };

  const showToast = (message) => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2400);
  };

  const closeDropdowns = (except = null) => {
    $$('.dropdown').forEach((menu) => {
      if (menu !== except) menu.hidden = true;
    });
    ['#languageButton', '#toolsButton', '#personalMenuButton'].forEach((selector) => {
      const button = $(selector);
      if (button && (!except || button.getAttribute('aria-controls') !== except.id)) button.setAttribute('aria-expanded', 'false');
    });
  };

  const bindDropdown = (buttonSelector, menuSelector) => {
    const button = $(buttonSelector);
    const menu = $(menuSelector);
    if (!button || !menu) return;
    button.setAttribute('aria-controls', menu.id);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      closeDropdowns(menu);
      menu.hidden = !willOpen;
      button.setAttribute('aria-expanded', String(willOpen));
    });
  };

  bindDropdown('#languageButton', '#languageMenu');
  bindDropdown('#toolsButton', '#toolsMenu');
  bindDropdown('#personalMenuButton', '#personalMenu');

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown') && !event.target.closest('[aria-expanded]')) closeDropdowns();
  });

  const mainMenu = $('#mainMenu');
  const menuButton = $('#menuButton');
  const backdrop = $('#drawerBackdrop');
  const toggleMenu = (open) => {
    mainMenu.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuButton.addEventListener('click', () => toggleMenu(!mainMenu.classList.contains('open')));
  backdrop.addEventListener('click', () => toggleMenu(false));
  $$('#mainMenu a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));

  const notice = $('.draft-notice');
  $('#dismissNotice').addEventListener('click', () => {
    notice.remove();
    root.style.setProperty('--notice-height', '0px');
  });

  const toc = $('#toc');
  $('#hideToc').addEventListener('click', () => {
    toc.style.display = 'none';
    showToast('Contents hidden. Reload the page to restore it.');
  });

  const appearancePanel = $('#appearancePanel');
  $('#hideAppearance').addEventListener('click', () => {
    appearancePanel.style.display = 'none';
    showToast('Appearance panel hidden.');
  });

  const openMobilePanel = (panel, title) => {
    if (window.innerWidth > 1080) return;
    const cloned = panel.cloneNode(true);
    cloned.removeAttribute('id');
    cloned.style.display = 'block';
    cloned.style.position = 'fixed';
    cloned.style.inset = 'auto 0 0 0';
    cloned.style.maxHeight = '72vh';
    cloned.style.overflow = 'auto';
    cloned.style.padding = '16px 18px 28px';
    cloned.style.background = 'var(--surface)';
    cloned.style.borderTop = '1px solid var(--border)';
    cloned.style.zIndex = '90';
    cloned.classList.add('mobile-panel-clone');
    cloned.querySelectorAll('button').forEach((button) => button.remove());
    const heading = document.createElement('div');
    heading.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:700;';
    heading.innerHTML = `<span>${title}</span><button type="button" aria-label="Close" style="border:0;background:transparent;font-size:24px;color:inherit">×</button>`;
    cloned.prepend(heading);
    const panelBackdrop = document.createElement('div');
    panelBackdrop.className = 'mobile-panel-backdrop';
    panelBackdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:89;';
    document.body.append(panelBackdrop, cloned);
    document.body.style.overflow = 'hidden';
    const close = () => { cloned.remove(); panelBackdrop.remove(); document.body.style.overflow = ''; };
    heading.querySelector('button').addEventListener('click', close);
    panelBackdrop.addEventListener('click', close);
    cloned.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
    cloned.querySelectorAll('input').forEach((input) => input.addEventListener('change', (event) => {
      const liveInput = document.querySelector(`input[name="${event.target.name}"][value="${event.target.value}"]`);
      if (liveInput) { liveInput.checked = true; liveInput.dispatchEvent(new Event('change', { bubbles: true })); }
    }));
  };

  $('#mobileTocButton').addEventListener('click', () => openMobilePanel(toc, 'Contents'));
  $('#mobileAppearanceButton').addEventListener('click', () => openMobilePanel(appearancePanel, 'Appearance'));
  $('#shareButton').addEventListener('click', async () => {
    const data = { title: document.title, text: 'Papon proposed article preview', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); showToast('Preview link copied.'); }
    } catch (_) { /* share cancelled */ }
  });

  $$('input[name="fontSize"]').forEach((input) => input.addEventListener('change', () => {
    root.dataset.fontSize = input.value;
    localStorage.setItem('preview-font-size', input.value);
  }));
  $$('input[name="contentWidth"]').forEach((input) => input.addEventListener('change', () => {
    root.dataset.contentWidth = input.value;
    localStorage.setItem('preview-content-width', input.value);
  }));
  $$('input[name="theme"]').forEach((input) => input.addEventListener('change', () => {
    const value = input.value;
    if (value === 'auto') {
      root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else root.dataset.theme = value;
    localStorage.setItem('preview-theme-setting', value);
  }));

  const restoreSetting = (name, storedValue, datasetKey) => {
    if (!storedValue) return;
    const input = document.querySelector(`input[name="${name}"][value="${storedValue}"]`);
    if (input) input.checked = true;
    if (name === 'theme' && storedValue === 'auto') root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    else root.dataset[datasetKey] = storedValue;
  };
  restoreSetting('fontSize', localStorage.getItem('preview-font-size'), 'fontSize');
  restoreSetting('contentWidth', localStorage.getItem('preview-content-width'), 'contentWidth');
  restoreSetting('theme', localStorage.getItem('preview-theme-setting'), 'theme');

  const headings = $$('article section[id], #top');
  const tocLinks = $$('#tocNav a');
  const updateToc = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - innerHeight;
    $('#tocProgress').style.width = `${docHeight > 0 ? (scrollTop / docHeight) * 100 : 0}%`;
  };
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    tocLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-12% 0px -76% 0px', threshold: [0, .1] });
  headings.forEach((heading) => observer.observe(heading));
  addEventListener('scroll', updateToc, { passive: true });
  updateToc();

  const searchForm = $('#siteSearch');
  const searchInput = $('#searchInput');
  const searchResults = $('#searchResults');
  const searchable = $$('article h2, article h3, article p, article li').map((node) => ({ node, text: node.textContent.trim() }));

  const clearHighlights = () => {
    $$('mark.search-highlight').forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent)));
  };

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
    const matches = searchable.filter((item) => item.text.toLowerCase().includes(query)).slice(0, 7);
    searchResults.innerHTML = matches.length ? matches.map((item, index) => `<button type="button" data-index="${index}"><strong>${item.text.slice(0, 92)}${item.text.length > 92 ? '…' : ''}</strong><small>Jump to matching text</small></button>`).join('') : '<button type="button" disabled>No matches in this preview</button>';
    searchResults.hidden = false;
    searchResults.querySelectorAll('button[data-index]').forEach((button) => button.addEventListener('click', () => {
      const item = matches[Number(button.dataset.index)];
      clearHighlights();
      const regex = new RegExp(`(${searchInput.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
      item.node.childNodes.forEach((child) => {
        if (child.nodeType !== Node.TEXT_NODE || !regex.test(child.textContent)) return;
        const span = document.createElement('span');
        span.innerHTML = child.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
        child.replaceWith(...span.childNodes);
      });
      item.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchResults.hidden = true;
    }));
  });

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const first = searchResults.querySelector('button[data-index]');
    if (first) first.click(); else showToast('No matching text found in this preview.');
  });

  $$('.section-edit, .page-tabs a[href="#"], .vector-user-links a, .content-footer a, .categories-box a, .main-menu-drawer a[href="#"]').forEach((element) => {
    element.addEventListener('click', (event) => {
      if (element.getAttribute('href') === '#' || element.classList.contains('section-edit')) {
        event.preventDefault();
        showToast('Preview only — editing controls are not connected.');
      }
    });
  });
})();

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('.scroll-progress span');
const backToTop = document.querySelector('[data-back-to-top]');
const heroDevice = document.querySelector('[data-hero-device]');
const floatingCards = [...document.querySelectorAll('[data-float-card]')];
const story = document.querySelector('[data-product-story]');
const storySteps = [...document.querySelectorAll('[data-story-step]')];
const storyDots = [...document.querySelectorAll('.story-dots i')];
const productVisual = document.querySelector('[data-product-visual]');
const scenes = ['portrait', 'landscape', 'both'];
let currentChapter = -1;
let scrollQueued = false;

function updateStory() {
  if (!story || reducedMotion.matches) return;
  const rect = story.getBoundingClientRect();
  const distance = Math.max(1, story.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / distance);
  const chapter = Math.min(storySteps.length - 1, Math.floor(progress * storySteps.length));

  if (productVisual) productVisual.style.setProperty('--product-y', `${(progress - 0.5) * -26}px`);

  if (chapter !== currentChapter) {
    story.dataset.scene = scenes[chapter];
    storySteps.forEach((step, index) => step.classList.toggle('is-active', index === chapter));
    storyDots.forEach((dot, index) => dot.classList.toggle('active', index === chapter));
    currentChapter = chapter;
  }
}

function updateScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progressBar.style.transform = `scaleX(${clamp(scrollTop / scrollRange)})`;
  header.classList.toggle('is-scrolled', scrollTop > 18);
  backToTop.classList.toggle('is-visible', scrollTop > 800);

  if (!reducedMotion.matches && heroDevice && scrollTop < 1200) {
    const heroProgress = clamp(scrollTop / 900);
    heroDevice.style.setProperty('--hero-y', `${heroProgress * -52}px`);
    heroDevice.style.setProperty('--hero-rx', `${heroProgress * 3}deg`);
    floatingCards.forEach((card, index) => {
      card.style.setProperty('--float-shift', `${heroProgress * (index === 0 ? -70 : 48)}px`);
    });
  }

  updateStory();
  scrollQueued = false;
}

function requestScrollUpdate() {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
reducedMotion.addEventListener('change', requestScrollUpdate);
updateScroll();

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
});

const revealItems = [...document.querySelectorAll('.reveal')];
document.querySelectorAll('.principles, .bento-grid, .detail-grid, .start-grid').forEach((group) => {
  [...group.querySelectorAll('.reveal')].forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
  });
});

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const navLinks = [...document.querySelectorAll('.nav-links a')];
const observedSections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    });
  }, { rootMargin: '-32% 0px -58% 0px', threshold: 0 });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
mobileMenu.inert = true;
mobileMenu.setAttribute('aria-hidden', 'true');

function setMenu(open, returnFocus = false) {
  header.classList.toggle('menu-is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  mobileMenu.inert = !open;
  mobileMenu.setAttribute('aria-hidden', String(!open));
  if (open) mobileMenu.querySelector('a')?.focus({ preventScroll: true });
  else if (returnFocus) menuToggle.focus({ preventScroll: true });
}

menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 960 && menuToggle.getAttribute('aria-expanded') === 'true') setMenu(false);
}, { passive: true });

const themeArt = document.querySelector('[data-theme-art]');
const themeButtons = [...document.querySelectorAll('[data-preview-theme]')];
themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    themeButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    themeArt.classList.toggle('dark', button.dataset.previewTheme === 'dark');
  });
});

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    let tiltFrame = 0;
    card.addEventListener('pointermove', (event) => {
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      tiltFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${y * -2.4}deg`);
        card.style.setProperty('--tilt-y', `${x * 2.4}deg`);
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.querySelectorAll('[data-spotlight]').forEach((card) => {
    let spotlightFrame = 0;
    card.addEventListener('pointermove', (event) => {
      if (spotlightFrame) cancelAnimationFrame(spotlightFrame);
      spotlightFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
      });
    });
  });
}

const carousel = document.querySelector('[data-cover-carousel]');
const coverStage = document.querySelector('[data-cover-stage]');
const slides = [...document.querySelectorAll('[data-cover-slide]')];
const coverDots = [...document.querySelectorAll('.cover-dots button')];
const coverTitle = document.querySelector('[data-cover-title]');
const coverMeta = document.querySelector('[data-cover-meta]');
const coverCurrent = document.querySelector('[data-cover-current]');
let activeCover = 0;
let pointerStart = null;
let dragDistance = 0;
let suppressClick = false;
let wheelLocked = false;

function circularOffset(index, active, length) {
  let offset = index - active;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

function renderCovers() {
  const spacing = window.innerWidth <= 390 ? 126 : window.innerWidth <= 720 ? 158 : 272;
  slides.forEach((slide, index) => {
    const offset = circularOffset(index, activeCover, slides.length);
    const distance = Math.abs(offset);
    slide.style.setProperty('--x', `${offset * spacing}px`);
    slide.style.setProperty('--z', `${distance * -155}px`);
    slide.style.setProperty('--ry', `${offset * -27}deg`);
    slide.style.setProperty('--scale', String(1 - Math.min(distance * 0.1, 0.24)));
    slide.style.setProperty('--slide-opacity', String(1 - Math.min(distance * 0.22, 0.52)));
    slide.style.zIndex = String(20 - distance);
    slide.classList.toggle('is-active', offset === 0);
    slide.tabIndex = offset === 0 ? 0 : -1;
    if (offset === 0) slide.setAttribute('aria-current', 'true');
    else slide.removeAttribute('aria-current');
  });

  coverDots.forEach((dot, index) => {
    const active = index === activeCover;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-pressed', String(active));
  });
  const activeSlide = slides[activeCover];
  coverTitle.textContent = activeSlide.dataset.title;
  coverMeta.textContent = activeSlide.dataset.meta;
  coverCurrent.textContent = String(activeCover + 1).padStart(2, '0');
}

function selectCover(index) {
  activeCover = (index + slides.length) % slides.length;
  renderCovers();
}

slides.forEach((slide, index) => {
  slide.addEventListener('click', (event) => {
    if (suppressClick) {
      event.preventDefault();
      return;
    }
    selectCover(index);
  });
});
coverDots.forEach((dot, index) => dot.addEventListener('click', () => selectCover(index)));
document.querySelector('[data-cover-prev]').addEventListener('click', () => selectCover(activeCover - 1));
document.querySelector('[data-cover-next]').addEventListener('click', () => selectCover(activeCover + 1));

carousel.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    selectCover(activeCover - 1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    selectCover(activeCover + 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    selectCover(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    selectCover(slides.length - 1);
  }
});

coverStage.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  dragDistance = 0;
  coverStage.setPointerCapture(event.pointerId);
});

coverStage.addEventListener('pointermove', (event) => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
    dragDistance = dx;
    coverStage.classList.add('is-dragging');
  }
});

function finishDrag(event) {
  if (!pointerStart) return;
  if (coverStage.hasPointerCapture(event.pointerId)) coverStage.releasePointerCapture(event.pointerId);
  if (Math.abs(dragDistance) > 42) {
    selectCover(activeCover + (dragDistance < 0 ? 1 : -1));
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 80);
  }
  pointerStart = null;
  dragDistance = 0;
  coverStage.classList.remove('is-dragging');
}

coverStage.addEventListener('pointerup', finishDrag);
coverStage.addEventListener('pointercancel', finishDrag);
coverStage.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || wheelLocked) return;
  event.preventDefault();
  selectCover(activeCover + (event.deltaX > 0 ? 1 : -1));
  wheelLocked = true;
  window.setTimeout(() => { wheelLocked = false; }, 450);
}, { passive: false });
window.addEventListener('resize', renderCovers, { passive: true });
renderCovers();

const faqItems = [...document.querySelectorAll('.faq-list details')];
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const copyQQButton = document.querySelector('[data-copy-qq]');
const copyQQFeedback = document.querySelector('[data-copy-feedback]');
const copyQQLabel = document.querySelector('[data-copy-label]');
let copyQQResetTimer = 0;

async function copyQQNumber(value) {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {}
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

copyQQButton?.addEventListener('click', async () => {
  window.clearTimeout(copyQQResetTimer);
  const copied = await copyQQNumber(copyQQButton.dataset.copyQq);
  copyQQButton.classList.toggle('is-copied', copied);
  copyQQLabel.textContent = copied ? '已复制' : '请手动复制';
  copyQQFeedback.textContent = copied ? '群号已复制，在 QQ 中粘贴搜索即可加入' : '请选中上方群号 677063599 进行复制';
  copyQQResetTimer = window.setTimeout(() => {
    copyQQButton.classList.remove('is-copied');
    copyQQLabel.textContent = '复制群号';
    copyQQFeedback.textContent = '在 QQ 中搜索群号即可加入';
  }, 2800);
});

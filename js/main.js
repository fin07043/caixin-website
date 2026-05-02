// ========== Language Management ==========
let currentLang = localStorage.getItem('caixin-lang') || 'zh';

function getText(key) {
  return i18n[currentLang][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('caixin-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  updateAllText();
  updateLangButtons();
}

function updateAllText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const raw = getText(key);
    if (raw === undefined) return;

    // Handle HTML in translations (e.g., {br}, {span}...{/span})
    let html = raw
      .replace(/\{br\}/g, '<br>')
      .replace(/\{span\}(.*?)\{\/span\}/g, '<span>$1</span>');

    el.innerHTML = html;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = getText(el.dataset.i18nPlaceholder);
  });
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.dataset.lang;
    btn.classList.toggle('active', lang === currentLang);
  });
}

// ========== Mobile Menu ==========
function toggleMobileMenu() {
  const nav = document.querySelector('.nav');
  nav.classList.toggle('open');
}

// ========== FAQ Accordion ==========
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const wasOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

  // Toggle clicked
  if (!wasOpen) item.classList.add('open');
}

// ========== Scroll Effects ==========
function handleScroll() {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  // Fade in animations
  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.add('visible');
    }
  });
}

// ========== Smooth Scroll ==========
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 90;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile menu if open
        document.querySelector('.nav')?.classList.remove('open');
      }
    });
  });
}

// ========== Contact Form ==========
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = form.querySelector('.btn');
    const originalText = btn.textContent;
    btn.textContent = currentLang === 'zh' ? '发送中...' : 'Sending...';
    btn.disabled = true;

    // Simulate form submission
    setTimeout(() => {
      const successMsg = getText('contact.form.success');
      form.innerHTML = `<div style="text-align:center;padding:40px 0;">
        <div style="font-size:3rem;margin-bottom:16px;">✓</div>
        <p style="font-size:1.1rem;color:var(--text-light);">${successMsg}</p>
      </div>`;
    }, 1000);
  });
}

// ========== Counter Animation ==========
function initCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.countTo);
        const duration = 2000;
        const step = Math.max(1, Math.floor(target / 60));
        let current = 0;

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current + (el.dataset.countSuffix || '');
        }, duration / (target / step));

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', function() {
  // Set initial language
  setLanguage(currentLang);

  // Handle scroll
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // Mobile menu
  const toggle = document.querySelector('.mobile-toggle');
  if (toggle) toggle.addEventListener('click', toggleMobileMenu);

  // Lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => toggleFaq(q));
  });

  // Smooth scroll
  initSmoothScroll();

  // Contact form
  initContactForm();

  // Counters
  initCounters();

  // Close mobile menu on nav link click
  document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('click', () => {
      document.querySelector('.nav')?.classList.remove('open');
    });
  });
});

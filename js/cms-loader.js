// ========== CMS Content Loader ==========
// Loads edited content from content.json and applies it to the live site.

(async function loadCMS() {
  try {
    const res = await fetch('data/content.json');
    if (!res.ok) return;
    const cms = await res.json();

    // ====== Helper: set a bilingual i18n key ======
    function setI18n(key, zhVal, enVal) {
      if (zhVal !== undefined && zhVal !== null && zhVal !== '') {
        i18n.zh[key] = zhVal;
      }
      if (enVal !== undefined && enVal !== null && enVal !== '') {
        i18n.en[key] = enVal;
      }
    }

    // ====== Apply Settings ======
    if (cms.settings) {
      const s = cms.settings;
      // Work hours
      setI18n('contact.worktime.val', s.worktime, s.worktime_en);
      // ICP
      setI18n('footer.icp', s.icp, s.icp);
      // Store for direct DOM updates
      window.__SETTINGS = s;
    }

    // ====== Apply Home Content ======
    if (cms.home) {
      const h = cms.home;
      setI18n('hero.badge', h.hero_badge, h.hero_badge_en);
      setI18n('hero.title', h.hero_title, h.hero_title_en);
      setI18n('hero.desc', h.hero_desc, h.hero_desc_en);
      setI18n('home.products.title', h.products_title);
      setI18n('home.products.subtitle', h.products_subtitle);
      setI18n('home.about.title', h.about_title, h.about_title_en);
      setI18n('home.about.desc', h.about_desc, h.about_desc_en);
      setI18n('home.about.desc2', h.about_desc2, h.about_desc2_en);
      setI18n('home.cta.title', h.cta_title, h.cta_title_en);
      setI18n('home.cta.desc', h.cta_desc, h.cta_desc_en);
    }

    // ====== Apply About Content ======
    if (cms.about) {
      const a = cms.about;
      setI18n('about.intro', a.intro_title, a.intro_title_en);
      setI18n('about.intro.p1', a.intro_p1, a.intro_p1_en);
      setI18n('about.intro.p2', a.intro_p2, a.intro_p2_en);
      setI18n('about.equipment', a.equipment_title, a.equipment_title_en);
      setI18n('about.equipment.desc', a.equipment_desc, a.equipment_desc_en);
      setI18n('about.equipment.gravure.desc', a.gravure_desc, a.gravure_desc_en);
      setI18n('about.equipment.digital.desc', a.digital_desc, a.digital_desc_en);
      setI18n('about.equipment.laminate.desc', a.laminate_desc, a.laminate_desc_en);
      setI18n('about.equipment.testing.desc', a.testing_desc, a.testing_desc_en);
    }

    // ====== Apply Banners ======
    if (cms.banners) {
      const b = cms.banners;
      setI18n('banner.about', b.about, b.about_en);
      setI18n('banner.about.desc', b.about + ' — ' + b.about_desc_extra, b.about_en + ' — ' + b.about_desc_extra_en);
      setI18n('banner.products', b.products, b.products_en);
      setI18n('banner.products.desc', b.products_desc, b.products_desc_en);
      setI18n('banner.production', b.production, b.production_en);
      setI18n('banner.production.desc', b.production_desc, b.production_desc_en);
      setI18n('banner.faq', b.faq, b.faq_en);
      setI18n('banner.faq.desc', b.faq_desc, b.faq_desc_en);
      setI18n('banner.contact', b.contact, b.contact_en);
      setI18n('banner.contact.desc', b.contact_desc, b.contact_desc_en);
    }

    // ====== Apply Footer ======
    if (cms.footer) {
      const f = cms.footer;
      setI18n('footer.desc', f.desc, f.desc_en);
    }

    // ====== Apply images from CMS ======
    function applyImages(cmsData) {
      const imageMap = {};

      // Collect all image paths from CMS data
      const collect = (obj, prefix = '') => {
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            collect(val, prefix + key + '-');
          } else if (typeof val === 'string' && (val.startsWith('/images/') || val.startsWith('http'))) {
            imageMap[prefix + key] = val;
          }
        }
      };
      collect(cmsData);

      // Apply images to DOM elements
      document.querySelectorAll('[data-cms-image]').forEach(el => {
        const key = el.dataset.cmsImage;
        const url = imageMap[key];
        if (!url) return;

        // Clear container, remove aspect-ratio constraints
        el.innerHTML = '';
        el.style.backgroundImage = 'none';
        el.style.aspectRatio = 'unset';

        // Handle different container types
        if (el.classList.contains('hero-image-placeholder')) {
          // Hero image: keep half-width layout, show full image
          el.style.background = 'var(--bg)';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.padding = '0';
          el.style.minHeight = '280px';
          el.style.borderRadius = 'var(--radius)';
          const img = document.createElement('img');
          img.src = url;
          img.alt = key;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          el.appendChild(img);
        } else if (el.classList.contains('about-image-placeholder')) {
          // About image: show full image in half-width layout
          el.style.background = 'var(--bg)';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.padding = '20px';
          el.style.minHeight = '260px';
          el.style.borderRadius = 'var(--radius)';
          const img = document.createElement('img');
          img.src = url;
          img.alt = key;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          el.appendChild(img);
        } else if (el.classList.contains('card-header')) {
          // Product card header: show full image
          el.style.background = 'var(--bg)';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.padding = '16px';
          el.style.minHeight = '200px';
          el.style.height = 'auto';
          const img = document.createElement('img');
          img.src = url;
          img.alt = key;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '300px';
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          el.appendChild(img);
        } else {
          // Default: plain img tag
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          const img = document.createElement('img');
          img.src = url;
          img.alt = key;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          el.appendChild(img);
        }
      });

      // Handle logo image
      if (cmsData.settings && cmsData.settings.logo_image) {
        const logoIcon = document.querySelector('.logo-icon');
        if (logoIcon) {
          logoIcon.innerHTML = '';
          logoIcon.style.background = 'none';
          const img = document.createElement('img');
          img.src = cmsData.settings.logo_image;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          logoIcon.appendChild(img);
        }
      }
    }

    applyImages(cms);
    // Update company name in logo
    if (window.__SETTINGS) {
      const s = window.__SETTINGS;
      const logoH1 = document.querySelector('.logo-text h1');
      if (logoH1 && s.company_name) {
        logoH1.textContent = s.company_name;
      }

      // Phone: update text and href
      document.querySelectorAll('[data-cms-contact="phone"]').forEach(el => {
        if (s.phone) {
          el.textContent = s.phone;
          if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('tel:')) {
            el.setAttribute('href', 'tel:' + s.phone.replace(/[\s-]/g, ''));
          }
        }
      });

      // Email: update text and href
      document.querySelectorAll('[data-cms-contact="email"]').forEach(el => {
        if (s.email) {
          el.textContent = s.email;
          if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('mailto:')) {
            el.setAttribute('href', 'mailto:' + s.email);
          }
        }
      });

      // Address: update text
      document.querySelectorAll('[data-cms-contact="address"]').forEach(el => {
        if (s.address) el.textContent = s.address;
      });
    }

    // Re-render with CMS content
    if (typeof updateAllText === 'function') {
      updateAllText();
    }

    console.log('[CMS] Content loaded successfully');
  } catch (e) {
    console.log('[CMS] Not available, using defaults');
  }
})();

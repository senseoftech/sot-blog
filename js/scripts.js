(function () {
    'use strict';

    /* ---------- UI translations (EN / FR) ---------- */

    var I18N = {
        en: {
            nav_home: 'Home',
            nav_archives: 'Archives',
            nav_about: 'About',
            hero_tagline: 'Tech notes on .NET, Azure, DevOps & AI — by Adrien Clerbois, Microsoft MVP in Developer Technologies.',
            latest_posts: 'Latest posts',
            min_read: 'min read',
            newer_posts: '← Newer',
            older_posts: 'Older →',
            toc_title: 'On this page',
            share_label: 'Share:',
            related_title: 'Related posts',
            nav_previous: '← Previous',
            nav_next: 'Next →',
            archives_title: 'Archives',
            archives_subtitle: 'Every post, grouped by tag.',
            footer_links: 'Important links',
            footer_navigate: 'Navigate',
            footer_built: 'Built with Jekyll, hosted on GitHub Pages.',
            search_placeholder: 'Search articles…',
            search_hint: 'Type to search across all articles.',
            search_empty: 'No results for',
            copy: 'copy',
            copied: 'copied!'
        },
        fr: {
            nav_home: 'Accueil',
            nav_archives: 'Archives',
            nav_about: 'À propos',
            hero_tagline: 'Notes techniques sur .NET, Azure, DevOps & IA — par Adrien Clerbois, Microsoft MVP en Developer Technologies.',
            latest_posts: 'Derniers articles',
            min_read: 'min de lecture',
            newer_posts: '← Récents',
            older_posts: 'Anciens →',
            toc_title: 'Sur cette page',
            share_label: 'Partager :',
            related_title: 'Articles liés',
            nav_previous: '← Précédent',
            nav_next: 'Suivant →',
            archives_title: 'Archives',
            archives_subtitle: 'Tous les articles, groupés par tag.',
            footer_links: 'Liens importants',
            footer_navigate: 'Navigation',
            footer_built: 'Propulsé par Jekyll, hébergé sur GitHub Pages.',
            search_placeholder: 'Rechercher un article…',
            search_hint: 'Tapez pour chercher dans tous les articles.',
            search_empty: 'Aucun résultat pour',
            copy: 'copier',
            copied: 'copié !'
        }
    };

    function currentLang() {
        return document.documentElement.getAttribute('data-ui-lang') || 'en';
    }

    function applyTranslations() {
        var dict = I18N[currentLang()];
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.setAttribute('placeholder', dict[key]);
        });
        var label = document.querySelector('[data-lang-label]');
        if (label) label.textContent = currentLang().toUpperCase();
    }

    var langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', function () {
            var next = currentLang() === 'en' ? 'fr' : 'en';
            document.documentElement.setAttribute('data-ui-lang', next);
            localStorage.setItem('ui-lang', next);
            applyTranslations();
            if (hasFilterableList) {
                applyLangFilter(next);
            }
            // On an article page, follow the toggle to the translated version
            var translated = document.body.getAttribute('data-url-' + next);
            if (translated && translated !== location.pathname) {
                window.location.href = translated;
            }
        });
    }

    // On an article page, sync the UI language to the language of the article
    // being read, so the toggle label and chrome match the content.
    (function syncLangToArticle() {
        var enUrl = document.body.getAttribute('data-url-en');
        var frUrl = document.body.getAttribute('data-url-fr');
        var pageLang = location.pathname === frUrl ? 'fr' : (location.pathname === enUrl ? 'en' : null);
        if (pageLang && currentLang() !== pageLang) {
            document.documentElement.setAttribute('data-ui-lang', pageLang);
            localStorage.setItem('ui-lang', pageLang);
        }
    })();

    applyTranslations();

    /* ---------- Theme toggle ---------- */

    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    /* ---------- Mobile nav ---------- */

    var navToggle = document.getElementById('nav-toggle');
    var mobileNav = document.getElementById('mobile-nav');
    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', function () {
            var open = mobileNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    /* ---------- Language filter on post lists ---------- */
    /* Every article exists in both languages; lists show only the posts
       matching the UI language (set via the lang-toggle button), so there's
       no separate language picker or per-post badge to display. */

    function applyLangFilter(filter) {
        document.querySelectorAll('.post-card, .archive-post').forEach(function (item) {
            item.classList.toggle('is-hidden', item.getAttribute('data-lang') !== filter);
        });
        // Hide tag groups whose posts are all filtered out
        document.querySelectorAll('[data-tag-group]').forEach(function (group) {
            var anyVisible = group.querySelector('.archive-post:not(.is-hidden)');
            group.classList.toggle('is-hidden', !anyVisible);
        });
    }

    var hasFilterableList = document.querySelector('.post-card, .archive-post');

    if (hasFilterableList) {
        applyLangFilter(currentLang());
    }

    /* ---------- Table of contents ---------- */

    var tocContainer = document.getElementById('post-toc');
    var tocNav = document.getElementById('toc-nav');
    var postContent = document.getElementById('post-content');
    if (tocContainer && tocNav && postContent) {
        var headings = postContent.querySelectorAll('h2, h3');
        if (headings.length >= 2) {
            tocContainer.hidden = false;
            headings.forEach(function (h, i) {
                if (!h.id) h.id = 'section-' + i;
                var link = document.createElement('a');
                link.href = '#' + h.id;
                link.textContent = h.textContent;
                link.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
                tocNav.appendChild(link);
            });

            // Scroll spy
            var tocLinks = tocNav.querySelectorAll('a');
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        tocLinks.forEach(function (l) {
                            l.classList.toggle('is-active', l.hash === '#' + entry.target.id);
                        });
                    }
                });
            }, { rootMargin: '-80px 0px -70% 0px' });
            headings.forEach(function (h) { observer.observe(h); });
        }
    }

    /* ---------- Copy button on code blocks ---------- */

    document.querySelectorAll('.post-content pre').forEach(function (pre) {
        var button = document.createElement('button');
        button.className = 'copy-code-button';
        button.type = 'button';
        button.textContent = I18N[currentLang()].copy;
        button.addEventListener('click', function () {
            var code = pre.querySelector('code');
            navigator.clipboard.writeText(code ? code.innerText : pre.innerText).then(function () {
                button.textContent = I18N[currentLang()].copied;
                button.classList.add('is-copied');
                setTimeout(function () {
                    button.textContent = I18N[currentLang()].copy;
                    button.classList.remove('is-copied');
                }, 2000);
            });
        });
        pre.appendChild(button);
    });

    /* ---------- Search ---------- */

    var overlay = document.getElementById('search-overlay');
    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');
    var searchIndex = null;

    function openSearch() {
        if (!overlay) return;
        overlay.hidden = false;
        searchInput.focus();
        if (!searchIndex) {
            fetch('/search.json')
                .then(function (r) { return r.json(); })
                .then(function (data) { searchIndex = data; });
        }
    }

    function closeSearch() {
        if (!overlay) return;
        overlay.hidden = true;
        searchInput.value = '';
        renderHint();
    }

    function renderHint() {
        searchResults.innerHTML = '<p class="search-hint">' + I18N[currentLang()].search_hint + '</p>';
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function runSearch(query) {
        if (!searchIndex || query.length < 2) {
            renderHint();
            return;
        }
        var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        var lang = currentLang();
        var scored = [];
        searchIndex.forEach(function (post) {
            if (post.lang !== lang) return;
            var title = post.title.toLowerCase();
            var body = post.content.toLowerCase();
            var tags = (post.tags || []).join(' ').toLowerCase();
            var score = 0;
            var matchesAll = terms.every(function (t) {
                var inTitle = title.indexOf(t) !== -1;
                var inTags = tags.indexOf(t) !== -1;
                var inBody = body.indexOf(t) !== -1;
                if (inTitle) score += 10;
                if (inTags) score += 5;
                if (inBody) score += 1;
                return inTitle || inTags || inBody;
            });
            if (matchesAll) scored.push({ post: post, score: score });
        });
        scored.sort(function (a, b) { return b.score - a.score; });

        if (!scored.length) {
            searchResults.innerHTML = '<p class="search-empty">' + I18N[currentLang()].search_empty + ' “' + escapeHtml(query) + '”</p>';
            return;
        }
        searchResults.innerHTML = scored.slice(0, 10).map(function (item) {
            var p = item.post;
            var title = escapeHtml(p.title);
            terms.forEach(function (t) {
                title = title.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
            });
            return '<a class="search-result" href="' + p.url + '">' +
                '<span class="result-title">' + title + '</span>' +
                '<span class="result-meta">' + p.date + ' · ' + (p.lang || 'en').toUpperCase() +
                (p.tags && p.tags.length ? ' · #' + p.tags.slice(0, 3).join(' #') : '') + '</span>' +
                '</a>';
        }).join('');
    }

    if (overlay) {
        document.getElementById('search-open').addEventListener('click', openSearch);
        document.getElementById('search-close').addEventListener('click', closeSearch);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeSearch();
        });
        searchInput.addEventListener('input', function () { runSearch(searchInput.value.trim()); });
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                overlay.hidden ? openSearch() : closeSearch();
            }
            if (e.key === 'Escape' && !overlay.hidden) closeSearch();
        });
    }
})();

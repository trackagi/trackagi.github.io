/**
 * AGI Progress Tracker
 * Compact timeline UI with click-to-expand milestone rows.
 */

(function () {
  'use strict';

  document.documentElement.classList.add('js-enabled');

  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TAG_LIMIT = 16;

  var ORG_COLORS = {
    'OpenAI': '#0f766e',
    'Google': '#2563eb',
    'Google DeepMind': '#4338ca',
    'Anthropic': '#b45309',
    'Meta AI': '#1d4ed8',
    'Microsoft': '#0f766e',
    'DeepSeek': '#4f46e5',
    'Mistral AI': '#c2410c',
    'Stability AI': '#7c3aed',
    'GitHub': '#111827',
    'xAI': '#6d28d9'
  };

  var state = {
    data: window.AGI_DATA || { milestones: [], meta: {}, indexes: {} },
    filters: { timeView: 'year', level: 'all', organization: 'all', search: '', tags: new Set() },
    expanded: new Set(),
    filtersOpen: false,
    observer: null
  };

  var el = {
    timeline: document.getElementById('timeline'),
    timeView: document.getElementById('time-view'),
    levelFilter: document.getElementById('level-filter'),
    orgFilter: document.getElementById('org-filter'),
    searchInput: document.getElementById('search'),
    tagList: document.getElementById('tag-list'),
    filtersPanel: document.getElementById('filters-panel'),
    filtersToggle: document.getElementById('filters-toggle'),
    resultsSummary: document.getElementById('results-summary'),
    clearFilters: document.getElementById('clear-filters')
  };

  function init() {
    populateFilters();
    setupObserver();
    bindEvents();
    syncFilterPanel();
    render();
  }

  function setupObserver() {
    if (!('IntersectionObserver' in window)) return;
    state.observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          state.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' });
  }

  function bindEvents() {
    if (el.searchInput) {
      el.searchInput.addEventListener('input', function (e) {
        state.filters.search = e.target.value.trim().toLowerCase();
        render();
      });
    }

    if (el.timeView) {
      el.timeView.addEventListener('change', function (e) {
        state.filters.timeView = e.target.value;
        render();
      });
    }

    if (el.levelFilter) {
      el.levelFilter.addEventListener('change', function (e) {
        state.filters.level = e.target.value;
        render();
      });
    }

    if (el.orgFilter) {
      el.orgFilter.addEventListener('change', function (e) {
        state.filters.organization = e.target.value;
        render();
      });
    }

    if (el.tagList) {
      el.tagList.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-tag]');
        if (btn) toggleTag(btn.dataset.tag);
      });
    }

    if (el.filtersToggle) {
      el.filtersToggle.addEventListener('click', function () {
        state.filtersOpen = !state.filtersOpen;
        syncFilterPanel();
      });
    }

    if (el.clearFilters) {
      el.clearFilters.addEventListener('click', clearFilters);
    }

    if (el.timeline) {
      el.timeline.addEventListener('click', function (e) {
        // Don't toggle when clicking links inside expanded content
        if (e.target.closest('a')) return;
        var card = e.target.closest('.milestone-card');
        if (!card) return;
        var id = card.dataset.id;
        if (id) toggleExpanded(id);
      });
    }
  }

  function populateFilters() {
    if (el.orgFilter) {
      (state.data.meta.organizations || []).forEach(function (org) {
        var opt = document.createElement('option');
        opt.value = org;
        opt.textContent = org;
        el.orgFilter.appendChild(opt);
      });
    }

    if (el.tagList) {
      getPopularTags(state.data.milestones, TAG_LIMIT).forEach(function (tag) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag-chip';
        btn.dataset.tag = tag;
        btn.textContent = tag;
        el.tagList.appendChild(btn);
      });
    }
  }

  function getPopularTags(milestones, limit) {
    var counts = new Map();
    milestones.forEach(function (m) {
      m.tags.forEach(function (t) { counts.set(t, (counts.get(t) || 0) + 1); });
    });
    return Array.from(counts.entries())
      .sort(function (a, b) { return b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0]); })
      .slice(0, limit)
      .map(function (pair) { return pair[0]; });
  }

  function toggleTag(tag) {
    state.filters.tags.has(tag) ? state.filters.tags.delete(tag) : state.filters.tags.add(tag);
    render();
  }

  function toggleExpanded(id) {
    state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
    render();
  }

  function clearFilters() {
    state.filters = { timeView: 'year', level: 'all', organization: 'all', search: '', tags: new Set() };
    if (el.timeView) el.timeView.value = 'year';
    if (el.levelFilter) el.levelFilter.value = 'all';
    if (el.orgFilter) el.orgFilter.value = 'all';
    if (el.searchInput) el.searchInput.value = '';
    render();
  }

  function syncFilterPanel() {
    if (!el.filtersPanel || !el.filtersToggle) return;
    el.filtersPanel.classList.toggle('is-open', state.filtersOpen);
    el.filtersToggle.setAttribute('aria-expanded', String(state.filtersOpen));
    el.filtersToggle.textContent = state.filtersOpen ? 'Hide filters' : 'Filters';
  }

  function milestoneId(m) { return m.date + '::' + m.title; }

  function searchText(m) {
    return [m.title, m.organization, m.description, (m.highlights || []).join(' '), m.tags.join(' ')].join(' ').toLowerCase();
  }

  function getFiltered() {
    return state.data.milestones.filter(function (m) {
      if (state.filters.level !== 'all' && m.level !== state.filters.level) return false;
      if (state.filters.organization !== 'all' && m.organization !== state.filters.organization) return false;
      if (state.filters.tags.size > 0 && !m.tags.some(function (t) { return state.filters.tags.has(t); })) return false;
      if (state.filters.search && !searchText(m).includes(state.filters.search)) return false;
      return true;
    }).sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  function groupMilestones(milestones) {
    var grouped = {};
    milestones.forEach(function (m) {
      var key = state.filters.timeView === 'year' ? m.date.slice(0, 4) :
                state.filters.timeView === 'month' ? m.date.slice(0, 7) : 'All';
      grouped[key] = grouped[key] || [];
      grouped[key].push(m);
    });
    var keys = Object.keys(grouped).sort(function (a, b) { return b.localeCompare(a); });
    return { grouped: grouped, keys: keys };
  }

  function fmtShort(d) {
    var parts = d.split('-');
    return MONTH_SHORT[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10);
  }

  function fmtGroupLabel(key) {
    if (state.filters.timeView === 'month') {
      var parts = key.split('-');
      return MONTH_NAMES[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }
    return state.filters.timeView === 'all' ? 'All milestones' : key;
  }

  function orgColor(org) { return ORG_COLORS[org] || '#6b7280'; }

  function renderHighlights(highlights) {
    if (!highlights || !highlights.length) return '';
    return '<section class="detail-block"><h3>Highlights</h3><ul class="detail-list">' +
      highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') +
      '</ul></section>';
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return '';
    return '<section class="detail-block"><h3>Tags</h3><div class="milestone-tags">' +
      tags.map(function (t) { return '<span class="milestone-tag">' + esc(t) + '</span>'; }).join('') +
      '</div></section>';
  }

  function renderSources(sources) {
    if (!sources || !sources.length) return '';
    return '<section class="detail-block"><h3>Sources</h3><ul class="source-list">' +
      sources.map(function (s) {
        return '<li><a href="' + escAttr(s.url || '#') + '" target="_blank" rel="noreferrer">' + esc(s.title || 'Source') + '</a></li>';
      }).join('') +
      '</ul></section>';
  }

  function createCard(m) {
    var id = milestoneId(m);
    var expanded = state.expanded.has(id);
    var year = m.date.split('-')[0];

    return '<article class="milestone-card' + (expanded ? ' is-expanded' : '') + '" data-id="' + escAttr(id) + '" style="--dot-color:' + orgColor(m.organization) + '">' +
      '<div class="milestone-shell">' +
        '<div class="milestone-rail">' +
          '<time class="milestone-date" datetime="' + escAttr(m.date) + '">' +
            '<span class="milestone-date-main">' + esc(fmtShort(m.date)) + '</span>' +
            '<span class="milestone-date-year">' + esc(year) + '</span>' +
          '</time>' +
        '</div>' +
        '<div class="milestone-main">' +
          '<div class="milestone-header">' +
            '<div class="milestone-title-row">' +
              '<h2 class="milestone-title">' + esc(m.title) + '</h2>' +
              '<span class="milestone-org">' + esc(m.organization) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="milestone-details">' +
            '<div class="milestone-details-inner">' +
              '<section class="detail-block detail-block-intro">' +
                '<h3>Description</h3>' +
                '<p>' + esc(m.description) + '</p>' +
              '</section>' +
              renderHighlights(m.highlights) +
              renderSources(m.sources) +
              renderTags(m.tags) +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function createSection(key, milestones) {
    var label = fmtGroupLabel(key);
    return '<section class="feed-section">' +
      '<header class="section-header">' +
        '<h2>' + esc(label) + '</h2>' +
        '<span class="section-count">' + milestones.length + ' milestone' + (milestones.length === 1 ? '' : 's') + '</span>' +
      '</header>' +
      '<div class="section-stack">' + milestones.map(createCard).join('') + '</div>' +
    '</section>';
  }

  function updateSummary(count) {
    if (!el.resultsSummary || !el.clearFilters) return;
    var total = state.data.meta.total_milestones || 0;
    var active = [];
    if (state.filters.level !== 'all') active.push(state.filters.level + ' signal');
    if (state.filters.organization !== 'all') active.push(state.filters.organization);
    if (state.filters.tags.size > 0) active.push(state.filters.tags.size + ' tag' + (state.filters.tags.size === 1 ? '' : 's'));
    if (state.filters.search) active.push('search');
    var suffix = active.length ? ' for ' + active.join(', ') : '';
    el.resultsSummary.textContent = 'Showing ' + count + ' of ' + total + ' milestones' + suffix + '.';
    el.clearFilters.hidden = active.length === 0;
  }

  function updateTagButtons() {
    if (!el.tagList) return;
    el.tagList.querySelectorAll('[data-tag]').forEach(function (btn) {
      var active = state.filters.tags.has(btn.dataset.tag);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function observeCards() {
    if (!state.observer || !el.timeline) return;
    state.observer.disconnect();
    el.timeline.querySelectorAll('.milestone-card').forEach(function (card) {
      state.observer.observe(card);
    });
  }

  function render() {
    var filtered = getFiltered();
    updateSummary(filtered.length);
    updateTagButtons();
    if (!el.timeline) return;

    if (!filtered.length) {
      el.timeline.innerHTML = '<section class="empty-state">' +
        '<p class="section-eyebrow">No results</p>' +
        '<h2>No milestones match the current filters.</h2>' +
        '<p>Try clearing filters or broadening the search terms.</p>' +
      '</section>';
      return;
    }

    var g = groupMilestones(filtered);
    el.timeline.innerHTML = g.keys.map(function (k) { return createSection(k, g.grouped[k]); }).join('');
    observeCards();
  }

  function esc(v) {
    if (v == null) return '';
    var d = document.createElement('div');
    d.textContent = String(v);
    return d.innerHTML;
  }

  function escAttr(v) { return esc(v).replace(/"/g, '&quot;'); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

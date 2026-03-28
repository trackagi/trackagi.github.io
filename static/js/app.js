/**
 * AGI Progress Tracker
 * Compact timeline UI with title-first rows and progressive detail disclosure.
 */

(function () {
  'use strict';

  document.documentElement.classList.add('js-enabled');

  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TAG_LIMIT = 16;

  const state = {
    data: window.AGI_DATA || { milestones: [], meta: {}, indexes: {} },
    filters: {
      timeView: 'year',
      level: 'all',
      organization: 'all',
      search: '',
      tags: new Set()
    },
    expanded: new Set(),
    filtersOpen: false,
    observer: null
  };

  const elements = {
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
    if (!('IntersectionObserver' in window)) {
      return;
    }

    state.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          state.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -32px 0px'
    });
  }

  function bindEvents() {
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (event) => {
        state.filters.search = event.target.value.trim().toLowerCase();
        render();
      });
    }

    if (elements.timeView) {
      elements.timeView.addEventListener('change', (event) => {
        state.filters.timeView = event.target.value;
        render();
      });
    }

    if (elements.levelFilter) {
      elements.levelFilter.addEventListener('change', (event) => {
        state.filters.level = event.target.value;
        render();
      });
    }

    if (elements.orgFilter) {
      elements.orgFilter.addEventListener('change', (event) => {
        state.filters.organization = event.target.value;
        render();
      });
    }

    if (elements.tagList) {
      elements.tagList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-tag]');
        if (!button) {
          return;
        }

        toggleTag(button.dataset.tag);
      });
    }

    if (elements.filtersToggle) {
      elements.filtersToggle.addEventListener('click', () => {
        state.filtersOpen = !state.filtersOpen;
        syncFilterPanel();
      });
    }

    if (elements.clearFilters) {
      elements.clearFilters.addEventListener('click', clearFilters);
    }

    if (elements.timeline) {
      elements.timeline.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-action="toggle-details"]');
        if (!trigger) {
          return;
        }

        toggleExpanded(trigger.dataset.id);
      });
    }
  }

  function populateFilters() {
    if (elements.orgFilter) {
      (state.data.meta.organizations || []).forEach((organization) => {
        const option = document.createElement('option');
        option.value = organization;
        option.textContent = organization;
        elements.orgFilter.appendChild(option);
      });
    }

    if (elements.tagList) {
      getPopularTags(state.data.milestones, TAG_LIMIT).forEach((tag) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tag-chip';
        button.dataset.tag = tag;
        button.textContent = tag;
        elements.tagList.appendChild(button);
      });
    }
  }

  function getPopularTags(milestones, limit) {
    const counts = new Map();

    milestones.forEach((milestone) => {
      milestone.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }
        return left[0].localeCompare(right[0]);
      })
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  function toggleTag(tag) {
    if (state.filters.tags.has(tag)) {
      state.filters.tags.delete(tag);
    } else {
      state.filters.tags.add(tag);
    }

    render();
  }

  function toggleExpanded(id) {
    if (state.expanded.has(id)) {
      state.expanded.delete(id);
    } else {
      state.expanded.add(id);
    }

    render();
  }

  function clearFilters() {
    state.filters.timeView = 'year';
    state.filters.level = 'all';
    state.filters.organization = 'all';
    state.filters.search = '';
    state.filters.tags.clear();

    if (elements.timeView) {
      elements.timeView.value = state.filters.timeView;
    }
    if (elements.levelFilter) {
      elements.levelFilter.value = state.filters.level;
    }
    if (elements.orgFilter) {
      elements.orgFilter.value = state.filters.organization;
    }
    if (elements.searchInput) {
      elements.searchInput.value = '';
    }

    render();
  }

  function syncFilterPanel() {
    if (!elements.filtersPanel || !elements.filtersToggle) {
      return;
    }

    elements.filtersPanel.classList.toggle('is-open', state.filtersOpen);
    elements.filtersToggle.setAttribute('aria-expanded', String(state.filtersOpen));
    elements.filtersToggle.textContent = state.filtersOpen ? 'Hide filters' : 'Filters';
  }

  function getMilestoneId(milestone) {
    return `${milestone.date}::${milestone.title}`;
  }

  function getSearchText(milestone) {
    return [
      milestone.title,
      milestone.organization,
      milestone.description,
      (milestone.highlights || []).join(' '),
      milestone.tags.join(' ')
    ]
      .join(' ')
      .toLowerCase();
  }

  function getFilteredMilestones() {
    return state.data.milestones
      .filter((milestone) => {
        if (state.filters.level !== 'all' && milestone.level !== state.filters.level) {
          return false;
        }

        if (
          state.filters.organization !== 'all' &&
          milestone.organization !== state.filters.organization
        ) {
          return false;
        }

        if (state.filters.tags.size > 0) {
          const hasSelectedTag = milestone.tags.some((tag) => state.filters.tags.has(tag));
          if (!hasSelectedTag) {
            return false;
          }
        }

        if (state.filters.search) {
          return getSearchText(milestone).includes(state.filters.search);
        }

        return true;
      })
      .sort((left, right) => right.date.localeCompare(left.date));
  }

  function groupMilestones(milestones) {
    const grouped = {};

    milestones.forEach((milestone) => {
      let key = 'Latest';

      if (state.filters.timeView === 'year') {
        key = milestone.date.slice(0, 4);
      } else if (state.filters.timeView === 'month') {
        key = milestone.date.slice(0, 7);
      }

      grouped[key] = grouped[key] || [];
      grouped[key].push(milestone);
    });

    const keys = Object.keys(grouped).sort((left, right) => right.localeCompare(left));
    return { grouped, keys };
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${MONTH_NAMES[Number.parseInt(month, 10) - 1]} ${Number.parseInt(day, 10)}, ${year}`;
  }

  function formatShortDate(dateString) {
    const [, month, day] = dateString.split('-');
    return `${MONTH_SHORT_NAMES[Number.parseInt(month, 10) - 1]} ${Number.parseInt(day, 10)}`;
  }

  function formatGroupLabel(groupKey) {
    if (state.filters.timeView === 'month') {
      const [year, month] = groupKey.split('-');
      return `${MONTH_NAMES[Number.parseInt(month, 10) - 1]} ${year}`;
    }

    if (state.filters.timeView === 'all') {
      return 'Continuous view';
    }

    return groupKey;
  }

  function getSummary(description) {
    const normalized = description.replace(/\s+/g, ' ').trim();
    const sentenceEnd = normalized.indexOf('. ');

    if (sentenceEnd > 0 && sentenceEnd + 1 <= 180) {
      return normalized.slice(0, sentenceEnd + 1);
    }

    if (normalized.length <= 200) {
      return normalized;
    }

    const snippet = normalized.slice(0, 197);
    const boundary = snippet.lastIndexOf(' ');
    return `${snippet.slice(0, boundary > 120 ? boundary : snippet.length).trim()}...`;
  }

  function getAccentColor(organization) {
    const colors = {
      OpenAI: '#0f766e',
      Google: '#2563eb',
      'Google DeepMind': '#4338ca',
      Anthropic: '#b45309',
      'Meta AI': '#1d4ed8',
      Microsoft: '#0f766e',
      DeepSeek: '#4f46e5',
      'Mistral AI': '#c2410c',
      'Stability AI': '#7c3aed',
      GitHub: '#111827'
    };

    return colors[organization] || '#4b5563';
  }

  function renderDetailHighlights(highlights) {
    if (!highlights || highlights.length === 0) {
      return '';
    }

    const items = highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('');
    return `
      <section class="detail-block">
        <h3>Highlights</h3>
        <ul class="detail-list">${items}</ul>
      </section>
    `;
  }

  function renderDetailTags(tags) {
    if (!tags || tags.length === 0) {
      return '';
    }

    const items = tags.map((tag) => `<span class="milestone-tag">${escapeHtml(tag)}</span>`).join('');
    return `
      <section class="detail-block">
        <h3>Tags</h3>
        <div class="milestone-tags">${items}</div>
      </section>
    `;
  }

  function renderSources(sources) {
    if (!sources || sources.length === 0) {
      return '';
    }

    const items = sources
      .map((source) => {
        const title = escapeHtml(source.title || source.url || 'Source');
        const url = escapeAttribute(source.url || '#');
        return `<li><a href="${url}" target="_blank" rel="noreferrer">${title}</a></li>`;
      })
      .join('');

    return `
      <section class="detail-block">
        <h3>Sources</h3>
        <ul class="source-list">${items}</ul>
      </section>
    `;
  }

  function createMilestoneCard(milestone) {
    const id = getMilestoneId(milestone);
    const isExpanded = state.expanded.has(id);
    const [year] = milestone.date.split('-');

    return `
      <article
        class="milestone-card${isExpanded ? ' is-expanded' : ''}"
        data-id="${escapeAttribute(id)}"
        style="--accent:${getAccentColor(milestone.organization)}"
      >
        <div class="milestone-shell">
          <div class="milestone-rail">
            <time class="milestone-date" datetime="${escapeAttribute(milestone.date)}" aria-label="${escapeAttribute(formatDate(milestone.date))}">
              <span class="milestone-date-main">${escapeHtml(formatShortDate(milestone.date))}</span>
              <span class="milestone-date-year">${escapeHtml(year)}</span>
            </time>
          </div>

          <div class="milestone-main">
            <div class="milestone-header">
              <p class="milestone-meta">
                <span class="milestone-organization">${escapeHtml(milestone.organization)}</span>
                <span class="signal-pill signal-${milestone.level}">
                  ${milestone.level === 'high' ? 'High' : 'Low'}
                </span>
              </p>

              <div class="milestone-title-row">
                <h2 class="milestone-title">${escapeHtml(milestone.title)}</h2>
                <button
                  type="button"
                  class="detail-toggle"
                  data-action="toggle-details"
                  data-id="${escapeAttribute(id)}"
                  aria-expanded="${isExpanded ? 'true' : 'false'}"
                >
                  ${isExpanded ? 'Less' : 'Details'}
                </button>
              </div>
            </div>

            <div class="milestone-details">
              <div class="milestone-details-inner">
                <section class="detail-block detail-block-intro">
                  <h3>Summary</h3>
                  <p>${escapeHtml(getSummary(milestone.description))}</p>
                </section>
                <section class="detail-block">
                  <h3>Why it mattered</h3>
                  <p>${escapeHtml(milestone.description)}</p>
                </section>
                ${renderDetailHighlights(milestone.highlights)}
                ${renderDetailTags(milestone.tags)}
                ${renderSources(milestone.sources)}
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function createSection(groupKey, milestones) {
    const label = formatGroupLabel(groupKey);
    const cards = milestones.map((milestone) => createMilestoneCard(milestone)).join('');

    return `
      <section class="feed-section">
        <header class="section-header">
          <h2>${escapeHtml(label)}</h2>
          <span class="section-count">${milestones.length} milestone${milestones.length === 1 ? '' : 's'}</span>
        </header>
        <div class="section-stack">${cards}</div>
      </section>
    `;
  }

  function updateResultsSummary(filteredCount) {
    if (!elements.resultsSummary || !elements.clearFilters) {
      return;
    }

    const total = state.data.meta.total_milestones || 0;
    const activeFilters = [];

    if (state.filters.level !== 'all') {
      activeFilters.push(state.filters.level === 'high' ? 'high signal' : 'low signal');
    }
    if (state.filters.organization !== 'all') {
      activeFilters.push(state.filters.organization);
    }
    if (state.filters.tags.size > 0) {
      activeFilters.push(`${state.filters.tags.size} tag${state.filters.tags.size === 1 ? '' : 's'}`);
    }
    if (state.filters.search) {
      activeFilters.push('search');
    }

    const filterText = activeFilters.length > 0 ? ` for ${activeFilters.join(', ')}` : '';
    elements.resultsSummary.textContent = `Showing ${filteredCount} of ${total} milestones${filterText}.`;
    elements.clearFilters.hidden = activeFilters.length === 0;
  }

  function updateTagButtons() {
    if (!elements.tagList) {
      return;
    }

    elements.tagList.querySelectorAll('[data-tag]').forEach((button) => {
      const isActive = state.filters.tags.has(button.dataset.tag);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function observeCards() {
    if (!state.observer || !elements.timeline) {
      return;
    }

    state.observer.disconnect();
    elements.timeline.querySelectorAll('.milestone-card').forEach((card) => {
      state.observer.observe(card);
    });
  }

  function render() {
    const filteredMilestones = getFilteredMilestones();
    updateResultsSummary(filteredMilestones.length);
    updateTagButtons();

    if (!elements.timeline) {
      return;
    }

    if (filteredMilestones.length === 0) {
      elements.timeline.innerHTML = `
        <section class="empty-state">
          <p class="section-eyebrow">No results</p>
          <h2>No milestones match the current filters.</h2>
          <p>Try clearing filters or broadening the search terms.</p>
        </section>
      `;
      return;
    }

    const { grouped, keys } = groupMilestones(filteredMilestones);
    elements.timeline.innerHTML = keys
      .map((groupKey) => createSection(groupKey, grouped[groupKey]))
      .join('');

    observeCards();
  }

  function escapeHtml(value) {
    if (value == null) {
      return '';
    }

    const element = document.createElement("div");
    element.textContent = String(value);
    return element.innerHTML;
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

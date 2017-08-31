(() => {
  // TODO: show a message 'zoom in to see cities'.

  const TABLE_OPTIONS = {
    id: 'modal-table',
    item: 'modal-table-row-template',
    valueNames: ['location', 'role', 'experience', 'salary', 'gender'],
  };

  const model = {
    page: {
      loading: true,
    },
    statistics: {
      onShowAllCompanies: onShowAllCompanies,
      onShowAllRoles: onShowAllRoles,
    },
    table: {
      show: false,
      onTableLinkClick,
      onModalCloseClick,
    },
  };

  const minShownCompanies = 5;
  const minShownRoles = 3;

  const bindModel = () => {
    const container = document.querySelector('main');

    rivets.bind(
      container,
      model
    );
  };

  const initFormatters = () => {
    rivets.formatters.location = function (location) {
      if (!location) {
        return 'All world countries';
      }
      const {city, country} = location;
      if (city) {
        return `${city}, ${country.name}`;
      }
      return country;
    };

    rivets.formatters.companies = function (values, showAll) {
      if (!values) {
        return '';
      }
      if (showAll) {
        return values.join(', ');
      }
      return values.slice(0, minShownCompanies).join(', ');
    };

    rivets.formatters.roles = function (values, showAll) {
      if (!values) {
        return '';
      }
      if (showAll) {
        return values
          .map((val) => `${val.name} (${val.count})`)
          .join(', ');
      }
      return values
        .slice(0, minShownRoles)
        .map((val) => `${val.name} (${val.count})`)
        .join(', ');
    };

    rivets.formatters.showAll = function (value) {
      return value
        ? 'hide all'
        : 'show all';
    };
  };

  const initDataGraphs = (statistics) => {
    DS.Sparkline.init('net-salary', statistics.netSalary, statistics.grossSalary);
    DS.Sparkline.init('gross-salary', statistics.grossSalary, statistics.netSalary);
    DS.BarGraph.init('years-company', statistics.companyYears);
    DS.BarGraph.init('years-total', statistics.expYears);
  };

  const sortYearsArray = (years) => {
    return years.sort((a, b) => {
      if (a.name[0] === '<' || b.name[0] === '>') { return -1; }
      if (a.name[0] === '>' || b.name[0] === '<') { return 1; }
      return a.name - b.name;
    });
  };

  const updateStatistics = (statistics, newStats, location) => {
    statistics.location = location;
    statistics.gender = newStats.gender.reduce((res, item) => {
      res[item.name] = item.count;
      return res;
    }, {});
    statistics.netSalary = newStats.netSalary;
    statistics.grossSalary = newStats.grossSalary;
    statistics.company = location && newStats.company.length
      ? {
        values: newStats.company.sort((a, b) => a.localeCompare(b)),
        showAll: newStats.company.length <= minShownCompanies,
        visible: newStats.company.length > minShownCompanies
      }
      : null,
    statistics.role = {
      values: newStats.role.sort((a, b) => b.count - a.count),
      showAll: newStats.role.length <= minShownRoles,
      visible: newStats.role.length > minShownRoles
    };
    statistics.companyYears = sortYearsArray(newStats.companyYears);
    statistics.expYears = sortYearsArray(newStats.expYears);
    statistics.source = newStats.source;
  };

  const setupTableSearch = (list) => {
    const oldSearchInput = document.querySelector('.vis-table-modal-search .fuzzy-search');
    const searchInput = oldSearchInput.cloneNode(true);

    // Replace node to reset events.
    oldSearchInput.parentNode.replaceChild(searchInput, oldSearchInput);

    searchInput.addEventListener('input', () => {
      list.fuzzySearch(searchInput.value);
    });
  };

  const initDownloadLink = () => {
    const downloadLink = document.querySelector('.download-link');
    const json = DS.DataApi.getRawData();
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;

    downloadLink.setAttribute('href', href);
  };

  function onShowAllCompanies() {
    model.statistics.company.showAll = !model.statistics.company.showAll;
  }

  function onShowAllRoles() {
    model.statistics.role.showAll = !model.statistics.role.showAll;
  }

  function onTableLinkClick() {
    const tableId = TABLE_OPTIONS.id;
    const values = DS.DataApi.formatForTable(model.statistics.source);
    const list = new List(tableId, TABLE_OPTIONS, values);

    // Sort by location by default.
    list.sort('location', { order: 'asc' });

    setupTableSearch(list);
    model.table.show = true;
  }

  function onModalCloseClick() {
    const tableId = TABLE_OPTIONS.id;
    const table = document.querySelector(`#${tableId}`);
    const tbody = table.querySelector('tbody');

    model.table.show = false;

    // Clear table data after modal close.
    while (tbody.hasChildNodes()) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const tableContainer = document.querySelector('.vis-table-link');

    initFormatters();
    bindModel();

    window.addEventListener('resize', function() {
      DS.WorldMap.resize();
    });

    const onSelectLocation = (id, name) => {
      const { statistics } = model;

      if (id) {
        if (typeof(id) === 'string') {
          const newStats = DS.DataApi.getCountryData(id);
          updateStatistics(statistics, newStats, { country: name });
          initDataGraphs(statistics);
        } else {
          const newStats = DS.DataApi.getCityData({city: name.city, country: name.country, coords: id});
          updateStatistics(statistics, newStats, { city: name.city, country: name.country });
          initDataGraphs(statistics);
        }
      } else {
        const newStats = DS.DataApi.getWorldData();
        updateStatistics(statistics, newStats, null);
        initDataGraphs(statistics);
      }
    };

    DS.DataApi.init(firebase).then(() => {
      const countries = DS.DataApi.getEnabledCountries();
      DS.WorldMap.init(onSelectLocation, countries);

      onSelectLocation();
      model.page.loading = false;

      // When data is available, enable download link in the header.
      initDownloadLink();
    });
  });
})();

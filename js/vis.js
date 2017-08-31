(() => {
  // TODO: show a message 'zoom in to see cities'.

  const MODAL_TABLE_ID = 'modal-table';
  const DATA_TABLE_ID = 'data-table';
  const TABLE_OPTIONS = {
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
    hint: {
      class: '',
    }
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

  const initDataTable = (statistics) => {
    const table = document.querySelector(`#${DATA_TABLE_ID}`);
    const tbody = table.querySelector('tbody');

    // Clear table data before new data is filled.
    while (tbody.hasChildNodes()) {
      tbody.removeChild(tbody.lastChild);
    }

    const values = DS.DataApi.formatForTable(statistics.source);
    const list = new List(DATA_TABLE_ID, TABLE_OPTIONS, values);

    // Sort by salary by default.
    list.sort('salary', { order: 'desc' });
  };

  const sortYearsArray = (years) => {
    return years.sort((a, b) => {
      if (a.name[0] === '<' || b.name[0] === '>') { return -1; }
      if (a.name[0] === '>' || b.name[0] === '<') { return 1; }
      return a.name - b.name;
    });
  };

  const updateStatistics = (statistics, newStats, location) => {
    if (!newStats.empty) {
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
    }

    statistics.location = location;
    statistics.source = newStats.source;
    statistics.showCharts = !newStats.empty;
    statistics.showTable = newStats.empty;
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
    const values = DS.DataApi.formatForTable(model.statistics.source);
    const list = new List(MODAL_TABLE_ID, TABLE_OPTIONS, values);

    // Sort by location by default.
    list.sort('location', { order: 'asc' });

    setupTableSearch(list);
    model.table.show = true;
  }

  function onModalCloseClick() {
    const table = document.querySelector(`#${MODAL_TABLE_ID}`);
    const tbody = table.querySelector('tbody');

    model.table.show = false;

    // Clear table data after modal close.
    while (tbody.hasChildNodes()) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initFormatters();
    bindModel();

    window.addEventListener('resize', function() {
      DS.WorldMap.resize();
    });

    const onSelectLocation = (query) => {
      const { statistics } = model;

      // Country location object.
      const isCountry = query && query.code;

      // City location object.
      const isCity = query && query.city;

      // We do different API calls depending on query.
      let getData = DS.DataApi.getWorldData.bind(DS.DataApi);
      let params = null;
      let loc = null;

      if (isCountry) {
        getData = DS.DataApi.getCountryData.bind(DS.DataApi);
        loc = { country: query.name };
        params = query.code;
      } else if (isCity) {
        const { country, city } = query;

        getData = DS.DataApi.getCityData.bind(DS.DataApi);
        loc = { city, country };
        params = { city, country, coords: query.coords };
      }

      // Get new statistics from API.
      const newStats = getData(params);

      // Update graphs and right panel.
      updateStatistics(statistics, newStats, loc);

      if (newStats.empty) {
        initDataTable(statistics);
      } else {
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

    setTimeout(() => {
      model.hint.class = '__hidden';
    }, 4000);
  });
})();

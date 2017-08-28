(() => {
  const coverContainer = document.getElementById('cover');
  const page = {
    loading: true
  };
  rivets.bind(
    coverContainer,
    {page}
  );

  const minShownCompanies = 5;
  const minShownRoles = 3;
  const initFormatters = () => {
    rivets.formatters.location = function (location) {
      if (!location) {
        return 'All world countries';
      }
      const {city, country} = location;
      if (city) {
        return `${city}, ${country}`;
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
  };

  const initDataGraphs = (statistics) => {
    initSparkline('net-salary', statistics.netSalary, statistics.grossSalary);
    initSparkline('gross-salary', statistics.grossSalary, statistics.netSalary);
    initBarChart('years-company', statistics.companyYears);
    initBarChart('years-total', statistics.expYears);
  };

  const sortYearsArray = (years) => {
    return years.sort((a, b) => {
      if (a.name[0] === '<' || b.name[0] === '>') { return -1; }
      if (a.name[0] === '>' || b.name[0] === '<') { return 1; }
      return a.name - b.name;
    });
  };

  const updateStatistics = (statistics, newStats, location, isWorld) => {
    statistics.location = location;
    statistics.gender = newStats.gender.reduce((res, item) => {
      res[item.name] = item.count;
      return res;
    }, {});
    statistics.netSalary = newStats.netSalary;
    statistics.grossSalary = newStats.grossSalary;
    statistics.company = isWorld || !newStats.company.length
      ? null
      : {
        values: newStats.company.sort((a, b) => a.localeCompare(b)),
        showAll: newStats.company.length <= minShownCompanies
      },
    statistics.role = {
      values: newStats.role.sort((a, b) => b.count - a.count),
      showAll: newStats.role.length <= minShownRoles
    };
    statistics.companyYears = sortYearsArray(newStats.companyYears);
    statistics.expYears = sortYearsArray(newStats.expYears);
  };

  initFormatters();

  document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data');
    const map = worldMap();

    window.addEventListener('resize', function() {
      map.resizeMap();
    });

    const onShowAllCompanies = () => {
      statistics.company.showAll = true;
    };
    const onShowAllRoles = () => {
      statistics.role.showAll = true;
    };

    const statistics = {
      onShowAllCompanies: onShowAllCompanies,
      onShowAllRoles: onShowAllRoles
    };
    rivets.bind(
      dataContainer,
      {statistics}
    );

    const onSelectLocation = (id, name) => {
      const newStats = DS.DataApi.getCountryData(id);
      updateStatistics(statistics, newStats, { country: name });
    }

    DS.DataApi.init(firebase).then(() => {
      const countries = DS.DataApi.getEnabledCountries();
      map.initWorldMap(onSelectLocation, countries);

      const newStats = DS.DataApi.getWorldData();
      updateStatistics(statistics, newStats, null, true);
      initDataGraphs(statistics);
      page.loading = false;
    });
  });
})();

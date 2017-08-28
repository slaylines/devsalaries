(() => {
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
      return values.slice(0, 5).join(', ');
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
        .slice(0, 3)
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

  const onSelectLocation = (id) => {
    // id - 2 letter code
    // get data for location, fill in statistics object
  };

  const sortYearsArray = (years) => {
    return years.sort((a, b) => {
      if (a.name[0] === '<' || b.name[0] === '>') { return -1; }
      if (a.name[0] === '>' || b.name[0] === '<') { return 1; }
      return a.count - b.count;
    });
  };

  initFormatters();

  document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data');
    const map = worldMap();

    window.addEventListener('resize', function() {
      map.resizeMap();
    });

    const statistics = {
      loaded: false
    };
    rivets.bind(
      dataContainer,
      {statistics}
    );

    const onShowAllCompanies = () => {
      statistics.company.showAll = true;
    };
    const onShowAllRoles = () => {
      statistics.role.showAll = true;
    };

    DS.DataApi.init(firebase).then(() => {
      countries = DS.DataApi.getEnabledCountries();
      map.initWorldMap(onSelectLocation, countries);


      const newStats = DS.DataApi.getWorldData();
      statistics.location = newStats.location;
      statistics.gender = newStats.gender.reduce((res, item) => {
        res[item.name] = item.count;
        return res;
      }, {});
      statistics.netSalary = newStats.netSalary;
      statistics.grossSalary = newStats.grossSalary;
      statistics.company = null;
      statistics.role = {
        values: newStats.role.sort((a, b) => b.count - a.count),
        showAll: false
      };
      statistics.companyYears = sortYearsArray(newStats.companyYears);
      statistics.expYears = sortYearsArray(newStats.expYears);
      statistics.onShowAllCompanies = onShowAllCompanies;
      statistics.onShowAllRoles = onShowAllRoles;
      statistics.loaded = true;

      initDataGraphs(statistics);
    });
  });
})();

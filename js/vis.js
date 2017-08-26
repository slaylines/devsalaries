(() => {
  const getEntries = () => {
    const db = firebase.database();
    return db.ref('entries').once('value');
  };

  rivets.formatters.location = function (location) {
    if (!location) {
      return '';
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

  document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data');
    const statistics = {};

    rivets.bind(
      dataContainer,
      {statistics}
    );

    const onSelectCountry = (id) => {
      statistics.location = {
        city: 'Cupertino',
        country: 'United States'
      };
      statistics.count = {
        female: 10,
        male: 31,
        other: 1
      };
      statistics.netSalary = {
        min: 10000,
        max: 102000,
        average: 62000,
      };
      statistics.grossSalary = {
        min: 17800,
        max: 132000,
        average: 69000,
      };
      statistics.companies = {
        values: ['Apple', 'Microsoft', 'IBM', 'Google', 'Amazon', 'Abbyy', 'Skype', 'Facebook'],
        showAll: false
      };
      statistics.roles = {
        values: [
          {name: 'Backend Developer', count: 12},
          {name: 'Frontend Developer', count: 11},
          {name: 'Other', count: 7},
          {name: 'System Administrator', count: 5},
          {name: 'Full Stack Developer', count: 4},
          {name: 'DevOps', count: 2},
          {name: 'Data Analyst', count: 1}
        ],
        showAll: false
      };
      statistics.onShowAllCompanies = onShowAllCompanies;
      statistics.onShowAllRoles = onShowAllRoles;
      statistics.loaded = true;

      initSparkline('net-salary', statistics.netSalary, statistics.grossSalary);
      initSparkline('gross-salary', statistics.grossSalary, statistics.netSalary);
    };

    const onShowAllCompanies = () => {
      statistics.companies.showAll = true;
    };
    const onShowAllRoles = () => {
      statistics.roles.showAll = true;
    };

    initWorldMap(onSelectCountry);

  });
})();

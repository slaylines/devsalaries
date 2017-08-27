(() => {
  const getEntries = () => {
    const db = firebase.database();
    return db.ref('entries').once('value');
  };

  // init rivets formatters
  const initFormatters = () => {
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
  };

  initFormatters();

  document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('data');
    const map = worldMap();

    const onShowAllCompanies = () => {
      statistics.companies.showAll = true;
    };
    const onShowAllRoles = () => {
      statistics.roles.showAll = true;
    };

    const statistics = {
      location: {
        city: 'Cupertino',
        country: 'United States'
      },
      count: {
        female: 10,
        male: 31,
        other: 1
      },
      netSalary: {
        min: 10000,
        max: 102000,
        average: 62000,
      },
      grossSalary: {
        min: 17800,
        max: 132000,
        average: 69000,
      },
      companies: {
        values: ['Apple', 'Microsoft', 'IBM', 'Google', 'Amazon', 'Abbyy', 'Skype', 'Facebook'],
        showAll: false
      },
      roles: {
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
      },
      yearsCompany: [
        {name: '<1', count: 11},
        {name: '1', count: 8},
        {name: '2', count: 9},
        {name: '3', count: 4},
        {name: '4', count: 6},
        {name: '5', count: 3},
        {name: '>5', count: 1}
      ],
      yearsTotal: [
        {name: '<1', count: 3},
        {name: '1', count: 5},
        {name: '2', count: 7},
        {name: '3', count: 11},
        {name: '4', count: 5},
        {name: '5', count: 1},
        {name: '6', count: 0},
        {name: '7', count: 3},
        {name: '8', count: 4},
        {name: '9', count: 3},
        {name: '10', count: 1},
        {name: '>10', count: 2}
      ],
      onShowAllCompanies: onShowAllCompanies,
      onShowAllRoles: onShowAllRoles,
      loaded: true
    };

    rivets.bind(
      dataContainer,
      {statistics}
    );

    window.addEventListener('resize', function() {
      map.resizeMap();
    });

    const onSelectLocation = (id) => {
      // id - 2 letter code
      // get data for location, fill in statistics object
    };

    const countries = [
      {name: 'Germany', code: 'DE'},
      {name: 'Ireland', code: 'IE'},
      {name: 'Italy', code: 'IT'},
      {name: 'New Zealand', code: 'NZ'},
      {name: 'United States', code: 'US'}
    ];

    map.initWorldMap(onSelectLocation, countries);
    initSparkline('net-salary', statistics.netSalary, statistics.grossSalary);
    initSparkline('gross-salary', statistics.grossSalary, statistics.netSalary);
    initBarChart('years-company', statistics.yearsCompany);
    initBarChart('years-total', statistics.yearsTotal);
  });
})();

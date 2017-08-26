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

      initSparkline('net-salary', statistics.netSalary, statistics.grossSalary);
      initSparkline('gross-salary', statistics.grossSalary, statistics.netSalary);
    };

      //jobTitles,
      //companies

    initWorldMap(onSelectCountry);

  });
})();

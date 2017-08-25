(() => {
  const appendOptions = (select, values) => {
    values.forEach((value) => {
      const option = document.createElement('option');

      option.value = value;
      option.innerText = value;

      select.appendChild(option);
    });
  };

  const initCountries = () => {
    fetch('data/countries.json').then((response) => {
      return response.json();
    }).then((countries) => {
      const countrySelect = document.querySelector('#country');
      const citySelect = document.querySelector('#city');

      appendOptions(countrySelect, Object.keys(countries));

      countrySelect.addEventListener('change', (event) => {
        const cities = countries[countrySelect.value];

        while (citySelect.firstChild) {
          citySelect.removeChild(citySelect.firstChild);
        }

        appendOptions(citySelect, cities);
      });
    });
  };

  const initCurrencies = () => {
    fetch('data/currencies.json').then((response) => {
      return response.json();
    }).then((currencies) => {
      const currencySelect = document.querySelector('#currency');
      appendOptions(currencySelect, Object.keys(currencies));
    });
  };

  const initJobTitles = () => {
    fetch('data/job-titles.json').then((response) => {
      return response.json();
    }).then((jobTitles) => {
      const jobTitleSelect = document.querySelector('#job-title');
      appendOptions(jobTitleSelect, jobTitles);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCountries();
    initCurrencies();
    initJobTitles();
  });
})();

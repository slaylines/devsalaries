(() => {
  const parseFormData = (formData) => {
    const result = {};

    for (const [key, value] of formData) {
      result[key] = value;
    }

    return result;
  };

  const postEntry = (entry) => {
    const db = firebase.database();
    return db.ref().child('entries').push(entry);
  };

  const appendEmptyOption = (select, text) => {
    const option = document.createElement('option');

    option.value = '';
    option.innerText = text;

    select.appendChild(option);
  };

  const appendOptions = (select, values, text) => {
    appendEmptyOption(select, text);

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

      citySelect.setAttribute('disabled', true);
      appendOptions(countrySelect, Object.keys(countries), 'Choose Country');

      countrySelect.addEventListener('change', (event) => {
        const cities = countries[countrySelect.value];

        while (citySelect.firstChild) {
          citySelect.removeChild(citySelect.firstChild);
        }

        if (cities) {
          citySelect.removeAttribute('disabled');
          appendOptions(citySelect, cities, 'Choose City');
        } else {
          citySelect.setAttribute('disabled', true);
        }
      });
    });
  };

  const initCurrencies = () => {
    fetch('data/currencies.json').then((response) => {
      return response.json();
    }).then((currencies) => {
      const currencySelect = document.querySelector('#currency');
      appendOptions(currencySelect, Object.keys(currencies), 'Choose Currency');
    });
  };

  const initJobTitles = () => {
    fetch('data/job-titles.json').then((response) => {
      return response.json();
    }).then((jobTitles) => {
      const jobTitleSelect = document.querySelector('#job-title');
      appendOptions(jobTitleSelect, jobTitles, 'Choose Job Title');
    });
  };

  const initForm = () => {
    const form = document.querySelector('#form');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const entry = parseFormData(formData);

      postEntry(entry).then(() => {
        window.location.pathname = 'vis.html';
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCountries();
    initCurrencies();
    initJobTitles();
    initForm();
  });
})();

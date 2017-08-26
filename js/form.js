(() => {
  const DEFAULT_OPTION_TEXT = {
    country: '--- Choose Country ---',
    city: '--- Choose City ---',
    currency: '--- Choose Currency ---',
    role: '--- Choose Role ---',
  };

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

  const emptySelect = (select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  }

  const appendEmptyOption = (select, text) => {
    const option = document.createElement('option');

    option.value = '';
    option.innerText = text;

    select.appendChild(option);
  };

  const appendOptions = (select, valueCollection, text) => {
    emptySelect(select);
    appendEmptyOption(select, text);

    valueCollection.forEach((valueObject) => {
      const option = document.createElement('option');

      option.value = valueObject.value || valueObject ;
      option.innerText = valueObject.text || valueObject;

      select.appendChild(option);
    });
  };

  const initCountries = () => {
    fetch('data/countries-geo.json').then((response) => {
      return response.json();
    }).then((countries) => {
      const countrySelect = document.querySelector('#country');
      const citySelect = document.querySelector('#city');

      citySelect.setAttribute('disabled', true);
      appendOptions(countrySelect, Object.keys(countries), DEFAULT_OPTION_TEXT.country);

      countrySelect.addEventListener('change', (event) => {
        const citiesList = countries[countrySelect.value];  
        const cities = citiesList.map((cityObj) => {
          return {
            value: cityObj.city,
            text: `${cityObj.city}, ${cityObj.region}`
          }
        });

        if (cities) {
          citySelect.removeAttribute('disabled');
          appendOptions(citySelect, cities, DEFAULT_OPTION_TEXT.city);
        } else {
          citySelect.setAttribute('disabled', true);
          appendOptions(citySelect, [], DEFAULT_OPTION_TEXT.city);
        }
      });
    });
  };

  const initCurrencies = () => {
    fetch('data/currencies.json').then((response) => {
      return response.json();
    }).then((currencies) => {
      const currencySelect = document.querySelector('#currency');
      appendOptions(currencySelect, Object.keys(currencies), DEFAULT_OPTION_TEXT.currency);
    });
  };

  const initRoles = () => {
    fetch('data/roles.json').then((response) => {
      return response.json();
    }).then((roles) => {
      const roleSelect = document.querySelector('#role');
      appendOptions(roleSelect, roles, DEFAULT_OPTION_TEXT.role);
    });
  };

  const initForm = () => {
    const form = document.querySelector('#form');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const entry = parseFormData(formData);

      // Add timestamp in ms since 1 January 1970 00:00:00 UTC.
      entry.createdAt = new Date().getTime();

      // Fix types.
      entry.grossSalary = +entry.grossSalary;
      entry.netSalary = +entry.netSalary;

      postEntry(entry).then(() => {
        window.location.pathname = 'vis.html';
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCountries();
    initCurrencies();
    initRoles();
    initForm();
  });
})();

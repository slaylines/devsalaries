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

  const appendOptions = (select, values, text) => {
    emptySelect(select);
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
      appendOptions(countrySelect, Object.keys(countries), DEFAULT_OPTION_TEXT.country);

      countrySelect.addEventListener('change', (event) => {
        const cities = countries[countrySelect.value];

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

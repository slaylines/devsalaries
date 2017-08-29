(() => {
  /**
   * CONSTANTS
   */

  const DEFAULT_OPTION_TEXT = {
    currency: '--- Choose Currency ---',
    role: '--- Choose Role ---',
  };

  const SEARCH_CONFIG = {
    types: ['(cities)'],
  };

  /**
   * DOM HELPERS
   */

  const model = {
    page: {
      loading: false
    },
    form: {
      locationError: false,
      netSalaryError: false,
      serverError: false
    },
    onSalaryBlur: isSalaryValid,
    onLocationBlur: isLocationValid,
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

  const parseFormData = (form) => {
    const result = {};
    const elements = form.querySelectorAll('input, select');

    elements.forEach(({ name, value }) => {
      if (name) result[name] = value;
    });

    return result;
  };

  function isLocationValid () {
    const searchInput = document.querySelector('#search');
    const locationInput = document.querySelector('#location');
    const isValid = !!locationInput.value;

    model.form.locationError = !isValid;

    if (!isValid) {
      searchInput.value = '';
      searchInput.focus();
    }

    return isValid;
  }

  function isSalaryValid () {
    const netSalaryInput = document.querySelector('#net-salary');
    const grossSalaryInput = document.querySelector('#gross-salary');
    const isValid = +netSalaryInput.value <= +grossSalaryInput.value;

    model.form.netSalaryError = !isValid;

    if (!isValid) {
      netSalaryInput.focus();
    }

    return isValid;
  }

  const isFormValid = () => {
    return isLocationValid() && isSalaryValid();
  }

  /**
   * FIREBASE API METHODS
   */

  const getCurrencies = () => {
    const db = firebase.database();
    return db.ref('currencies').once('value').then((response) => {
      return Object.keys(response.val());
    });
  };

  const getRoles = () => {
    const db = firebase.database();
    return db.ref('roles').once('value').then((response) => {
      return Object.keys(response.val());
    });
  };

  const postEntry = (entry) => {
    const db = firebase.database();
    return db.ref().child('entries').push(entry);
  };

  /**
   * EVENT HANDLERS
   */

  const onLocationSelected = (place) => {
    const locationInput = document.querySelector('#location');
    const location = place.geometry.location;
    const component = place.address_components.find(({ types }) => {
      return types.includes('country');
    });

    const city = place.name;
    const country = {
      code: component.short_name,
      name: component.long_name,
    };
    const coords = {
      lat: location.lat(),
      lon: location.lng(),
    };

    locationInput.value = JSON.stringify({ city, country, coords });
    model.form.locationError = false;
  };

  /**
   * INITIALIZERS
   */

  const bindFormContainer = () => {
    const formContainer = document.getElementById('form-container');
    rivets.bind(formContainer, model);
  }

  const initSearch = () => {
    const searchInput = document.querySelector('#search');
    const locationInput = document.querySelector('#location');
    const submitButton = document.querySelector('#submit-btn');
    const autocomplete = new google.maps.places.Autocomplete(searchInput, SEARCH_CONFIG);

    // Reset hidden location input when user types new query.
    searchInput.addEventListener('input', () => {
      locationInput.value = '';
      submitButton.disabled = true;
    });

    // Set hidden location input when user chooses autocomplete result.
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onLocationSelected(place);
      submitButton.disabled = false;
    });
  };

  const initCurrencies = () => {
    getCurrencies().then((currencies) => {
      const currencySelect = document.querySelector('#currency');
      appendOptions(currencySelect, currencies, DEFAULT_OPTION_TEXT.currency);
    });
  };

  const initRoles = () => {
    getRoles().then((roles) => {
      const roleSelect = document.querySelector('#role');
      appendOptions(roleSelect, roles, DEFAULT_OPTION_TEXT.role);
    });
  };

  const initForm = () => {
    const submitButton = document.querySelector('#submit-btn');
    const form = document.querySelector('#form');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const entry = parseFormData(form);

      if (!isFormValid()) {
        submitButton.disabled = true;
        return;
      }

      // Add timestamp in ms since 1 January 1970 00:00:00 UTC.
      entry.createdAt = new Date().getTime();

      // Fix types.
      entry.location = JSON.parse(entry.location);
      entry.grossSalary = +entry.grossSalary;
      entry.netSalary = +entry.netSalary;

      model.page.loading = true;

      postEntry(entry).then(() => {
        window.location.href = 'vis.html';
      }).catch((error) => {
        model.page.loading = false;
        model.form.serverError = true;
        console.error(error);
      });
    });
  };

  /**
   * MAIN
   */

  document.addEventListener('DOMContentLoaded', () => {
    bindFormContainer();
    initSearch();
    initCurrencies();
    initRoles();
    initForm();
  });
})();

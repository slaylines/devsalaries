(() => {
  const DEFAULT_OPTION_TEXT = {
    currency: '--- Choose Currency ---',
    role: '--- Choose Role ---',
  };

  const SEARCH_CONFIG = {
    types: ['(cities)'],
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
  };

  const initSearch = () => {
    const searchInput = document.querySelector('#search');
    const locationInput = document.querySelector('#location');
    const autocomplete = new google.maps.places.Autocomplete(searchInput, SEARCH_CONFIG);

    // Reset hidden location input when user types new query.
    searchInput.addEventListener('input', () => {
      locationInput.value = '';
    });

    // Set hidden location input when user chooses autocomplete result.
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onLocationSelected(place);
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
    const searchInput = document.querySelector('#search');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const entry = parseFormData(formData);

      // If location is presented then post data.
      // Otherwise clear search input and focus it.
      if (entry.location) {
        // Add timestamp in ms since 1 January 1970 00:00:00 UTC.
        entry.createdAt = new Date().getTime();

        // Fix types.
        entry.location = JSON.parse(entry.location);
        entry.grossSalary = +entry.grossSalary;
        entry.netSalary = +entry.netSalary;

        postEntry(entry).then(() => {
          window.location.href = 'vis.html';
        }).catch((error) => {
          console.error(error);
        });
      } else {
        searchInput.value = '';
        searchInput.focus();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initCurrencies();
    initRoles();
    initForm();
  });
})();

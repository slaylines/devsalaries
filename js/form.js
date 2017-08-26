(() => {
  const cityInput = document.getElementById('city-input')
  const citySearchResults = document.getElementById('city-search-results');
  cityInput.addEventListener('input', debounce(onSearchState, 300));
  let location = {
    city: '',
    country: '',
  };

  let countriesData = []

  // from here https://davidwalsh.name/javascript-debounce-function
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  function flattenCountries(data) {
    let result = [];
    for (var country in data) {
      var cities = data[country];
      cities.forEach((cityObj) => {
        result.push([cityObj.city, cityObj.region, country].join(', '));
      });
    }

    return result;
  }

  function clearSearchResults() {
    citySearchResults.innerHTML = ''
    location = {
      city: '',
      country: '',
    };
  }

  function fillSearchResults(results) {
    clearSearchResults()

    let ul = document.createElement('ul');
    ul.className = 'pure-menu-list';

    results.forEach((result) => {
      let li = document.createElement('li');
      li.className = 'pure-menu-item';
      
      let anchor = document.createElement('a');
      anchor.className = 'pure-menu-link';
      anchor.href = '';
      anchor.innerHTML = result;
      anchor.addEventListener('click', onCitySelect.bind(null, result));

      li.appendChild(anchor);
      ul.appendChild(li);
    })
    citySearchResults.appendChild(ul);
  }

  function onCitySelect(cityStr, e) {
    e.preventDefault();
    clearSearchResults();
    let cityParts = cityStr.split(',');
    location.city = cityParts[0].trim();
    location.country = cityParts[2].trim();
    cityInput.value = `${location.city}, ${location.country}`;
  }

  function onSearchState(e) {
    const inputValue = e.target.value.toLowerCase();
    if (inputValue.length == 0) {
      return clearSearchResults();
    }

    let results = countriesData.filter((countryData) => {
      return countryData.toLowerCase().indexOf(inputValue) > -1
    })

    fillSearchResults(results)
  }


  const DEFAULT_OPTION_TEXT = {
    country: '--- Choose Country ---',
    city: '--- Choose City ---',
    currency: '--- Choose Currency ---',
    role: '--- Choose Role ---',
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

  const initCountries = () => {
    fetch('data/countries-geo.json').then((response) => {
      return response.json();
    }).then((countries) => {
      countriesData = flattenCountries(countries);
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

      let formData = new FormData(form);
      formData.append('city', location.city);
      formData.append('country', location.country);

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

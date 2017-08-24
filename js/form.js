(() => {
  const appendOptions = (select, values) => {
    values.forEach((value) => {
      const option = document.createElement('option');

      option.value = value;
      option.innerText = value;

      select.appendChild(option);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
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
  });
})();

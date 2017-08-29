((window) => {
  /**
   * CONSTANTS
   */

  const MIN_ENTRIES_FOR_VISDATA = 1;
  const QUANTILES = [5, 25, 50, 75, 95];
  const XCHANGE_API_KEY = 'c7dcb6596c4245b1b38f9b282bf8abe1';
  const XCHANGE_API_URL = `https://openexchangerates.org/api/latest.json?app_id=${XCHANGE_API_KEY}&base=USD`;
  const DOMAIN = {
    companyYears: ['<1', '1', '2', '3', '4', '5', '>5'],
    expYears: ['<1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '>10'],
  };

  /**
   * HELPERS
   */

  const uniq = (array) => {
    return Array.from(new Set(array));
  };

  const uniqBy = (array, key) => {
    const seen = {};

    return array.filter((item) => {
      const k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
  };

  const groupCount = (array, domain) => {
    const groups = {};
    const result = [];

    // Put zero counts if domain is defined.
    if (domain) {
      domain.forEach((item) => groups[item] = 0);
    }

    // Group and count items in groups.
    array.forEach((item) => {
      groups[item] = ++groups[item] || 1;
    });

    // Format values as an array of names and counts.
    Object.entries(groups).forEach(([name, count]) => {
      result.push({ name, count });
    });

    return result;
  };

  /**
   * STATISTICS METHODS
   */

  const Stats = {
    sum(array) {
      return array.reduce((a, b) => a + b, 0);
    },

    min(array) {
      return Math.min.apply(null, array);
    },

    max(array) {
      return Math.max.apply(null, array);
    },

    mean(array) {
      return Stats.sum(array) / array.length;
    },

    median(array) {
      return Stats.quantiles(array, [50])[50];
    },

    // percentiles - an array of all percentiles to calculate,
    // e.g. [5, 25, 50, 75, 95].
    quantiles(array, percentiles) {
      const clone = array.slice(0);
      const len = clone.length;
      const result = {};

      clone.sort();

      percentiles.forEach((p) => {
        // Handle 0% and 100% percentiles.
        if (p === 0) return result[p] = clone[0];
        if (p === 100) return result[p] = clone[len - 1];

        // Get array index of the quantile.
        const i = p / 100 * len - 1;

        // If the index is integer, then the value
        // is the average between two neighbours.
        // Otherwise round up to the next index.
        result[p] = (i === Math.floor(i))
          ? (clone[i] + clone[i + 1]) / 2
          : clone[Math.ceil(i)];
      });

      return result;
    },
  };

  /**
   * VISDATA PRIVATE METHODS
   */

  const uniqStats = (entries, prop) => {
    const array = entries.map((entry) => {
      return entry[prop];
    });

    return uniq(array).filter((item) => item);
  };

  const groupStats = (entries, prop) => {
    const array = entries.map((entry) => {
      return entry[prop];
    });

    return groupCount(array, DOMAIN[prop]);
  };

  const aggrStats = (entries, prop) => {
    const array = entries.map((entry) => {
      return entry[prop];
    });

    const min = Stats.min(array);
    const max = Stats.max(array);
    const mean = Stats.mean(array);
    const quantiles = Stats.quantiles(array, QUANTILES);

    return { min, max, mean, quantiles };
  };

  /**
   * VISDATA CLASS
   */

  const VisData = function (entries) {
    this.source = entries;
    this.empty = false;

    if (entries.length >= MIN_ENTRIES_FOR_VISDATA) {
      this.company = uniqStats(entries, 'company');
      this.role = groupStats(entries, 'role');
      this.companyYears = groupStats(entries, 'companyYears');
      this.expYears = groupStats(entries, 'expYears');
      this.grossSalary = aggrStats(entries, 'grossSalary');
      this.netSalary = aggrStats(entries, 'netSalary');
      this.gender = groupStats(entries, 'gender');
    } else {
      this.empty = true;
    }
  };

  /**
   * PRIVATE METHODS
   */

  const processEntries = (entries, rates) => {
    const values = Object.values(entries);
    const converted = convertToUsd(values, rates);

    return converted;
  };

  const convertToUsd = (entries, rates) => {
    return entries.map((entry) => {
      const rate = rates && rates[entry.currency];
      if (rate && entry.currency !== 'USD') {
        entry.netSalary /= rate;
        entry.grossSalary /= rate;
      }

      return entry;
    });
  };

  const isInRect = ({ lat, lon }, { x, y, width, height }) => {
    return (lon > x && lon < x + width) && (lat > y && lat < y + height);
  };

  const locationKey = ({ country, city, coords }) => {
    const lat = coords.lat.toFixed(1);
    const lon = coords.lon.toFixed(1);

    return `${country.code}|${city}|${lat}|${lon}`;
  };

  const countryKey = ({ code }) => {
    return code;
  };

  // check if currency rates is outdated
  const isRatesOld = (rates) => {
    const currentTime = new Date().getTime();
    // one day in ms
    const validityPeriod = 24 * 60 * 60 * 60 * 1000;

    return !rates || currentTime > rates.timestamp + validityPeriod;
  };

  const updateRates = (db) => {
    fetch(XCHANGE_API_URL)
      .then((resp) => resp.json())
      .then((data) => {
        let rates = data.rates;
        // convert to ms
        rates.timestamp = data.timestamp * 1000;
        db.ref().child('rates').set(rates);
      });
  };


  /**
   * PUBLIC API
   */

  const DataApi = {
    init(firebase) {
      this.db = firebase.database();

      return Promise.all([this.getEntries(), this.getRates()])
        .then(([entries, rates]) => {
          rates = rates.val();
          entries = entries.val();

          // Store raw JSON data for downloads.
          this.raw = JSON.stringify(entries, null, 2);

          // Flatten and filter entries, convert salaries to USD.
          this.entries = processEntries(entries, rates);

          // Update rates on the server side if they are old.
          if (isRatesOld(rates)) {
            updateRates(this.db)
          }

          // Freeze DataApi object after initialization;
          Object.freeze(this);
        }).catch((err) => {
          console.error(err);
        });
    },

    getEntries() {
      return this.db.ref('entries').once('value');
    },

    getRates() {
      return this.db.ref('rates').once('value');
    },

    getEnabledCountries() {
      const countries = this.entries.map((entry) => {
        return entry.location.country;
      });

      return uniqBy(countries, countryKey);
    },

    // (x, y) - is the bottom left corner coordinates.
    getCitiesInRect(rect) {
      // First get all locations in the given rectangle.
      const locs = this.entries.map((entry) => {
        return entry.location;
      }).filter((loc) => {
        return isInRect(loc.coords, rect);
      });

      // Then return unique locations by special location key.
      // This should work unless there are cities in the
      // same country with the same name within 0.01° radius. :)
      return uniqBy(locs, locationKey);
    },

    getCityData(loc) {
      const entries = this.entries.filter((entry) => {
        return locationKey(entry.location) === locationKey(loc);
      });

      return new VisData(entries);
    },

    getCountryData(code) {
      const entries = this.entries.filter((entry) => {
        return entry.location.country.code === code;
      });

      return new VisData(entries);
    },

    getWorldData() {
      return new VisData(this.entries);
    },

    getRawData() {
      return this.raw;
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    Stats,
    VisData,
    DataApi,
  });
})(window);

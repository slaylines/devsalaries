((window) => {
  /**
   * CONSTANTS
   */

  const MIN_ENTRIES_FOR_VISDATA = 1;
  const QUANTILES = [5, 25, 50, 75, 95];

  /**
   * HELPERS
   */

  const uniq = (array) => {
    return [...new Set(array)];
  };

  const uniqBy = (array, key) => {
    const seen = {};

    return array.filter((item) => {
      const k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
  };

  const groupCount = (array) => {
    const groups = {};
    const result = [];

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
      const clone = [...array];
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

    return uniq(array);
  };

  const groupStats = (entries, prop) => {
    const array = entries.map((entry) => {
      return entry[prop];
    });

    return groupCount(array);
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

  const processEntries = (entries) => {
    const values = Object.values(entries);
    const filtered = filterInvalidEntries(values);
    const converted = convertToUsd(filtered);

    return converted;
  };

  // TODO: filter invalid data.
  const filterInvalidEntries = (entries) => {
    return entries;
  };

  // TODO: convert salaries to USD.
  const convertToUsd = (entries) => {
    return entries;
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

  /**
   * PUBLIC API
   */

  const DataApi = {
    init(firebase) {
      this.db = firebase.database();

      return this.getEntries().then((entries) => {
        // Flatten and filter entries, convert salaries to USD.
        this.entries = processEntries(entries.val());

        // Freeze DataApi object after initialization;
        Object.freeze(this);
      }).catch((err) => {
        console.error(err);
      });
    },

    getEntries() {
      return this.db.ref('entries').once('value');
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
        return entry.country.code === code;
      });

      return new VisData(entries);
    },

    getWorldData() {
      return new VisData(this.entries);
    },
  };

  // Expose API globally.
  window.DS = Object.assign({}, window.DS || {}, {
    Stats,
    VisData,
    DataApi,
  });
})(window);

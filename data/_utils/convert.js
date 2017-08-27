const DATA_FILE = '../entries.json';
const OUTPUT_FILE = 'entries.json';
const THROTTLING = 200; // milliseconds

require('dotenv').config();

const fs = require('fs');
const { msleep } = require('sleep');
const GoogleMapsApi = require('@google/maps');
const moment = require('moment');
const data = require(DATA_FILE);

const google = GoogleMapsApi.createClient({
  key: process.env.GOOGLE_API_KEY,
});

const write = (file) => {
  const json = JSON.stringify(data);
  fs.writeFile(file, json, 'utf8', err => console.log(err || ' ✔'));
};

const convertDate = (date) => {
  const [day, month, year, hour, minute, second] = date.match(/\d+/g);
  return moment([year, month, day, hour, minute, second]).unix();
};

const findCountryComponent = ({ types }) => {
  return types.includes('country');
};

const getLocation = (query) => {
  return new Promise((resolve) => {
    google.places({
      query: query,
      language: 'en',
      type: '(cities)',
    }, (err, response) => {
      if (err) console.error(err);

      // Get the first result - it should be city.
      const placeId = response.json.results[0].place_id;

      google.place({
        placeid: placeId,
        language: 'en',
      }, (err, response) => {
        if (err) console.error(err);

        try {
          const place = response.json.result;
          const location = place.geometry.location;
          const component = place.address_components.find(findCountryComponent);

          const city = place.name;
          const country = {
            code: component.short_name,
            name: component.long_name,
          };
          const coords = {
            lat: location.lat,
            lon: location.lng,
          };

          resolve({ country, city, coords });
        } catch (e) {
          console.error(e);
        }
      });
    });
  });
};

const setLocation = (entry, location) => {
  return new Promise((resolve) => {
    delete entry.country;
    delete entry.city;
    entry.location = location;
    resolve();
  });
};

// Convert data to proper format and
// set location property.
const convert = async () => {
  for (const entry of data) {
    const query = `${entry.country},${entry.city}`;
    const location = await getLocation(query);

    entry.createdAt = convertDate(entry.createdAt);
    entry.grossSalary = +entry.grossSalary;
    entry.netSalary = +entry.netSalary;

    await setLocation(entry, location);

    process.stdout.write('');

    msleep(THROTTLING);
  }

  write(OUTPUT_FILE);
};

convert();

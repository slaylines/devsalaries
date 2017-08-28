const ENTRIES_FILE = '../entries.json';
const ROLES_FILE = '../roles.json';
const CURRENCIES_FILE = '../currencies.json';

const config = {
  apiKey: 'AIzaSyB04_ki__EXD7ODTEV02e1l3jfunVplVtE',
  authDomain: 'dev-salaries.firebaseapp.com',
  databaseURL: 'https://dev-salaries.firebaseio.com',
  projectId: 'dev-salaries',
  storageBucket: '',
  messagingSenderId: '738682676321',
};

const firebase = require('firebase');
const entries = require(ENTRIES_FILE);
const roles = require(ROLES_FILE);
const currencies = require(CURRENCIES_FILE);
const app = firebase.initializeApp(config);
const db = firebase.database();

const seedRoles = () => {
  firebase.database().ref().child('roles').set(
    roles.reduce((acc, role) => {
      acc[role] = true;
      return acc;
    }, {})
  );

  process.stdout.write('✔');
};

const seedCurrencies = () => {
  firebase.database().ref().child('currencies').set(
    currencies.reduce((acc, currency) => {
      acc[currency] = true;
      return acc;
    }, {})
  );

  process.stdout.write('✔');
};

const seedEntries = () => {
  entries.forEach((entry) => {
    db.ref().child('entries').push(entry).catch((error) => {
      console.log(entry);
    });
  });

  process.stdout.write('✔');
};

Promise.all([seedRoles(), seedCurrencies()]).then(() => {
  seedEntries();
});

const DATA_FILE = '../entries.json';

const config = {
  apiKey: 'AIzaSyB04_ki__EXD7ODTEV02e1l3jfunVplVtE',
  authDomain: 'dev-salaries.firebaseapp.com',
  databaseURL: 'https://dev-salaries.firebaseio.com',
  projectId: 'dev-salaries',
  storageBucket: '',
  messagingSenderId: '738682676321',
};

const firebase = require('firebase');
const data = require(DATA_FILE);
const app = firebase.initializeApp(config);
const db = firebase.database();

data.forEach((entry) => {
  db.ref().child('entries').push(entry);
  process.stdout.write('');
});

process.stdout.write(' ✔');

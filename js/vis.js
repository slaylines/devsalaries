(() => {
  const getEntries = () => {
    const db = firebase.database();
    return db.ref('entries').once('value').then((snapshot) => {
      const entries = snapshot.val();

      // NOTE: For testing purposes...
      Object.entries(entries).forEach(([key, entry]) => {
        const p = document.createElement('p');
        p.innerText = JSON.stringify(entry);
        document.querySelector('.content').appendChild(p);
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    //getEntries();
    initWorldMap();

  });
})();

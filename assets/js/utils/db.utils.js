// POST -> Gestiones de datos registro o actualización pasen por aquí

const incidencesDB = new PouchDB('incidences');

const saveIncidence = (incidence) => {
  incidence._id = new Date().toISOString();
  return incidencesDB
    .put(incidence)
    .then(async (result) => {
      self.registration.sync.register('incidence-status-post');
      const response = {
        changed: true,
        offline: true,
      };
      return new Response(JSON.stringify(response));
    })
    .catch((err) => {
      console.log(err);
      const response = {
        changed: false,
        offline: true,
      };
      return new Response(JSON.stringify(response));
    });
};

const saveIncidenceToApi = () => {
  const incidences = [];
  return incidencesDB.allDocs({ include_docs: true }).then((docs) => {
    const { rows } = docs;
    for (const row of rows) {
      const { doc } = row;
      try {
        //axios -> axios({url:'fullurl', method:'', data: {}})
        const response = fetch(
          `http://206.189.234.55:3001/api/incidences/status`,
          {
            method: 'POST',
            body: JSON.stringify(doc),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
          .then((res) => res.json())
          .then((data) => {
            return incidencesDB.remove(doc);
          });
        incidences.push(response);
      } catch (error) {
        console.log('SAVETOAPI', error);
      }
    }
    const message = self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'RELOAD_PAGE_AFTER_SYNC' });
      });
    });
    return Promise.all([...incidences, message]);
  });
};


const updateDynamicCache = (dynamicCache, req, res) => {
    //res.ok ->
    if (res?.ok) {
      return caches.open(dynamicCache).then((cache) => {
        cache.put(req, res.clone());
        return res.clone();
      });
    } else {
      return res?.clone();
    }
  };
  
  const updateStaticCache = (staticCache, req, APP_SHELL_INMUTABLE) => {
    if (APP_SHELL_INMUTABLE.includes(req.url)) {
      //No hace falta actualizar
    } else {
      return fetch(req)
        .then((res) => {
          return updateDynamicCache(staticCache, req, res);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };
  
  const apiSaveIncidence = (cacheName, req) => {
    if (
      req.url.indexOf('/api/notification/') >= 0 ||
      req.url.indexOf('/api/notification/subscribe') >= 0
    ) {
      return fetch(req);
    }
    if (req.clone().method === 'POST') {
      console.log('POST', {
        self: self.registration.sync,
        isOnline: navigator.onLine,
      });
      if (self.registration.sync && !navigator.onLine)
        return req
          .clone()
          .text()
          .then((body) => {
            return saveIncidence(JSON.parse(body));
          });
      return fetch(req);
    } else {
      return fetch(req)
        .then((response) => {
          if (response.ok) {
            updateDynamicCache(cacheName, req, response.clone());
            return response.clone();
          } else {
            return caches.match(req);
          }
        })
        .catch((err) => {
          return caches.match(req);
        });
    }
  };
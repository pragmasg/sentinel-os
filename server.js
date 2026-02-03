const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(() => {
    const server = express();

    server.get('/health', (_req, res) => {
      res.status(200).send('ok');
    });

    server.all('*', (req, res) => handle(req, res));

    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`> Server listening on port ${port} (dev=${dev})`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  });

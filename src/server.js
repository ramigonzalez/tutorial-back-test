const { loadConfiguration } = require('../config/environment');
loadConfiguration();

require('express-async-errors');

const Repository = require('./repositories');
const { okResponse, errorHandler, pathNotFound } = require('./middlewares');
const routes = require('./routes');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.NODE_PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));

routes(app);

app.use(pathNotFound);
app.use(okResponse);
app.use(errorHandler);

Repository.init()
    .then(() => app.listen(port, () => console.info(`Tutorials Server is listening on port ${port}`)))
    .catch((err) => {
        console.error('Could not connect with database', err.message);
        process.exit(1);
    });

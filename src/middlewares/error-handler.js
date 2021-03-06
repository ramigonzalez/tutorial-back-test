const { isDevelopmentOrTesting } = require('../../config/environment');
const { BaseError, InternalServerException } = require('../exceptions');

module.exports = (err, req, res, next) => {
    try {
        if (BaseError.isTrustedError(err)) {
            const response = buildResponseError(err, res);
            res.status(response.statusCode).json(response);
        } else {
            throw new InternalServerException('An internal error ocurred', err);
        }
    } catch (error) {
        const response = buildResponseError(error, res);
        res.status(response.statusCode).json(response);
    }
};

const buildResponseError = (err, res) => {
    const statusCode = err.httpStatusCode;
    const response = {
        statusCode,
        exception: {
            message: err.message,
            exceptionName: err.name,
        },
    };

    if (isDevelopmentOrTesting() && err.stackTrace) {
        response.exception = { ...response.exception, stackTrace: err.stackTrace };
    }

    if (err.innerException) {
        const innerException = isDevelopmentOrTesting()
            ? err.innerException
            : { name: err.innerException.name, message: err.innerException.message };
        response.exception = { ...response.exception, innerException };
    }

    if (res.body && res.body.errors) {
        response.exception = { ...response.exception, errors: res.body.errors };
    }

    if (res.body && res.body.nestedErrors) {
        const nestedErrors = res.body.nestedErrors;
        response.exception.errors = { ...response.exception.errors, nestedErrors };
    }

    return response;
};

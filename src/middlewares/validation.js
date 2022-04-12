const { body, query, oneOf, validationResult } = require('express-validator');
const { ValidationException } = require('../exceptions');

const NULL_NOR_EMPTY_MSG = 'cannot be null nor empty';

const authenticationValidationRules = () => {
    return [
        body('email', NULL_NOR_EMPTY_MSG)
            .exists()
            .notEmpty()
            .isEmail()
            .normalizeEmail()
            .withMessage('Email must have valid format. Example: xxx@xxx.xxx'),
        body('password', NULL_NOR_EMPTY_MSG).exists().notEmpty(),
    ];
};

const getAllTutorialValidationRules = () => {
    return [
        query('title').isString(),
        query('description').isString(),
        query('order').custom(validateOrder),
        query('limit').isNumeric(),
        query('offset').isNumeric(),
        query('condition').custom(validateCondition),
    ];
};

const createTutorialValidationRules = () => {
    return [
        body('title', NULL_NOR_EMPTY_MSG).exists().bail().notEmpty().bail().isString(),
        body('description', NULL_NOR_EMPTY_MSG).exists().bail().notEmpty().bail().isString(),
        body('videoUrl', NULL_NOR_EMPTY_MSG)
            .exists()
            .bail()
            .notEmpty()
            .bail()
            .isURL()
            .withMessage('Invalid url format'),
    ];
};

const updateTutorialValidationRules = () => {
    return [
        oneOf(
            [
                body('title', NULL_NOR_EMPTY_MSG).exists().bail().notEmpty().bail().isString(),
                body('description', NULL_NOR_EMPTY_MSG).exists().bail().notEmpty().bail().isString(),
                body('videoUrl', NULL_NOR_EMPTY_MSG)
                    .exists()
                    .bail()
                    .notEmpty()
                    .bail()
                    .isURL()
                    .withMessage('Invalid url format'),
                body('publishedStatus', NULL_NOR_EMPTY_MSG)
                    .exists()
                    .bail()
                    .isIn(['PENDING', 'IN PROGRESS', 'PUBLISHED'])
                    .withMessage('Invalid published status requested'),
            ],
            'At least one attribute must be sent to update a tutorial'
        ),
    ];
};

const validateCondition = (condition) => {
    if (condition !== 'AND' || condition !== 'OR') {
        throw new Error('Only AND and OR condition supported');
    }
};

const validateOrder = (order) => {
    if (order !== 'ASC' || order !== 'DESC') {
        throw new Error('Only ASC and DESC sorting option supported');
    }
};

const rules = {
    auth: {
        authentication: authenticationValidationRules,
    },
    tutorials: {
        getAll: getAllTutorialValidationRules,
        create: createTutorialValidationRules,
        update: updateTutorialValidationRules,
    },
};

const validateErrors = (req, res, next) => {
    const result = validationResult(req).formatWith(({ msg }) => msg);
    if (!result.isEmpty()) {
        const nestedErrors = getNestedErrors(req);
        res.body = { errors: result.mapped(), nestedErrors };
        return next(new ValidationException('Validation errors found'));
    } else next();
};

const getNestedErrors = (req) => {
    const validationErrors = validationResult(req);
    const nestedErrors =
        validationErrors.errors.length > 0 && validationErrors.errors[0].nestedErrors
            ? validationErrors.errors[0].nestedErrors
            : null;

    if (nestedErrors) {
        let ret = {};
        nestedErrors.forEach(({ param, msg }) => (ret = { ...ret, [param]: msg }));
        return ret;
    }
    return nestedErrors;
};

module.exports = {
    validateErrors,
    rules,
};

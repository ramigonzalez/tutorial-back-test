const TutorialsController = require('../../controllers/tutorials.controller');
const {
    allowAdminOnly,
    tutorialTokenExpiration,
    verifyUserToken,
    verifyTutorialToken,
    allowedMethods,
} = require('../../middlewares');

const httpMethods = require('../http-methods');

module.exports = (app) => {
    const controller = new TutorialsController();
    const router = require('express').Router();

    router
        .post(
            path.TUTORIALS,
            verifyUserToken,
            allowAdminOnly,
            verifyTutorialToken,
            tutorialTokenExpiration,
            controller.create.bind(controller)
        )
        .get(path.TUTORIALS, verifyUserToken, controller.getAllTutorials.bind(controller))
        .use(path.TUTORIALS, (req, res, next) => allowedMethods(req, res, next, [httpMethods.POST, httpMethods.GET]));

    router
        .get(path.TUTORIAL_TOKEN, verifyUserToken, allowAdminOnly, controller.getTutorialCreationToken.bind(controller))
        .use(path.TUTORIAL_TOKEN, (req, res, next) => allowedMethods(req, res, next, [httpMethods.GET]));

    router
        .get(path.SINGLE_TUTORIAL, verifyUserToken, controller.getTutorial.bind(controller))
        .put(path.SINGLE_TUTORIAL, verifyUserToken, allowAdminOnly, controller.update.bind(controller))
        .delete(path.SINGLE_TUTORIAL, verifyUserToken, allowAdminOnly, controller.delete.bind(controller))
        .use(path.SINGLE_TUTORIAL, (req, res, next) =>
            allowedMethods(req, res, next, [httpMethods.GET, httpMethods.PUT, httpMethods.DELETE])
        );

    router
        .delete(path.MASS_DELETE, verifyUserToken, allowAdminOnly, controller.bulkDelete.bind(controller))
        .use(path.MASS_DELETE, (req, res, next) => allowedMethods(req, res, next, [httpMethods.DELETE]));

    app.use('/api/v1/tutorials', router);
};

const path = {
    TUTORIALS: '/',
    TUTORIAL_TOKEN: '/token',
    SINGLE_TUTORIAL: '/:id([\\d]+)',
    MASS_DELETE: '/mass_delete',
};
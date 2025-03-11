const authService = require('../services/auth.service');

const authController = {
    async register(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.register(email, password);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
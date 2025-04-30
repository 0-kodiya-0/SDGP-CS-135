const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');

router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'Protected route', user: req.user });
});

module.exports = router;

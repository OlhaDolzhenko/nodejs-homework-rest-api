const express = require("express");
const createError = require('http-errors');

const { authenticate } = require("../../middlewares");

const { User, schemas } = require("../../models/user");

const router = express.Router();

router.get("/current", authenticate, async (req, res, next) => {
    req.json({
        email: req.user.email
    })
});

router.get("/logout", authenticate, async (req, res, next) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: null });
    res.status(204).send();

})
router.patch("/", authenticate, async (req, res, next) => {
    try {
        const {error} = schemas.updateSubscription.validate(req.body);
        if(error){
            throw new createError(400, "missing field or improper value")
        }
        const { _id } = req.user;
        const result = await User.findByIdAndUpdate(_id, req.body, { new: true });
        if(!result){
            throw new createError(404, "Not found")
        }
        res.json(result);
    } catch (error) {
        next(error);
    }
})

module.exports = router;
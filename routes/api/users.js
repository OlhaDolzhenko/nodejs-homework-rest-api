const express = require("express");
const { fstat } = require("fs");
const createError = require('http-errors');
const path = require("path");
const fs = require("fs/promises");
const Jimp = require('jimp');

const { authenticate, upload } = require("../../middlewares");

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

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");
const optimizeImg = async (imagePath) => {
  const image = await Jimp.read(`${imagePath}`);
  await image.resize(250, 250);
  return await image.writeAsync(`${imagePath}`);
};

router.patch("/avatars", authenticate, upload.single("avatar"), async (req, res, next) => {
    const { _id } = req.user;
    const { path: tempUpload, filename } = req.file;
    try {
        const [extention] = filename.split(".").reverse();
        const newFileName = `${_id}.${extention}`;
        const resultUpload = path.join(avatarsDir, newFileName);
        await optimizeImg(filename);
        await fs.rename(tempUpload, resultUpload);
        const avatarURL = path.join("avatars", newFileName);
        await User.findByIdAndUpdate(_id, { avatarURL });
        res.json({
            avatarURL
        })
    } catch (error) {
        next(error);
    }
})

module.exports = router;
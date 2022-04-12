const express = require("express");
const createError = require('http-errors');
const path = require("path");
const fs = require("fs/promises");
const Jimp = require('jimp');

const { authenticate, upload } = require("../../middlewares");

const { User, schemas } = require("../../models/user");
const { sendMail } = require("../../helpers");

const router = express.Router();

router.get("/verify/:verificationToken", async (req, res, next) => {
    try {
        const { verificationToken } = req.params;
        const user = await User.findOne({ verificationToken });
        if (!user) {
            throw createError(400, "User not found");
        }
        await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });
        res.json({
            message: 'Verification successful'
        })
    } catch (error) {
        next(error);
    }
})

router.post("/verify", async (req, res, next) => {
    try {
        const { error } = schemas.verify.validate(req.body);
        if (error) {
            throw createError(400, "missing required field email");
        };
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (user.verify) {
            throw createError(400, "Verification has already been passed")
        }
        const mail = {
            to: email,
            subject: "Email Confirmation",
            html: `< a target="_blank" href="http://localhost:3000/api/users/verify/${user.verificationToken}" /> follow the link to confirm !`
        }
        sendMail(mail);
        res.json({
            message: "Verification email sent"
        })

    } catch (error) {
        next(error);
    }
})

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
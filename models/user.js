const { Schema, model } = require("mongoose");
const Joi = require("joi");

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = Schema({
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: emailRegexp
    },
    subscription: {
        type: String,
        enum: ["starter", "pro", "business"],
        default: "starter"
    },
    token: {
        type: String,
        default: null,
    },
    avatarURL: {
        type: String
    }
}, { versionKey: false, timestamps: true });

const signupJoiSchema = Joi.object({
    email: Joi.string().pattern(emailRegexp).required(),
    password: Joi.string().min(6).required(),
    subscription: Joi.string().valid("starter", "pro", "business")
})

const updateSubscriptionJoiSchema = Joi.object({
    subscription: Joi.string().valid("starter", "pro", "business").required()

})

const User = model("user", userSchema);

const schemas = {
    signup: signupJoiSchema,
    updateSubscription: updateSubscriptionJoiSchema
};

module.exports = {
    User,
    schemas
}
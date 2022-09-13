const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }, 
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }]
},);

User.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET_KEY);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}

User.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

const UserModel = mongoose.model('User', User);

module.exports = UserModel;
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try{
        const token = req.cookies.jwt;
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findOne({ _id: verifyToken._id, 'tokens.token': token });
        req.token = token;
        req.user = user;
        next();
    }
    catch(e){
        res.redirect('login');
    }
}

module.exports = auth;
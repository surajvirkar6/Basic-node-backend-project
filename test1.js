require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const UserModel = require('./models/user');
const EventModel = require('./models/event');
const auth = require('./middleare/auth');
const app = express();
const port = process.env.PORT || 3000;
app.listen(port);

const url = process.env.DB_URL;
mongoose.connect(url).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => { console.log(err) });

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', auth, async (req, res) => {
    const items = await EventModel.find();
    let events = items.filter(event => {
        for(let i=0; i < event.users.length; i++) {
            if(event.users[i] === req.user.email) {
                return event;
            }
        }
    })
    res.render('index', { events });
});

app.get("/bored", auth, function (req, res) {
    res.render('bored');
});

app.get("/trump", function (req, res) {
    res.render('trump');
});

// sign up

app.get("/sign", function (req, res) {
    res.render('form');
});

app.post("/sign", async function (req, res) {
    try {
        const userData = new UserModel({
            email: req.body.email,
            password: req.body.password
        });

        const token = await userData.generateAuthToken();

        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 3000000),
            httpOnly: true
        });

        userData.save().then(result => {
            res.redirect('/');
        }).catch(err => {
            console.log(err);
        });
    } catch (error) {
        res.send("Invalid details");
    }

});

// login

app.get("/login", function (req, res) {
    res.render('login');
});

app.post("/login", async function (req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        let useremail = await UserModel.findOne({ email: email });
        if (useremail) {
            let isMatch = await bcrypt.compare(password, useremail.password);
            if (isMatch && useremail.email === email) {
                const token = await useremail.generateAuthToken();
                if (token) {
                    res.cookie('jwt', token, {
                        expires: new Date(Date.now() + 3000000),
                        httpOnly: true
                    });
                    res.redirect('/');
                }
            } else {
                res.send('invalid details');
            }
        }else{
            res.send('User Does Not exist');
        }
    } catch (err) {
        console.log(err);
        res.send('Error');
    }
});

app.get("/logout", auth, async function (req, res) {
    req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token;
    });
    res.clearCookie("jwt");
    await req.user.save();
    res.redirect('login');
});

// add event

app.get("/addEvent", auth,  function (req, res) {
    res.render('addEvent');
});

app.post("/addEvent", auth,  async function (req, res) {
    try {
        let date = new Date(req.body.eventDate);
        const eventData = new EventModel({
            eventName: req.body.eventName,
            eventDate: date.toDateString(),
            eventDescription: req.body.eventDescription,
            users: req.user.email
        });

        await eventData.save();
        res.redirect('/');
    } catch (err) {
        res.send(err);
    }
});


// send invite

app.get('/invite', auth,  async (req, res) => {
    const items = await EventModel.find();
    let events = items.filter(event => {
        if(event.users[0] === req.user.email) {
            return event;
        }
    })
    res.render('invite', { events, user: req.user });
});

app.post('/invite', auth, async (req, res) => {
    try {
        console.log(req.body);
        const event = await EventModel.findOne({ eventName: req.body.event });
        if (event) {
            event.users.push(req.body.email);
            await event.save();
            res.redirect('/invite');
        } else {
            res.send('Event does not exist');
        }
    } catch (err) {
        res.send(err);
    }
})
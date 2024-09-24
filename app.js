// const express = require('express');
// const app = express();


// const userModel = require('./models/user');
// const postModel = require('./models/post')
// const cookieParser = require('cookie-parser');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// app.set('view engine', 'ejs');
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(cookieParser())

// app.get('/', (req, res) => {
//     res.render('index');
// })

// app.post('/register', async (req, res) => {
//     let { username, password, age, email, name } = req.body;

//     let user = await userModel.findOne({ email })
//     if (user) return res.send('User already exists');

//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(password, salt, async (err, hash) => {
//             console.log(hash);
//             await userModel.create({
//                 username,
//                 name,
//                 age,
//                 email,
//                 password: hash,
//             })


//             let token = jwt.sign({ email: email, userid: user._id }, 'secretkey')
//             res.send('User registered')
//             res.cookie('token', token)
//         })
//     })
// })

// app.listen(3000)



const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/register', async (req, res) => {
    let { username, password, age, email, name } = req.body;

    try {
        let user = await userModel.findOne({ email });
        if (user) return res.send('User already exists');

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).send('Error generating salt');

            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.status(500).send('Error hashing password');

                try {
                    // Create the new user and await the creation
                    let newUser = await userModel.create({
                        username,
                        name,
                        age,
                        email,
                        password: hash,
                    });

                    // Use the newly created user's _id for the JWT
                    let token = jwt.sign({ email: newUser.email, userid: newUser._id }, 'secretkey');

                    // Set the token in the cookie and send success response
                    res.cookie('token', token);
                    res.send('User registered');
                } catch (err) {
                    // Handle errors during user creation
                    console.error('Error creating user:', err);
                    res.status(500).send('Error creating user');
                }
            });
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Server error');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

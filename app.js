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
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    try {
        let user = await userModel.findOne({ email });
        if (!user) return res.status(500).send('No User Registered');
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).send('Error comparing password');
            if (!result) return res.send('Incorrect Password');
            let token = jwt.sign({ email: user.email, userid: user._id }, 'secretkey');
            res.cookie('pwd-token', token);
            res.render('welcom', { username: user.name });
        })
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Server error');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('pwd-token');
    res.redirect('/login');
})
app.get('/post',isLoggedIn,(req,res)=>{
    res.send('post page');
})


// this is called protected route as we have referenced this function to the profile route and it will check that if the user is logged in or not and then we have passed the user data to the next function as if the user is logged in we may need to acccess teh data in the profile route
function isLoggedIn(req, res, next) {
    // Ensure the token exists in the cookies
    const token = req.cookies['pwd-token'];

    if (!token) {
        return res.status(401).send('You are not logged in'); // If token is missing
    }

    try {
        // Verify the JWT token
        let data = jwt.verify(token, 'secretkey');
        req.user = data; // Attach the user data to the request object
        next();  // Proceed to the next middleware if token is valid
    } catch (err) {
        // If the token is invalid or expired, handle the error
        console.error('JWT verification error:', err);
        return res.status(401).send('Invalid or expired token');
    }
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

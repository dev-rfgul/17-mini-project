const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//this is used to generate unique names for file uploads to avoid duplication
const crypto = require("crypto")
// this pkg will handle the file extensions 
const path = require('path')
const multer = require('multer')

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, (err, bytes) => {
            //the file.original name have the original name of the uploaded file and it will extract the extension name from teh original name 
            const fn = bytes.toString('hex') + path.extname(file.originalname)
            cb(null, fn)
        })

    }
})

const upload = multer({ storage: storage })
app.get('/test', (req, res) => {
    res.render('test')
})
app.post('/upload',upload.single('image'), (req, res) => {
    console.log(req.file)
})
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
                    //   Create the new user and await the creation
                    let newUser = await userModel.create({
                        username,
                        name,
                        age,
                        email,
                        password: hash,
                    });
                    //   Use the newly created user's _id for the JWT
                    let token = jwt.sign({ email: newUser.email, userid: newUser._id }, 'secretkey');
                    //   Set the token in the cookie and send success response
                    res.cookie('token', token);
                    res.send('User registered');
                } catch (err) {
                    //   Handle errors during user creation
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
            res.redirect('/profile')
            res.render('profile', { username: user.name });
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
app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        // Use populate to get the posts
        const user = await userModel.findOne({ email: req.user.email }).populate('posts');
        if (!user) return res.status(404).send('User not found');
        // Pass both username and posts to the template
        res.render('profile', { username: user.name, posts: user.posts, userid: user._id });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Server error');
    }
});
app.get('/like/:id', isLoggedIn, async (req, res) => {
    try {
        let post = await postModel.findOne({ _id: req.params.id }).populate('user');

        // Check if post exists
        if (!post) {
            return res.status(404).send("Post not found.");
        }

        console.log(req.user);

        // Ensure likes is an array
        if (!Array.isArray(post.likes)) {
            post.likes = []; // Initialize likes if it is not an array
        }

        // Check if user is already in likes
        if (post.likes.indexOf(req.user.userid) === -1) {
            post.likes.push(req.user.userid); // Add user to likes
        } else {
            post.likes.splice(post.likes.indexOf(req.user.userid), 1); // Remove user from likes
        }

        // Save the updated post
        await post.save();

        // Redirect after updating
        res.redirect('/profile');
    } catch (error) {
        console.error("Error details:", error); // Log full error details
        res.status(500).send(`An error occurred: ${error.message}`); // Send error details to client
    }
});
app.post('/update/:id', isLoggedIn, async (req, res) => {

    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content })
    res.redirect('/profile');

});
app.get('/delete/:id', async (req, res) => {
    let post = await postModel.deleteOne({ _id: req.params.id });
    res.redirect('/profile');
})
app.get('/edit/:id', isLoggedIn, async (req, res) => {

    let post = await postModel.findOne({ _id: req.params.id }).populate('user');
    res.render('edit', { post })

});





// this is called protected route as we have referenced this function to the profile route and it will check that if the user is logged in or not and then we have passed the user data to the next function as if the user is logged in we may need to acccess teh data in the profile route
app.post('/post', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const { content } = req.body;
        if (content) {
            const post = await postModel.create({
                user: user._id,
                content,
            });
            user.posts.push(post._id);
            // Add the post ID to the user's posts
            await user.save();
        }
        res.redirect('/profile');
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).send('Server error');
    }
});
function isLoggedIn(req, res, next) {
    //   Ensure the token exists in the cookies
    const token = req.cookies['pwd-token'];
    if (!token) {
        return res.status(200).render('login');
        //   If token is missing
    }
    try {
        //   Verify the JWT token
        let data = jwt.verify(token, 'secretkey');
        req.user = data;
        //   Attach the user data to the request object
        next();
        // Proceed to the next middleware if token is valid
    } catch (err) {
        //   If the token is invalid or expired, handle the error
        console.error('JWT verification error:', err);
        return res.status(401).send('Invalid or expired token');
    }
}
app.listen(3000, () => {
    console.log('Server running on port 3000');
});

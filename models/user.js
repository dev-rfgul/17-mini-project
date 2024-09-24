const mongoose = require('mongoose')


mongoose.connect('mongodb+srv://fahad:WXX6mMBb8q6qS6E@cluster0.vz7c8.mongodb.net/17MiniProject?retryWrites=true&w=majority');


const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }], // Ensure this exists
});


module.exports=mongoose.model('user',userSchema)
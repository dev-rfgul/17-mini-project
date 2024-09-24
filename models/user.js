const mongoose = require('mongoose')


mongoose.connect('mongodb+srv://fahad:WXX6mMBb8q6qS6E@cluster0.vz7c8.mongodb.net/17MiniProject?retryWrites=true&w=majority');


const userSchema=mongoose.Schema({
    username: String,
    name: String,
    password: String,
    email: String,
    age: Number,
    post:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post'
    }

})

module.exports=mongoose.model('user',userSchema)
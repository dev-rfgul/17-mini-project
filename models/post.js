    const mongoose = require('mongoose')


    mongoose.connect('mongodb+srv://fahad:WXX6mMBb8q6qS6E@cluster0.vz7c8.mongodb.net/17MiniProject?retryWrites=true&w=majority');


    const postSchema = mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        date:{
            type:Date,
            default:Date.now,
        },
        content:String,
        likes:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        }

    })

    module.exports = mongoose.model('post', postSchema)
const multer = require('multer')

//steps to setup multer
// 1: setup diskstorage
// 2: create upload variable

//this is used to generate unique names for file uploads to avoid duplication
const crypto = require("crypto")
// this pkg will handle the file extensions 
const path = require('path')



//disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, (err, bytes) => {
            const fn = name.toString("hex") + path.extname(file.originalname)
        })
        cb(null, fn)
    }
})

const upload = multer({ storage: storage })

module.export=upload; 
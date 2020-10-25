var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required:true
    },
    password:{
        type: String,
       required:true
    },
    msg:[{
        type : String,
    }]
});

module.exports = new mongoose.model('user',userSchema);
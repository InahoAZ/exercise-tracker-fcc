let mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
  username: String
});

let User = mongoose.model('User', userSchema);

let exerciseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  description: String,
  duration: Number,
  date: {
    type: Date
  }
})


let Exercise = mongoose.model('Exercise', exerciseSchema);



module.exports = {
  User : User,
  Exercise: Exercise
}
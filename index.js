const express = require('express')
const app = express()
const cors = require('cors')
let mongoose = require('mongoose');
const bodyParser = require('body-parser');
let models = require('./db/Models');
let User = models.User;
let Exercise = models.Exercise;

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { userNewUrlParser: true, useUnifiedTopology: true });



app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  let users = await User.find({});
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  let user = new User({
    username: req.body.username
  });
  await user.save();
  res.json({
    username: user.username,
    _id: user._id
  });
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user_id = req.params._id;
  let fecha = new Date();
  if (req.body.date) {
    fecha = new Date(req.body.date);
  }
  try {
    let exer = new Exercise({
      user: user_id,
      description: req.body.description,
      duration: req.body.duration,
      date: fecha.toDateString()
    })
    await exer.save();
    let username = await User.findById(user_id).select('username');

    res.json({
      username: username.username,
      description: exer.description,
      duration: exer.duration,
      date: exer.date.toDateString(),
      _id: username._id
    });
  } catch (e) {
    console.log(e);
    res.json(e)
  }
})


app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    console.log('llega: ', req.query, 'id: ', req.params._id);
    let cond = [];
    let limit = [];
    if (req.query.from) {
      cond.push({ '$gte': ['$$log.date', new Date(req.query.from)] })
    }
    if (req.query.to) {
      cond.push({ '$lt': ['$$log.date', new Date(req.query.to)] })
    }

    

    let query = [
      {
        '$match': {
          '_id': new mongoose.Types.ObjectId(req.params._id)
        }
      }, {
        '$lookup': {
          'from': 'exercises',
          'localField': '_id',
          'foreignField': 'user',
          'as': 'log',
        }
      }, {
        '$unset': ['__v', 'log.__v']
      }, {
        '$project': {

          'log': {
            '$filter': {
              'input': '$log',
              'as': 'log',
              'cond': { '$and': cond }
            }
          },
        },
      }
    ];

    let result = await User.aggregate(query)
    if (req.query.limit) {
      result[0].log = result[0].log.slice(0, req.query.limit);
    }
    //console.log({ ...result[0], count: result[0].log.length })
    // console.log( result[0].log )
    //Convert iso date to format required (there should be a better way to do this)
    result[0].log.forEach((key, v, arr) => {
      
      key.date = new Date(key.date).toDateString();
      console.log(typeof key.date);
    })
    
    res.json({ ...result[0], count: result[0].log.length });
  } catch (e) {
    console.log(e);
    res.json(e)
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

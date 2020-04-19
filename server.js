const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {type: String, required: true},
  exercise: [{type: Schema.Types.ObjectId, ref: 'Exercise'}]
});

const exerciseSchema = new Schema({
  userId: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date}
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

/* 1. I can create a user by posting form data username 
      to /api/exercise/new-user and returned will be an 
      object with username and _id.
*/
// POST /api/exercise/new-user
app.post('/api/exercise/new-user', (req, res) => {
  const newUser = new User({ username: req.body.username});
  newUser.save((err, usr) => {
    if(err){
      console.log('error', err);
      res.json({"error": "something went wrong"});
      return
    }
    res.json(usr);
  });  
})

/* 2. I can get an array of all users by getting 
      api/exercise/users with the same info as when creating 
      a user. 
*/
// GET /api/exercise/users
app.get('/api/exercise/users', (req, res) => {
  User.find()
    .select('username _id')
    .exec((err, usrs) => {
    if(err){
      console.log(err)
      res.json({error: 'something went wrong'});
      return
    }
    res.json(usrs)
  })
})

// POST /api/exercise/add
app.post('/api/exercise/add', (req, res) => {
})

// GET /api/exercise/log?{userId}[&from][&to][&limit]
app.get('/api/exercise/log', (req, res) => {
  if(!req.query.userid){
    res.json({ error: 'no userid'})
    return
  }
  let query = {
    userId: req.query.userid,
    date: {}
  };
  if(req.query.from) query.date.$gte = req.query.from;
  if(req.query.to) query.date.$lte = req.query.to;
  if(req.query.limit) query.limit = req.query.limit;
  
  User.find(query).populate('excercise').exec((err, exs) => {
    if(err){
      console.log(err)
      res.json({ error: 'error'});
      return;
    }
    if(!exs || exs.length < 1){
      res.json({error: 'no data found'})
    } else {
      res.json(exs)
    }
  })
})

// POST /api/exercise/add
/*
app.post('/api/exercise/add', (req, res) => {
   console.log('add request', req.body)
  const nex = {
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? req.body.date : new Date()
  };
  const newEx = new Exercise(nex);
  
  User.findById(req.body.userId, (err, usr) => {  
    if(usr){
      newEx.save((err, ex) => {
        if(err){
          console.log('error', err);
          res.json({"error": err});
          return
        }
        const exercise = [...usr.exercise, ex._id];
        
        User.findByIdAndUpdate(usr._id, {exercise: exercise})
          .populate('exercise')
          .exec((err, updatedUsr) => {
          if(err){
            console.log(err)
            res.json({'error': err})
            return
          }  
          const retExc = updatedUsr.exercise.concat(Object.assign(nex, {_id: ex._id}));
          const retObj = Object.assign(updatedUsr, { exercise: retExc });
          
          console.log('exercise added', {retExc, retObj});
          res.json(retObj);
        })
        
      })
    } else {
      res.json({'error': 'user not found'})
    }
  })
})
*/



app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

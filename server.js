const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {type: String, required: true}
});

const exerciseSchema = new Schema({
  userId: {type: mongoose.Schema.ObjectId, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date}
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// GET /api/exercise/users
app.get('/api/exercise/users', (req, res) => {
  User.find((err, usrs) => {
    if(err){
      console.log(err)
      res.json({error: 'something went wrong'});
      return
    }
    res.json(usrs)
  })
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
  
  Exercise.find(query, (err, exs) => {
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
app.post('/api/exercise/add', (req, res) => {
  
  console.log('req', req.body)
  
  const newEx = new Exercise({
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? req.body.date : new Date()
  });
  
  newEx.save((err, ex) => {
    if(err){
      console.log('error', err);
      res.json({"error": err});
      return
    }
    
    res.json(ex);
  })
})

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

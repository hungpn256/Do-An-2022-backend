require('dotenv').config();
const chalk = require('chalk');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const morgan = require('morgan')
const keys = require('./config/keys');
const { database, port } = keys;
const routes = require('./routes/index.js');


const app = express();
app.use(morgan('combined'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use("/public", express.static(path.join(__dirname, "uploads")));
// Connect to MongoDB
mongoose.set('useCreateIndex', true);
mongoose.connect(database.url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
  .then(() => console.log(`${chalk.green('✓')} ${chalk.blue('MongoDB Connected!')}`))
  .catch(err => console.log(err));



app.get('/', (req, res) => {
  res.send('Hello world!!');
});

app.use('/api/v1', routes)

app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
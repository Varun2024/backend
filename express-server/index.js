const express = require('express');

const app = express();
app.get('/', (req, res) => {
  res.send('Welcome to the home page!');
});

app.get('/contact-us', (req, res) => {
  res.send('Welcome to the contact us page!');
});

app.post('/tweet', (req, res) => {
  res.status(201).send('Tweet created successfully!');
});
app.get('/tweet/:id', (req, res) => {
  const tweetId = req.params.id;
  res.send(`You requested tweet with ID: ${tweetId}`);
});

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});


import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Use post instead!');
});

app.post('/', (req, res) => {
  const data = req.body;
  console.log(data);

  res.send('Ok!');
});

app.listen(process.env.PORT);

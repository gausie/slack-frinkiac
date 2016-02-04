import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());

app.post('/', (req, res) => {
  const data = req.body;
  console.log(data);

  res.send('Ok!');
});

app.listen(3000);

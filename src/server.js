import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import yargs from 'yargs';

// Configure environment variables
const frinkiac = process.env.API || 'http://frinkiac.com';
const lineLength = process.env.LINE_LENGTH || 25;
const port = process.env.PORT || 3000;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// Configure HTTP server
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Configure HTTP client
const api = axios.create({
  baseURL: `${frinkiac}/api`,
});

function parseCommand(rawCommand) {
  const { _: searchArray, random } = yargs
    .boolean('random')
    .parse(
      rawCommand
        .replace('—', '--')
        .split(' ')
    );

  const text = searchArray.join(' ');

  return { text, random };
}

// Return meme caption string for set of subtitles.
// This is based on the code actually used on frinkiac.com.
function getCaptionString(caption, maxLinelength) {
  if (caption === null || caption.Subtitles === null) return '';

  return caption.Subtitles
    .map(sub => sub.Content)
    .join(' ').split(' ')
    .reduce((lines, word) => {
      const nextLines = lines;
      if ((lines[lines.length - 1].join(' ').length + word.length + 1) <= maxLinelength) {
        nextLines[lines.length - 1].push(word);
      } else {
        nextLines.push([word]);
      }
      return nextLines;
    }, [[]])
    .map(line => line.join(' '))
    .join('\n');
}

// Return meme url constructed from arguments.
function getMemeUrl(episode, timestamp, caption) {
  return `${frinkiac}/meme/${episode}/${timestamp}.jpg?lines=${encodeURIComponent(caption)}`;
}

// Return Slack Response object for meme.
function getSlackResponse(text, memeUrl) {
  return {
    response_type: 'in_channel',
    attachments: [
      {
        text,
        fallback: 'There should be a cool Simpsons quote here.',
        image_url: memeUrl,
      },
    ],
  };
}

// Handle OAuth
app.get('/auth', (req, res) => {
  const code = req.query.code;
  axios.get('https://slack.com/api/oauth.access', {
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    },
  })
    .then(response => {
      const { data } = response;
      if (data.ok) {
        res.send(`You can now use /frinkiac [simpsons quote] in ${data.team_name}!`);
      } else {
        res.send('An error occurred and you could not be authorized.');
      }
    });
});

// Handle Slack commands
app.post('/cmd', (req, res) => {
  const { text, random } = parseCommand(req.body.text);
  api.get(`/search?q=${encodeURIComponent(text)}`)
    .then(results => results.data[random ? Math.floor(Math.random() * results.data.length) : 0])
    .then(result => api.get(`/caption?e=${result.Episode}&t=${result.Timestamp}`)
      .then(caption => getCaptionString(caption.data, lineLength))
      .then(captionString => getMemeUrl(result.Episode, result.Timestamp, captionString))
      .then(memeUrl => getSlackResponse(text, memeUrl))
      .then(slackResponse => res.send(slackResponse))
    )
    .catch(() => res.status(500).send(`Frinkiac could not match ${text}`));
});

// Start the server
app.listen(port);

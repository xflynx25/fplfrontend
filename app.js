// app.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const transfersDir = path.join(dataDir, 'transfers');

// Function to read and parse the CSV file
function getFantasyData(callback) {
  const results = [];
  fs.createReadStream(path.join(dataDir, 'market.csv'))
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      callback(results);
    });
}

// Route for the home page
app.get('/', (req, res) => {
  getFantasyData((data) => {
    const topN = 100;
    const gw = data.length > 0 ? data[0].gw : 'Unknown';

    // Convert points to numbers and sort
    data.forEach((item) => {
      item.points_N1 = parseFloat(item.expected_pts_N1);
      item.points_N6 = parseFloat(item.expected_pts_full);
    });

    const sortedN1 = [...data].sort((a, b) => b.points_N1 - a.points_N1).slice(0, topN);
    const sortedN6 = [...data].sort((a, b) => b.points_N6 - a.points_N6).slice(0, topN);

    res.render('index', { sortedN1, sortedN6, gw });
  });
});

// Rename the original /team route to /suggestions
app.get('/suggestions', (req, res) => {
  res.render('suggestions'); // You will create a suggestions.ejs
});

// Create a new route /ai_teams that displays the contents of the transfers files
app.get('/ai_teams', (req, res) => {
  fs.readdir(transfersDir, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading transfers directory.');
    }

    const transferFiles = files.filter(file => file.startsWith('transfers_') && file.endsWith('.txt'));
    if (transferFiles.length === 0) {
      return res.render('ai_teams', { transferFiles: [], selectedUsername: null, content: 'No teams available.' });
    }

    // If no username selected, default to the first one
    let selectedUsername = req.query.username;
    if (!selectedUsername) {
      selectedUsername = transferFiles[0].replace('transfers_', '').replace('.txt', '');
    }

    const selectedFile = `transfers_${selectedUsername}.txt`;
    const filePath = path.join(transfersDir, selectedFile);

    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return res.status(500).send('Error reading selected transfers file.');
      }
      res.render('ai_teams', { transferFiles, selectedUsername, content });
    });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

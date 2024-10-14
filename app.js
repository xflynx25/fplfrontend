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

// Function to read and parse the CSV file
function getFantasyData(callback) {
  const results = [];

  fs.createReadStream(path.join(__dirname, 'data', 'market.csv'))
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      callback(results);
    });
}

// Route for the home page
app.get('/', (req, res) => {
  getFantasyData((data) => {
    const topN = 40;

    // Extract 'gw' from the data (assuming all rows have the same 'gw')
    const gw = data.length > 0 ? data[0].gw : 'Unknown';

    // Convert points to numbers and sort
    data.forEach((item) => {
      item.points_N1 = parseFloat(item.expected_pts_N1);
      item.points_N6 = parseFloat(item.expected_pts_full);
    });

    const sortedN1 = [...data]
      .sort((a, b) => b.points_N1 - a.points_N1)
      .slice(0, topN);

    const sortedN6 = [...data]
      .sort((a, b) => b.points_N6 - a.points_N6)
      .slice(0, topN);

    res.render('index', { sortedN1, sortedN6, gw });
  });
});

// Placeholder route for the team page
app.get('/team', (req, res) => {
  res.render('team');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



// Budget API

const express = require('express');
const cors = require('cors');
const path = require('path'); 
const fs = require('fs'); 
const app = express();
const port = 3000;

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const budget = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercise.json'), 'utf8'));

app.get('/budget', (req, res) => {
    res.json(budget);
});

app.listen(port, () => {
    console.log(`API served at http://localhost:${port}`);
});

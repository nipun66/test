const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"))

const LOG_FILE = path.join(__dirname, 'log.json');

app.post('/submit-review', (req, res) => {
  const { userId, review, rating } = req.body;
  if (!userId || !review || !rating) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const entry = { userId, review, rating, timestamp };
  const data = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE)) : [];
  data.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));

  res.json({ status: 'success' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

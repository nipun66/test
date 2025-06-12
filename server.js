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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get('/reviews', (req, res) => {
  if (!fs.existsSync(LOG_FILE)) return res.send('<h3>No reviews yet.</h3>');

  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    let reviews = raw ? JSON.parse(raw) : [];

    const { stars, limit } = req.query;

    // ⭐ Filter by rating if ?stars=5
    if (stars) {
      reviews = reviews.filter(r => r.rating === parseInt(stars));
    }

    // 🔢 Limit to first N
    if (limit) {
      reviews = reviews.slice(0, parseInt(limit));
    }

    const tableRows = reviews.map(r => `
      <tr>
        <td>${r.userId}</td>
        <td>${r.rating}</td>
        <td>${r.review}</td>
        <td>${r.timestamp}</td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <title>Filtered Reviews</title>
        <style>
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          body { font-family: sans-serif; padding: 40px; }
        </style>
      </head>
      <body>
        <h2>Filtered Reviews (${reviews.length} found)</h2>
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.send(html);

  } catch (err) {
    res.status(500).send('<h3>Error reading reviews.</h3>');
  }
});

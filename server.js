const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// TODO: Replace with your actual URI from MongoDB Atlas
const MONGO_URI = 'mongodb%2Bsrv%3A%2F%2Fnipunv111%3Amongo123%40cluster0.gj9ebnd.mongodb.net%2F%3FretryWrites%3Dtrue%26w%3Dmajority%27%0A'
let db, collection;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db('reviewDB'); // or your DB name from Compass
  collection = db.collection('reviews');
  console.log('✅ Connected to MongoDB');
}

connectDB().catch(console.error);

app.post('/submit-review', async (req, res) => {
  try {
    const { userId, review, rating } = req.body;
    if (!userId || !review || !rating) return res.status(400).json({ error: 'Missing fields' });

    const entry = {
      userId,
      review,
      rating,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    await collection.insertOne(entry);
    res.json({ status: 'success', message: 'Review saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// basic health route
app.get('/', (req, res) => res.send('Server is running'));

// show reviews in HTML dashboard (optional upgrade)
app.get('/reviews', async (req, res) => {
  try {
    const { stars, limit } = req.query;
    let query = {};
    if (stars) query.rating = parseInt(stars);
    const options = limit ? { limit: parseInt(limit) } : {};

    const reviews = await collection.find(query, options).toArray();
    const total = reviews.length;
    const avgRating = total ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(2) : 0;

    const rows = reviews.map(r => `
      <tr>
        <td>${r.userId}</td>
        <td>${'⭐️'.repeat(r.rating)}</td>
        <td>${r.review}</td>
        <td>${r.timestamp}</td>
      </tr>
    `).join('');

    res.send(`
      <html><head><style>
        body { font-family: sans-serif; padding: 20px; }
        .summary { margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 10px; border: 1px solid #ccc; }
        th { background: #f0f0f0; }
      </style></head><body>
        <h2>📊 Review Dashboard</h2>
        <div class="summary">
          <strong>Total Reviews:</strong> ${total}<br/>
          <strong>Average Rating:</strong> ${avgRating} ⭐
        </div>
        <table>
          <tr><th>User ID</th><th>Rating</th><th>Review</th><th>Timestamp</th></tr>
          ${rows}
        </table>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Error fetching reviews');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

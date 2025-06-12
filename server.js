const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve index.html

const PORT = process.env.PORT || 3000;

// ✅ Replace this with your real, unencoded password
const MONGO_URI = 'mongodb+srv://nipunv111:mongo123@cluster0.gj9ebnd.mongodb.net/reviewDB?retryWrites=true&w=majority'

let collection;

// ✅ Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('reviewDB');
    collection = db.collection('reviews');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
  }
}

connectDB();

app.post('/submit-review', async (req, res) => {
  try {
    if (!collection) throw new Error('MongoDB not connected');

    const { userId, review, rating } = req.body;
    if (!userId || !review || !rating) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const entry = {
      userId,
      review,
      rating,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    await collection.insertOne(entry);
    res.json({ status: 'success', message: 'Review saved' });
  } catch (err) {
    console.error('❌ Insert error:', err.message);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

app.get('/reviews', async (req, res) => {
  try {
    if (!collection) throw new Error('MongoDB not connected');

    const reviews = await collection.find().toArray();
    const total = reviews.length;
    const avg = (total ? reviews.reduce((a, b) => a + b.rating, 0) / total : 0).toFixed(2);

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
        body { font-family: sans-serif; padding: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
        th { background: #f0f0f0; }
      </style></head><body>
        <h2>📊 Review Dashboard</h2>
        <p><strong>Total Reviews:</strong> ${total}</p>
        <p><strong>Average Rating:</strong> ${avg} ⭐</p>
        <table>
          <thead><tr><th>User</th><th>Rating</th><th>Review</th><th>Timestamp</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Error loading reviews');
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

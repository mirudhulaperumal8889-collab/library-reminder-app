const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Books Storage Array
let books = [];

// Nodemailer Gmail Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mirudhulaperumal8889@gmail.com', 
    pass: 'Lsgk bfhb kpft zbtk' // 👈 உங்கள் App Password சேர்க்கப்பட்டுள்ளது
  }
});

// Email அனுப்பும் ஃபங்க்ஷன்
function sendEmailReminder(toEmail, bookTitle, daysLeft) {
  const mailOptions = {
    from: 'mirudhulaperumal8889@gmail.com',
    to: toEmail,
    subject: `📚 Library Reminder: ${bookTitle}`,
    text: `வணக்கம்!\n\nநீங்கள் எடுத்த '${bookTitle}' புத்தகத்தைத் திரும்பத் தர இன்னும் ${daysLeft} நாட்கள் மட்டுமே உள்ளன. தயவுசெய்து குறித்த நேரத்தில் லைப்ரரியில் ஒப்படைக்கவும்.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Email send error:', error);
    } else {
      console.log('Email sent successfully: ' + info.response);
    }
  });
}

// ⏰ தினமும் காலை 9 மணிக்கு Due Date செக் பண்ணி Email அனுப்பும் Cron Job
cron.schedule('0 9 * * *', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  books.forEach(book => {
    if (!book.returned && book.userEmail) {
      const issueDate = new Date(book.issueDate);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 10);

      const timeDiff = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysRemaining <= 2 && daysRemaining >= 0) {
        sendEmailReminder(book.userEmail, book.title, daysRemaining);
      }
    }
  });
});

// API: Get All Books
app.get('/api/books', (req, res) => {
  res.json(books);
});

// API: Add New Book
app.post('/api/books', (req, res) => {
  const { title, issueDate, userEmail } = req.body;
  if (!title || !issueDate) {
    return res.status(400).json({ error: 'Please provide required fields.' });
  }

  const newBook = { id: Date.now(), title, issueDate, userEmail, returned: false };
  books.push(newBook);

  // புத்தகம் ஆட் பண்ணியவுடன் Confirmation Email அனுப்பப்படும்
  if (userEmail) {
    sendEmailReminder(userEmail, title, 10);
  }

  res.status(201).json(newBook);
});

// API: Toggle Return Status
app.patch('/api/books/:id/return', (req, res) => {
  const bookId = Number(req.params.id);
  const book = books.find(b => b.id === bookId);
  if (book) {
    book.returned = true;
    res.json(book);
  } else {
    res.status(404).json({ error: 'Book not found' });
  }
});

// API: Delete Book
app.delete('/api/books/:id', (req, res) => {
  const bookId = Number(req.params.id);
  books = books.filter(book => book.id !== bookId);
  res.json({ message: 'Book deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
document.addEventListener("DOMContentLoaded", () => {
  const bookForm = document.getElementById("book-form");
  const bookTitleInput = document.getElementById("book-title");
  const issueDateInput = document.getElementById("issue-date");
  const userEmailInput = document.getElementById("user-email");
  const bookList = document.getElementById("book-list");
  const bookCount = document.getElementById("book-count");
  const searchInput = document.getElementById("search-input");

  let allBooks = [];

  issueDateInput.valueAsDate = new Date();

  // Express API-யில் இருந்து புத்தகங்களைப் பெறுதல்
  async function fetchBooks() {
    try {
      const res = await fetch('/api/books');
      allBooks = await res.json();
      renderBooks(allBooks);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  }

  function renderBooks(booksToRender) {
    bookList.innerHTML = "";
    bookCount.textContent = booksToRender.length;

    if (booksToRender.length === 0) {
      bookList.innerHTML = "<p style='color: #7f8c8d; text-align: center;'>No books found.</p>";
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    booksToRender.forEach((book) => {
      const issueDate = new Date(book.issueDate);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 10);

      const timeDiff = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let statusClass = "safe";
      let statusText = `${daysRemaining} days left`;

      if (book.returned) {
        statusClass = "safe";
        statusText = "Returned ✅";
      } else if (daysRemaining < 0) {
        statusClass = "overdue";
        statusText = `Overdue by ${Math.abs(daysRemaining)} day(s)!`;
      } else if (daysRemaining <= 2) {
        statusClass = "warning";
        statusText = daysRemaining === 0 ? "Due Today!" : `${daysRemaining} day(s) left`;
      }

      const bookElement = document.createElement("div");
      bookElement.className = `book-item ${statusClass}`;
      bookElement.style.opacity = book.returned ? "0.6" : "1";

      bookElement.innerHTML = `
        <div class="book-info">
          <h3 style="${book.returned ? 'text-decoration: line-through;' : ''}">${book.title}</h3>
          <p>Issued: ${issueDate.toLocaleDateString()} | Due: ${dueDate.toLocaleDateString()}</p>
        </div>
        <div class="actions">
          <span class="badge ${statusClass}">${statusText}</span>
          ${!book.returned ? `<button class="return-btn" onclick="toggleReturn(${book.id})">Return</button>` : ''}
          <button class="delete-btn" onclick="removeBook(${book.id})">🗑️️</button>
        </div>
      `;

      bookList.appendChild(bookElement);
    });
  }

  // Search filter
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allBooks.filter(book => book.title.toLowerCase().includes(query));
      renderBooks(filtered);
    });
  }

  // Add Book
  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newBook = {
      title: bookTitleInput.value,
      issueDate: issueDateInput.value,
      userEmail: userEmailInput.value
    };

    try {
      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });

      bookTitleInput.value = "";
      userEmailInput.value = "";
      issueDateInput.valueAsDate = new Date();
      fetchBooks();
    } catch (err) {
      console.error('Error adding book:', err);
    }
  });

  // Toggle Return status
  window.toggleReturn = async (id) => {
    try {
      await fetch(`/api/books/${id}/return`, { method: 'PATCH' });
      fetchBooks();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Delete Book
  window.removeBook = async (id) => {
    try {
      await fetch(`/api/books/${id}`, { method: 'DELETE' });
      fetchBooks();
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  fetchBooks();
});
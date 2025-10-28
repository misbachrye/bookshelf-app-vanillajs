document.addEventListener('DOMContentLoaded', function () {
    const books = [];
    const RENDER_EVENT = 'render-bookshelf';
    const STORAGE_KEY = 'BOOKSHELF_APPS';

    const bookForm = document.getElementById('bookForm');
    const searchForm = document.getElementById('searchBook');
    const incompleteBookList = document.getElementById('incompleteBookList');
    const completeBookList = document.getElementById('completeBookList');
    
    const isCompleteCheckbox = document.getElementById('bookFormIsComplete');
    const buttonSpan = document.querySelector('#bookFormSubmit span');

    isCompleteCheckbox.addEventListener('change', function () {
        if (isCompleteCheckbox.checked) {
            buttonSpan.innerText = 'Selesai dibaca';
        } else {
            buttonSpan.innerText = 'Belum selesai dibaca';
        }
    });

    function isStorageExist() {
        if (typeof (Storage) === 'undefined') {
            alert('Browser Anda tidak mendukung Web Storage');
            return false;
        }
        return true;
    }
    
    function saveData() {
        if (isStorageExist()) {
            const parsed = JSON.stringify(books);
            localStorage.setItem(STORAGE_KEY, parsed);
        }
    }

    function loadDataFromStorage() {
        const serializedData = localStorage.getItem(STORAGE_KEY);
        let data = JSON.parse(serializedData);

        if (data !== null) {
            for (const book of data) {
                books.push(book);
            }
        }
        document.dispatchEvent(new Event(RENDER_EVENT));
    }
    
    function generateBookObject(id, title, author, year, isComplete) {
        return { id, title, author, year, isComplete };
    }

    function addBook() {
        const title = document.getElementById('bookFormTitle').value;
        const author = document.getElementById('bookFormAuthor').value;
        const year = document.getElementById('bookFormYear').value;
        const isComplete = document.getElementById('bookFormIsComplete').checked;

        const id = +new Date();
        const bookObject = generateBookObject(id, title, author, parseInt(year), isComplete);
        books.push(bookObject);

        document.dispatchEvent(new Event(RENDER_EVENT));
        saveData();
    }

    function makeBookElement(bookObject) {
        const bookItem = document.createElement('div');
        bookItem.setAttribute('data-bookid', bookObject.id);
        bookItem.setAttribute('data-testid', 'bookItem');

        const bookTitle = document.createElement('h3');
        bookTitle.setAttribute('data-testid', 'bookItemTitle');
        bookTitle.innerText = bookObject.title;

        const bookAuthor = document.createElement('p');
        bookAuthor.setAttribute('data-testid', 'bookItemAuthor');
        bookAuthor.innerText = 'Penulis: ' + bookObject.author;

        const bookYear = document.createElement('p');
        bookYear.setAttribute('data-testid', 'bookItemYear');
        bookYear.innerText = 'Tahun: ' + bookObject.year;

        const actionContainer = document.createElement('div');

        const isCompleteButton = document.createElement('button');
        isCompleteButton.setAttribute('data-testid', 'bookItemIsCompleteButton');
        
        if (bookObject.isComplete) {
            isCompleteButton.innerText = 'Belum Selesai';
            isCompleteButton.addEventListener('click', function () {
                undoBookFromCompleted(bookObject.id);
            });
        } else {
            isCompleteButton.innerText = 'Selesai Dibaca';
            isCompleteButton.addEventListener('click', function () {
                addBookToCompleted(bookObject.id);
            });
        }

        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
        deleteButton.innerText = 'Hapus Buku';
        deleteButton.addEventListener('click', function () {
            removeBook(bookObject.id);
        });
        
        const editButton = document.createElement('button');
        editButton.setAttribute('data-testid', 'bookItemEditButton');
        editButton.innerText = 'Edit Buku';
        editButton.addEventListener('click', function () {
            showEditForm(bookObject.id);
        });

        actionContainer.append(isCompleteButton, deleteButton, editButton);
        bookItem.append(bookTitle, bookAuthor, bookYear, actionContainer);

        return bookItem;
    }

    function findBook(bookId) {
        return books.find(book => book.id === bookId) || null;
    }
    
    function findBookIndex(bookId) {
        return books.findIndex(book => book.id === bookId);
    }
    
    function addBookToCompleted(bookId) {
        const bookTarget = findBook(bookId);
        if (bookTarget == null) return;
        
        bookTarget.isComplete = true;
        document.dispatchEvent(new Event(RENDER_EVENT));
        saveData();
    }
    
    function undoBookFromCompleted(bookId) {
        const bookTarget = findBook(bookId);
        if (bookTarget == null) return;
        
        bookTarget.isComplete = false;
        document.dispatchEvent(new Event(RENDER_EVENT));
        saveData();
    }
    
    function removeBook(bookId) {
        const bookTargetIndex = findBookIndex(bookId);
        if (bookTargetIndex === -1) return;
        
        books.splice(bookTargetIndex, 1);
        document.dispatchEvent(new Event(RENDER_EVENT));
        saveData();
    }
    
    function showEditForm(bookId) {
        const bookToEdit = findBook(bookId);
        if (!bookToEdit) return;

        const bookItemElement = document.querySelector(`[data-bookid='${bookId}']`);
        
        bookItemElement.innerHTML = `
            <form data-testid="bookItemEditForm" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <input type="text" value="${bookToEdit.title}" data-testid="bookItemTitleInput" required>
                <input type="text" value="${bookToEdit.author}" data-testid="bookItemAuthorInput" required>
                <input type="number" value="${bookToEdit.year}" data-testid="bookItemYearInput" required>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button type="submit" class="blue" data-testid="bookItemSaveButton">Simpan</button>
                    <button type="button" class="red" data-testid="bookItemCancelButton">Batal</button>
                </div>
            </form>
        `;

        const editForm = bookItemElement.querySelector('[data-testid="bookItemEditForm"]');
        editForm.addEventListener('submit', function (event) {
            event.preventDefault();
            
            const bookTarget = findBook(bookId);
            bookTarget.title = editForm.querySelector('[data-testid="bookItemTitleInput"]').value;
            bookTarget.author = editForm.querySelector('[data-testid="bookItemAuthorInput"]').value;
            bookTarget.year = parseInt(editForm.querySelector('[data-testid="bookItemYearInput"]').value);
            
            saveData();
            document.dispatchEvent(new Event(RENDER_EVENT));
        });

        const cancelButton = editForm.querySelector('[data-testid="bookItemCancelButton"]');
        cancelButton.addEventListener('click', function () {
            document.dispatchEvent(new Event(RENDER_EVENT)); 
        });
    }

    bookForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addBook();
        bookForm.reset();
    });

    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const searchTitle = document.getElementById('searchBookTitle').value.toLowerCase();
        const filteredBooks = books.filter(book => book.title.toLowerCase().includes(searchTitle));
        renderFilteredBooks(filteredBooks);
    });

    document.addEventListener(RENDER_EVENT, function () {
        incompleteBookList.innerHTML = '';
        completeBookList.innerHTML = '';

        for (const bookItem of books) {
            const bookElement = makeBookElement(bookItem);
            if (bookItem.isComplete) {
                completeBookList.append(bookElement);
            } else {
                incompleteBookList.append(bookElement);
            }
        }
    });
    
    function renderFilteredBooks(filteredBooks) {
        incompleteBookList.innerHTML = '';
        completeBookList.innerHTML = '';

        for (const bookItem of filteredBooks) {
            const bookElement = makeBookElement(bookItem);
            if (bookItem.isComplete) {
                completeBookList.append(bookElement);
            } else {
                incompleteBookList.append(bookElement);
            }
        }
    }

    if (isStorageExist()) {
        loadDataFromStorage();
    }
});
const themeButton = document.getElementById("theme-toggle");


if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeButton.textContent = "☀️";
}

themeButton.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        themeButton.textContent = "☀️";
        localStorage.setItem("theme", "dark");
    } else {
        themeButton.textContent = "🌙";
        localStorage.setItem("theme", "light");
    }

});

const questionsInput = document.getElementById("questions");
const difficultySelect = document.getElementById("difficulty");
const topicSelect = document.getElementById("topic");
const platformSelect = document.getElementById("platform");
const searchProgress = document.getElementById("search-progress");
const filterDifficulty = document.getElementById("filter-difficulty");
const filterPlatform = document.getElementById("filter-platform");
const saveButton = document.getElementById("save-progress");
const progressResult = document.getElementById("progress-result");
const recentProgressList = document.getElementById("recent-progress-list");
const totalProgress = document.getElementById("total-progress");
const difficultyProgress =
    document.getElementById("difficulty-progress");
const targetQuestions = document.getElementById("target-questions");
const progressPercentage = document.getElementById("progress-percentage");
let difficultyChart = null;

const savedTarget = localStorage.getItem("targetQuestions");

if (savedTarget) {
    targetQuestions.value = savedTarget;
}
const progressDate = document.getElementById("progress-date");
let editingId = null;
const today = new Date().toISOString().split("T")[0];
progressDate.value = today;

saveButton.addEventListener("click", async function () {


    const questions = questionsInput.value;
    const difficulty = difficultySelect.value;
    const topic = topicSelect.value;
    const platform = platformSelect.value;
    const date = progressDate.value;

    if (questions === "") {
        alert("Please enter the number of solved questions.");
        return;
    }

    if (date === "") {
        alert("Please select a date.");
        return;
    }

    if (Number(questions) < 1 || Number(questions) > 500) {
        alert("Please enter questions between 1 and 500.");
        return;
    }
    saveButton.disabled = true;

    // EDIT MODE
    if (editingId !== null) {
        saveButton.textContent = "Updating...";

        try {

            const response = await fetch(
                `http://localhost:5000/api/progress/${editingId}`,
                {
                    method: "PUT",
                    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
},
                    body: JSON.stringify({
                        questions: Number(questions),
                        topic: topic,
                        difficulty: difficulty,
                        platform: platform,
                        date: date
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Update failed");
            }

            alert("✅ Progress updated successfully!");

            editingId = null;
            saveButton.textContent = "Save Progress";
            await loadProgress();

        } catch (error) {

            console.error("Update error:", error);
            alert("❌ " + error.message);

        }

    }

    // NEW RECORD
    else {
        saveButton.textContent = "Saving...";

        try {

            const response = await fetch(
                "http://localhost:5000/api/progress",
                {
                    method: "POST",
                    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
},
                    body: JSON.stringify({
                        questions: Number(questions),
                        topic: topic,
                        difficulty: difficulty,
                        platform: platform,
                        date: date
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {

                if (result.errors && result.errors.length > 0) {
                    throw new Error(result.errors.join(", "));
                }

                throw new Error(result.message || "Save failed");
            }

            alert("✅ Progress saved successfully!");
            await loadProgress();

        } catch (error) {

            console.error("Save error:", error);
            alert(error.message);

        }

    }

    // Clear form
    questionsInput.value = "";
    progressDate.value = "";

    difficultySelect.value = "Easy";
    topicSelect.value = "Arrays";
    platformSelect.value = "LeetCode";

    saveButton.disabled = false;
    saveButton.textContent = "Save Progress";
});

let savedProgress = [];

async function loadProgress() {

    console.log("LOAD PROGRESS FUNCTION CALLED");

    try {

        const response = await fetch(
    "http://localhost:5000/api/progress",
    {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    }
);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch progress");
        }

        savedProgress = result.data;

        console.log("MongoDB Progress:", savedProgress);

        displayProgress(savedProgress);
        updateDashboard();

    } catch (error) {

        console.error("Load progress error:", error);
        alert("Failed to load progress from server.");

    }

}

function displayProgress(progressData) {

    progressResult.innerHTML = "";

    if (progressData.length === 0) {
        progressResult.innerHTML = `
        <div class="no-results">
            <h3>🔍 No matching progress found</h3>
            <p>Try changing your search or filters.</p>
        </div>
    `;
        return;
    }

    progressData.forEach(function (entry, index) {

        progressResult.innerHTML += `
            <div class="progress-card ${entry.difficulty.toLowerCase()}">

                <h3>Progress #${index + 1}</h3>

                <p>Questions Solved: ${entry.questions}</p>

                <p>Topic: ${entry.topic || "N/A"}</p>

                <p>Platform: ${entry.platform || "N/A"}</p>

                <p>Difficulty: ${entry.difficulty}</p>

                <p>Date: ${entry.date || "N/A"}</p>
                <button class="edit-progress" data-id="${entry._id}">
    Edit
</button>

                <button class="delete-progress" data-id="${entry._id}">
    Delete
</button>

            </div>
        `;
    });
}

displayProgress(savedProgress);
function filterProgress() {

    const searchText = searchProgress.value.toLowerCase();
    const selectedDifficulty = filterDifficulty.value;
    const selectedPlatform = filterPlatform.value;

    const filteredProgress = savedProgress.filter(function (entry) {

        const topic = entry.topic || "";
        const platform = entry.platform || "";

        const matchesSearch =
            topic.toLowerCase().includes(searchText);

        const matchesDifficulty =
            selectedDifficulty === "All" ||
            entry.difficulty === selectedDifficulty;

        const matchesPlatform =
            selectedPlatform === "All" ||
            platform === selectedPlatform;

        return matchesSearch && matchesDifficulty && matchesPlatform;
    });

    displayProgress(filteredProgress);
}
searchProgress.addEventListener("input", filterProgress);
filterDifficulty.addEventListener("change", filterProgress);
filterPlatform.addEventListener("change", filterProgress);


// YAHAN SE FUNCTION PASTE KAR
function updateDashboard() {

    let total = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let easyQuestions = 0;
let mediumQuestions = 0;
let hardQuestions = 0;

    savedProgress.forEach(function (entry) {

        total += Number(entry.questions);

        if (entry.difficulty === "Easy") {
    easy++;
    easyQuestions += Number(entry.questions);
}

if (entry.difficulty === "Medium") {
    medium++;
    mediumQuestions += Number(entry.questions);
}

if (entry.difficulty === "Hard") {
    hard++;
    hardQuestions += Number(entry.questions);
}

    });

    // Total Questions
    totalProgress.innerHTML = `
        <h3>${total}</h3>
    `;

    // Difficulty
    difficultyProgress.innerHTML = `
        <p>Easy: ${easy}</p>
        <p>Medium: ${medium}</p>
        <p>Hard: ${hard}</p>
    `;
    // Recent Progress
    const recentProgress = savedProgress.slice(0, 5);

    recentProgressList.innerHTML = "";

    if (recentProgress.length === 0) {

        recentProgressList.innerHTML = `
            <p>No progress added yet.</p>
        `;

    } else {

        recentProgress.forEach(function (entry) {

            recentProgressList.innerHTML += `
                <div class="recent-progress-item">
                    <strong>${entry.topic}</strong>
                    <span>${entry.questions} Questions</span>
                    <span>${entry.difficulty}</span>
                    <span>${entry.date}</span>
                </div>
            `;

        });

    }

    // Target
    let target = Number(localStorage.getItem("targetQuestions")) || 0;

    // Progress Percentage
    let percentage = 0;

    if (target > 0) {
        percentage = (total / target) * 100;
    }

    if (percentage > 100) {
        percentage = 100;
    }

    if (target > 0) {

    progressPercentage.innerHTML = `
        <p>${percentage.toFixed(1)}%</p>
        <small>${total} / ${target} Questions</small>
    `;

} else {

    progressPercentage.innerHTML = `
        <p>0.0%</p>
        <small>Set a target to track your progress</small>
    `;

}
// Difficulty Chart
// Difficulty Chart
const chartCanvas = document.getElementById("difficultyChart");

if (chartCanvas) {

    // Agar pehle se chart bana hua hai to destroy karo
    if (difficultyChart) {
        difficultyChart.destroy();
    }

    const ctx = chartCanvas.getContext("2d");

    difficultyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Easy", "Medium", "Hard"],
            datasets: [{
                label: "Questions",
                data: [easyQuestions, mediumQuestions, hardQuestions]
            }]
        },
        options: {
    responsive: true,

    plugins: {
        title: {
            display: true,
            text: "Questions by Difficulty"
        },
        legend: {
            display: true
        }
    },

    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                precision: 0
            }
        }
    }
}
    });
}
}
// FUNCTION YAHAN KHATAM
updateDashboard();
loadProgress();



document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("edit-progress")) {

        const id = event.target.getAttribute("data-id");
        editingId = id;

        const entry = savedProgress.find(function (item) {
            return String(item._id) === String(id);
        });

        if (!entry) {
            return;
        }

        questionsInput.value = entry.questions;
        topicSelect.value = entry.topic;
        platformSelect.value = entry.platform;
        difficultySelect.value = entry.difficulty;
        progressDate.value = entry.date;
        saveButton.textContent = "Update Progress";
    }

    if (event.target.classList.contains("delete-progress")) {

        const button = event.target;
        const id = button.getAttribute("data-id");

        const confirmDelete = confirm(
            "Are you sure you want to delete this progress?"
        );

        if (!confirmDelete) return;

        button.textContent = "Deleting...";
        button.disabled = true;

        try {
            const response = await fetch(
    `http://localhost:5000/api/progress/${id}`,
    {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    }
);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed");
            }

            alert("✅ Progress deleted successfully!");

            // MongoDB se fresh data load karo
            await loadProgress();

        } catch (error) {
            console.error("Delete error:", error);
            alert(error.message);

            // Agar delete fail ho jaye to button wapas normal
            button.textContent = "Delete";
            button.disabled = false;
        }
    }

});

targetQuestions.addEventListener("change", function () {

    if (Number(targetQuestions.value) < 1) {
        alert("Target must be at least 1.");
        targetQuestions.value = "";
        return;
    }

    localStorage.setItem("targetQuestions", targetQuestions.value);

    // Dashboard instantly update
    updateDashboard();
});

const authButton = document.getElementById("auth-btn");

if (authButton) {
    authButton.addEventListener("click", function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}
// ==================== AUTH CHECK ====================

if (!localStorage.getItem("token")) {
    window.location.replace("login.html");
}

// ==================== NOTES ====================

// ==================== NOTES ====================

const saveNoteButton = document.getElementById("save-note");
const noteTitle = document.getElementById("note-title");
const noteCategory = document.getElementById("note-category");
const noteContent = document.getElementById("note-content");
const notesList = document.getElementById("notes-list");
const searchNotes = document.getElementById("search-notes");

let notes = JSON.parse(localStorage.getItem("notes")) || [];

function displayNotes(notesToDisplay = notes) {

    notesList.innerHTML = "";

    if (notesToDisplay.length === 0) {
        notesList.innerHTML = "<p>No notes found.</p>";
        return;
    }

    notesToDisplay.forEach(function (note) {

        const originalIndex = notes.indexOf(note);

        const noteCard = document.createElement("div");

        noteCard.className = "note-card";

        noteCard.innerHTML = `
            <h3>${note.title}</h3>
            <span>${note.category}</span>
            <p>${note.content}</p>

            <div>
                <button onclick="editNote(${originalIndex})">Edit</button>
                <button onclick="deleteNote(${originalIndex})">Delete</button>
            </div>
        `;

        notesList.appendChild(noteCard);
    });
}

if (saveNoteButton) {

    saveNoteButton.addEventListener("click", function () {

        const title = noteTitle.value.trim();
        const category = noteCategory.value;
        const content = noteContent.value.trim();

        if (!title || !content) {
            alert("Please enter note title and content.");
            return;
        }

        const newNote = {
            title: title,
            category: category,
            content: content
        };

        notes.push(newNote);

        localStorage.setItem("notes", JSON.stringify(notes));

        noteTitle.value = "";
        noteContent.value = "";

        displayNotes();

        alert("Note saved successfully!");
    });
}

if (searchNotes) {

    searchNotes.addEventListener("input", function () {

        const searchText = searchNotes.value.toLowerCase().trim();

        const filteredNotes = notes.filter(function (note) {

            return (
                note.title.toLowerCase().includes(searchText) ||
                note.content.toLowerCase().includes(searchText) ||
                note.category.toLowerCase().includes(searchText)
            );

        });

        displayNotes(filteredNotes);
    });
}

function editNote(index) {

    const note = notes[index];

    noteTitle.value = note.title;
    noteCategory.value = note.category;
    noteContent.value = note.content;

    notes.splice(index, 1);

    localStorage.setItem("notes", JSON.stringify(notes));

    displayNotes();

    noteTitle.focus();
}

function deleteNote(index) {

    notes.splice(index, 1);

    localStorage.setItem("notes", JSON.stringify(notes));

    displayNotes();
}

displayNotes();


// ==================== INTERVIEW ====================

// ==================== INTERVIEW ====================

const interviewList = document.getElementById("interview-list");
const searchInterview = document.getElementById("search-interview");
const interviewCategory = document.getElementById("interview-category");

const interviewQuestions = [

    {
        question: "What is JavaScript?",
        answer: "JavaScript is a high-level programming language mainly used to make websites interactive and dynamic. It can run inside web browsers and can also be used on the server using Node.js. JavaScript is commonly used for handling user interactions, modifying web pages, validating forms, and communicating with backend APIs. In my project, I use JavaScript for the frontend logic and API communication.",
        category: "JavaScript"
    },

    {
        question: "What is the difference between let, const and var?",
        answer: "var, let and const are used to declare variables in JavaScript. var is function-scoped, while let and const are block-scoped. A variable declared with let can be reassigned, whereas a const variable cannot be reassigned after initialization. In modern JavaScript, let and const are generally preferred over var because they provide better scope control.",
        category: "JavaScript"
    },

    {
        question: "What are the data types in JavaScript?",
        answer: "JavaScript has several primitive data types including string, number, boolean, undefined, null, bigint and symbol. It also has the object type, which is used for more complex data structures such as objects, arrays and functions. Understanding data types is important because JavaScript is dynamically typed, meaning the type of a variable can change during execution.",
        category: "JavaScript"
    },

    {
        question: "What is the difference between == and ===?",
        answer: "The == operator compares two values after performing type conversion if necessary. The === operator compares both the value and the data type without performing type conversion. For example, 5 == '5' returns true, but 5 === '5' returns false because one is a number and the other is a string. In most cases, === is preferred because it provides stricter comparison.",
        category: "JavaScript"
    },

    {
        question: "What is a function in JavaScript?",
        answer: "A function is a reusable block of code designed to perform a specific task. Functions can accept input through parameters and can return a result using the return statement. They help make code more organized, reusable and easier to maintain. JavaScript supports regular functions, arrow functions and several other ways of defining functions.",
        category: "JavaScript"
    },

    {
        question: "What is an arrow function?",
        answer: "An arrow function is a shorter syntax for writing functions in JavaScript. It was introduced in ES6 and is commonly used for callbacks and short functions. Arrow functions also handle the this keyword differently from regular functions because they inherit this from their surrounding scope. For example, const add = (a, b) => a + b is an arrow function.",
        category: "JavaScript"
    },

    {
        question: "What is an array?",
        answer: "An array is a data structure used to store multiple values in a single variable. Each element can be accessed using an index, starting from zero. JavaScript provides many built-in array methods such as push(), pop(), map(), filter(), find() and reduce(). Arrays are frequently used when working with collections of data.",
        category: "JavaScript"
    },

    {
        question: "What is an object in JavaScript?",
        answer: "An object is a data structure that stores information in the form of key-value pairs. It can contain properties and methods that represent data and functionality. Objects are widely used in JavaScript because they allow related information to be grouped together. For example, a user object can contain properties such as name, email and age.",
        category: "JavaScript"
    },

    {
        question: "What is the DOM?",
        answer: "DOM stands for Document Object Model. It represents an HTML document as a tree-like structure of objects that JavaScript can access and modify. Using the DOM, JavaScript can change text, styles, attributes and elements on a webpage. In frontend development, the DOM is commonly used to create dynamic and interactive user interfaces.",
        category: "JavaScript"
    },

    {
        question: "What is event handling in JavaScript?",
        answer: "Event handling is the process of responding to actions performed by the user or browser. Common events include click, submit, input, mouseover and keydown. JavaScript can listen for these events and execute a specific function when an event occurs. In my project, event handling is used for buttons, forms, filters and theme switching.",
        category: "JavaScript"
    },

    {
        question: "What is addEventListener()?",
        answer: "addEventListener() is a JavaScript method used to attach an event handler to an HTML element. It allows us to execute a function when a particular event occurs, such as a click or input event. It is preferred over inline event handlers because it keeps HTML and JavaScript logic more separate. In my project, I use it for buttons, forms, search fields and theme controls.",
        category: "JavaScript"
    },

    {
        question: "What is fetch() in JavaScript?",
        answer: "fetch() is a built-in JavaScript function used to make HTTP requests to a server or API. It returns a Promise that can be handled using then() or async/await. In my Placement Prep Portal, I use fetch() to communicate between the frontend and the Node.js/Express backend for operations such as creating, retrieving, updating and deleting progress data.",
        category: "JavaScript"
    },

    {
        question: "What is a Promise?",
        answer: "A Promise is an object that represents the eventual completion or failure of an asynchronous operation. It can have three states: pending, fulfilled or rejected. Promises help JavaScript handle operations such as API requests without blocking the rest of the program. They can be handled using then(), catch() and finally().",
        category: "JavaScript"
    },

    {
        question: "What is async/await?",
        answer: "async/await is a modern way of working with Promises in JavaScript. The async keyword makes a function return a Promise, while await pauses the execution of that function until the Promise is resolved. It makes asynchronous code easier to read and understand. In my project, async/await is used while communicating with backend APIs using fetch().",
        category: "JavaScript"
    },

    {
        question: "What is try...catch?",
        answer: "try...catch is used to handle errors in JavaScript. Code that may produce an error is placed inside the try block, while the catch block handles the error if one occurs. This prevents unexpected errors from breaking the entire application. In my project, try...catch is useful when making API requests and processing server responses.",
        category: "JavaScript"
    },

    {
        question: "What is localStorage?",
        answer: "localStorage is a browser storage mechanism that allows websites to store data as key-value pairs. The stored data remains available even after the browser is refreshed or closed until it is manually removed. In my project, I use localStorage for features such as theme preference, notes, target questions and resume data. Data is generally stored as strings, so JSON.stringify() and JSON.parse() are often used with objects.",
        category: "JavaScript"
    },

    {
        question: "What is JSON?",
        answer: "JSON stands for JavaScript Object Notation. It is a lightweight text-based format commonly used to exchange data between frontend applications and backend servers. JSON represents data using objects, arrays, key-value pairs and primitive values. In my project, JSON is used when sending data to and receiving data from the backend API.",
        category: "JavaScript"
    },

    {
        question: "What is scope in JavaScript?",
        answer: "Scope determines where a variable can be accessed within a JavaScript program. The main types include global scope, function scope and block scope. Variables declared with let and const have block scope, while var has function scope. Understanding scope helps prevent unwanted access to variables and makes code easier to maintain.",
        category: "JavaScript"
    },

    {
        question: "What is a callback function?",
        answer: "A callback function is a function that is passed as an argument to another function and is executed later. Callbacks are commonly used for handling events, asynchronous operations and array methods. For example, a function passed to forEach() or addEventListener() acts as a callback. They allow JavaScript to execute specific logic when an operation is completed.",
        category: "JavaScript"
    },

    {
        question: "What is the difference between synchronous and asynchronous JavaScript?",
        answer: "Synchronous JavaScript executes operations one after another in sequence, meaning the next operation generally waits for the previous one to complete. Asynchronous JavaScript allows certain operations, such as API requests or timers, to continue without blocking other code. JavaScript uses mechanisms such as Promises, async/await and callbacks to handle asynchronous operations efficiently. This is especially important for web applications that communicate with servers.",
        category: "JavaScript"
    },

    {
    question: "What is Node.js?",
    answer: "Node.js is a JavaScript runtime environment that allows JavaScript to run outside the browser. It is built on Chrome's V8 JavaScript engine and is commonly used for server-side development. Node.js is useful for building APIs, web servers and real-time applications. In my Placement Prep Portal, I use Node.js to run the backend server.",
    category: "Node.js"
},

{
    question: "Why is Node.js used for backend development?",
    answer: "Node.js allows developers to use JavaScript for both frontend and backend development. It is efficient for handling multiple I/O operations because of its asynchronous and event-driven architecture. It also has a large ecosystem of packages through npm. These features make Node.js popular for building APIs and web applications.",
    category: "Node.js"
},

{
    question: "What is npm?",
    answer: "npm stands for Node Package Manager. It is the default package manager for Node.js and is used to install, manage and update JavaScript packages. It also helps manage project dependencies through the package.json file. In my project, I use npm to install packages such as Express, Mongoose, bcrypt and jsonwebtoken.",
    category: "Node.js"
},

{
    question: "What is package.json?",
    answer: "package.json is a configuration file used in Node.js projects to store information about the project. It contains details such as the project name, version, scripts and dependencies. It allows other developers to understand and install the required packages for the project. npm uses this file to manage project dependencies.",
    category: "Node.js"
},

{
    question: "What is the difference between Node.js and JavaScript?",
    answer: "JavaScript is a programming language, while Node.js is a runtime environment that allows JavaScript to run outside the browser. JavaScript is commonly used in browsers for frontend functionality, whereas Node.js can execute JavaScript on the server. Node.js provides additional capabilities such as file system access, networking and server-side development.",
    category: "Node.js"
},

{
    question: "What is the V8 engine?",
    answer: "V8 is an open-source JavaScript engine developed by Google. It is used by Google Chrome and also powers Node.js. V8 converts JavaScript code into machine code so that it can be executed efficiently. Node.js uses V8 to run JavaScript outside the browser.",
    category: "Node.js"
},

{
    question: "What is the event-driven architecture of Node.js?",
    answer: "Node.js uses an event-driven architecture where operations are handled through events and callbacks. Instead of waiting for every operation to finish, Node.js can continue processing other requests while asynchronous operations are running. When an operation completes, its callback or handler is executed. This architecture helps Node.js efficiently handle many concurrent requests.",
    category: "Node.js"
},

{
    question: "What is the event loop in Node.js?",
    answer: "The event loop is a mechanism that allows Node.js to handle asynchronous operations without blocking the main execution thread. It continuously checks for completed asynchronous operations and executes their callbacks when appropriate. This allows Node.js to handle multiple tasks efficiently even though JavaScript execution itself is single-threaded.",
    category: "Node.js"
},

{
    question: "What is Express.js in Node.js?",
    answer: "Express.js is a lightweight web framework built on top of Node.js. It provides features for creating web servers, routes and REST APIs more easily. Express also supports middleware for handling requests and responses. In my project, I use Express to create the backend API for the Placement Prep Portal.",
    category: "Node.js"
},

{
    question: "What is middleware in Node.js?",
    answer: "Middleware is a function that runs between receiving a request and sending a response. It can be used for tasks such as authentication, logging, validation, parsing request data and error handling. Middleware can modify the request or response objects or pass control to the next function. In my project, authentication middleware checks the JWT before protected API routes are accessed.",
    category: "Node.js"
},

{
    question: "What is a REST API?",
    answer: "A REST API is an interface that allows applications to communicate using HTTP methods and resources. Common HTTP methods include GET for retrieving data, POST for creating data, PUT for updating data and DELETE for removing data. In my Placement Prep Portal, the frontend communicates with the Node.js and Express backend through REST API endpoints.",
    category: "Node.js"
},

{
    question: "What are HTTP methods commonly used in Node.js APIs?",
    answer: "The most commonly used HTTP methods are GET, POST, PUT, PATCH and DELETE. GET is generally used to retrieve data, POST to create new data, PUT or PATCH to update existing data, and DELETE to remove data. These methods help structure REST APIs in a predictable way. My project uses GET, POST, PUT and DELETE for the progress tracker.",
    category: "Node.js"
},

{
    question: "What is process.env in Node.js?",
    answer: "process.env provides access to environment variables available to a Node.js application. Environment variables are commonly used to store configuration values and sensitive information such as database connection strings, API keys and secret keys. This prevents sensitive values from being hardcoded directly into the source code. In my project, the MongoDB connection string is stored in an environment file.",
    category: "Node.js"
},

{
    question: "What is CORS?",
    answer: "CORS stands for Cross-Origin Resource Sharing. It is a browser security mechanism that controls whether a frontend from one origin can access resources from another origin. When frontend and backend run on different ports or domains, CORS configuration may be required. In my project, Express uses the CORS middleware so the frontend can communicate with the backend.",
    category: "Node.js"
},

{
    question: "How does Node.js handle multiple requests?",
    answer: "Node.js uses an event-driven, non-blocking I/O model to handle multiple requests efficiently. Instead of creating a separate thread for every request, it can continue processing other tasks while waiting for I/O operations such as database or network requests. When an operation completes, its callback or Promise continuation is processed. This makes Node.js suitable for applications that handle many concurrent I/O operations.",
    category: "Node.js"
},

{
    question: "What is Express.js?",
    answer: "Express.js is a lightweight and flexible web framework built on top of Node.js. It makes it easier to create web servers, APIs and routes. Express provides features such as routing, middleware and request-response handling. In my Placement Prep Portal, I use Express.js to build the backend REST APIs.",
    category: "Express.js"
},

{
    question: "Why is Express.js used with Node.js?",
    answer: "Node.js provides the runtime environment, while Express.js provides useful tools for building web applications and APIs. Express simplifies tasks such as routing, middleware handling and processing HTTP requests. Without a framework, many of these tasks would require more manual code. This makes Express.js a popular choice for Node.js backend development.",
    category: "Express.js"
},

{
    question: "What is routing in Express.js?",
    answer: "Routing determines how an application responds to requests made to different URLs and HTTP methods. Express allows us to create routes such as GET, POST, PUT and DELETE. Each route can execute a specific function when a matching request is received. In my project, routes such as /api/progress handle progress-related operations.",
    category: "Express.js"
},

{
    question: "What is middleware in Express.js?",
    answer: "Middleware is a function that executes during the request-response cycle. It can access the request and response objects and can either modify them or pass control to the next middleware. Middleware is commonly used for authentication, logging, validation and error handling. In my project, authentication middleware verifies the JWT before protected routes are accessed.",
    category: "Express.js"
},

{
    question: "What is express.json()?",
    answer: "express.json() is built-in middleware in Express.js that parses incoming requests containing JSON data. After parsing, the JSON data becomes available through req.body. This is useful when a frontend sends form or application data to a backend API. In my project, I use app.use(express.json()) so the backend can process JSON request bodies.",
    category: "Express.js"
},

{
    question: "What are req and res in Express.js?",
    answer: "req stands for request and contains information sent by the client to the server, such as parameters, body, headers and query data. res stands for response and is used by the server to send data back to the client. For example, res.json() can send a JSON response to the frontend. These objects are commonly used inside Express route handlers.",
    category: "Express.js"
},

{
    question: "What is req.body in Express.js?",
    answer: "req.body contains data sent by the client in the body of an HTTP request. It is commonly used with POST and PUT requests when sending data to the server. Express needs body-parsing middleware such as express.json() to read JSON request data. In my project, req.body is used to receive progress information from the frontend.",
    category: "Express.js"
},

{
    question: "What is res.json() in Express.js?",
    answer: "res.json() is an Express.js method used to send a JSON response to the client. It automatically converts a JavaScript object or array into JSON format and sends it as the HTTP response. It is commonly used when building REST APIs. In my project, the backend uses JSON responses to communicate progress and authentication results to the frontend.",
    category: "Express.js"
},

{
    question: "How do you handle errors in Express.js?",
    answer: "Errors in Express.js can be handled using conditional checks, try-catch blocks and error-handling middleware. Proper error handling allows the server to return meaningful status codes and messages instead of crashing. For example, validation errors can return a 400 status code, while server errors can return a 500 status code. In my project, API errors are returned with appropriate messages so the frontend can handle them.",
    category: "Express.js"
},

{
    question: "What is CORS middleware in Express.js?",
    answer: "CORS middleware allows an Express.js server to accept requests from permitted origins. It is especially important when the frontend and backend are running on different origins, such as different ports during development. Without proper CORS configuration, browsers may block frontend requests to the backend. In my project, I use the CORS package with Express so the frontend can communicate with the backend server.",
    category: "Express.js"
},

{
    question: "What is MongoDB?",
    answer: "MongoDB is a NoSQL database that stores data in flexible, JSON-like documents instead of traditional rows and tables. It is designed to handle large amounts of data and allows flexible document structures. MongoDB is commonly used with Node.js applications. In my Placement Prep Portal, MongoDB stores user accounts and DSA progress data.",
    category: "MongoDB"
},

{
    question: "What is a NoSQL database?",
    answer: "NoSQL databases are databases that do not necessarily use the traditional table and row structure used by relational databases. They can store data in formats such as documents, key-value pairs or graphs. MongoDB is a document-based NoSQL database. NoSQL databases are useful when applications need flexible schemas and scalable data storage.",
    category: "MongoDB"
},

{
    question: "What is a document in MongoDB?",
    answer: "A document is the basic unit of data storage in MongoDB. It is similar to a JSON object and contains fields and values. Documents are stored inside collections. For example, a progress document in my project can contain questions, topic, difficulty, platform, date and userId.",
    category: "MongoDB"
},

{
    question: "What is a collection in MongoDB?",
    answer: "A collection is a group of MongoDB documents. It is similar to a table in a relational database, but the documents inside a collection can have flexible structures. Collections are used to organize related data. In my project, collections are used for storing users and progress records.",
    category: "MongoDB"
},

{
    question: "What is the difference between SQL and MongoDB?",
    answer: "SQL databases generally store structured data in tables with rows and columns, while MongoDB stores data as flexible documents inside collections. SQL databases commonly use fixed schemas and relationships, whereas MongoDB provides a more flexible document structure. MongoDB is useful for applications where data structures may change frequently.",
    category: "MongoDB"
},

{
    question: "What is Mongoose?",
    answer: "Mongoose is an Object Data Modeling library for MongoDB and Node.js. It allows developers to define schemas and models and provides features such as validation and query methods. It makes working with MongoDB easier from a Node.js application. In my project, I use Mongoose to create User and Progress models.",
    category: "MongoDB"
},

{
    question: "What is a Mongoose schema?",
    answer: "A Mongoose schema defines the structure and rules for documents stored in a MongoDB collection. It specifies fields, data types, required values and validation rules. Schemas help maintain consistency in application data. In my project, the Progress schema defines fields such as questions, topic, difficulty, platform, date and userId.",
    category: "MongoDB"
},

{
    question: "What is a Mongoose model?",
    answer: "A Mongoose model is created from a schema and provides an interface for interacting with MongoDB documents. It allows developers to perform operations such as creating, finding, updating and deleting documents. Models are commonly used inside backend route handlers. In my project, the Progress model is used for CRUD operations on progress data.",
    category: "MongoDB"
},

{
    question: "What is MongoDB Atlas?",
    answer: "MongoDB Atlas is a cloud-based database service provided by MongoDB. It allows developers to create, manage and access MongoDB databases through the cloud. It removes the need to manually manage a local MongoDB server. In my project, MongoDB Atlas is used to store the application's data remotely.",
    category: "MongoDB"
},

{
    question: "What is ObjectId in MongoDB?",
    answer: "ObjectId is the default identifier type commonly used for MongoDB documents. It provides a unique value that can be used to identify a particular document. MongoDB automatically generates an _id field for documents when one is not provided. In my project, the document ID is used when updating or deleting a specific progress record.",
    category: "MongoDB"
},

{
    question: "What is CRUD in MongoDB?",
    answer: "CRUD stands for Create, Read, Update and Delete. These are the four basic operations performed on data. In a MongoDB application, these operations are commonly implemented through methods such as create(), find(), findByIdAndUpdate() and findByIdAndDelete(). My Placement Prep Portal implements CRUD operations for DSA progress records.",
    category: "MongoDB"
},

{
    question: "How do you retrieve data from MongoDB using Mongoose?",
    answer: "Mongoose provides methods such as find(), findOne() and findById() to retrieve documents from MongoDB. The method can also accept conditions to retrieve specific records. For example, find({ userId: someId }) can retrieve records belonging to a particular user. In my project, authenticated users can retrieve their own progress records using a userId filter.",
    category: "MongoDB"
},

{
    question: "What is validation in Mongoose?",
    answer: "Validation in Mongoose is used to ensure that data follows specific rules before it is saved to MongoDB. A schema can define fields as required and specify conditions such as minimum or maximum values. For example, my Progress schema validates the questions field and restricts difficulty to Easy, Medium or Hard. This helps prevent invalid data from being stored.",
    category: "MongoDB"
},

{
    question: "What is the difference between find() and findOne() in Mongoose?",
    answer: "find() returns all documents that match a given condition, usually as an array. findOne() returns the first document that matches the condition. The choice depends on whether the application expects multiple records or a single record. In backend applications, find() is useful for listing data while findOne() is useful when searching for one specific document.",
    category: "MongoDB"
},

{
    question: "How does Node.js connect to MongoDB in your project?",
    answer: "In my project, Node.js connects to MongoDB using Mongoose. The MongoDB connection string is stored in an environment variable instead of being hardcoded in the source code. The backend uses mongoose.connect(process.env.MONGO_URI) to establish the connection. After a successful connection, the Express server can perform database operations through Mongoose models.",
    category: "MongoDB"
},  
    
// ==================== DBMS - 15 QUESTIONS ====================

{
    question: "What is DBMS?",
    answer: "DBMS stands for Database Management System. It is software used to create, store, organize, retrieve and manage data in a database. It provides features such as data security, consistency, backup and controlled access. Examples include MySQL, PostgreSQL, Oracle and MongoDB.",
    category: "DBMS"
},

{
    question: "What is a database?",
    answer: "A database is an organized collection of data that can be stored and accessed electronically. It allows applications to efficiently store, retrieve and manage information. Databases can be relational or non-relational. In my project, MongoDB is used to store user and progress data.",
    category: "DBMS"
},

{
    question: "What is a primary key?",
    answer: "A primary key is a column or set of columns that uniquely identifies each record in a table. It cannot contain duplicate values and generally cannot contain NULL values. A table can have only one primary key. Primary keys are important for uniquely identifying records.",
    category: "DBMS"
},

{
    question: "What is a foreign key?",
    answer: "A foreign key is a column that creates a relationship between two tables by referring to the primary key of another table. It helps maintain relationships and referential integrity between tables. For example, a userId in a progress table can refer to a user record. This allows related data to be connected.",
    category: "DBMS"
},

{
    question: "What is normalization?",
    answer: "Normalization is the process of organizing data to reduce redundancy and improve data consistency. It usually involves dividing large tables into smaller related tables. Common normal forms include 1NF, 2NF and 3NF. The goal is to avoid unnecessary duplication of data.",
    category: "DBMS"
},

{
    question: "What is denormalization?",
    answer: "Denormalization is the process of intentionally adding redundant data to improve read performance. It can reduce the number of joins or database operations required to retrieve information. However, it can increase storage requirements and make data updates more complex. The choice depends on application requirements.",
    category: "DBMS"
},

{
    question: "What is a SQL query?",
    answer: "SQL stands for Structured Query Language and is used to communicate with relational databases. SQL queries can be used to create, retrieve, update and delete data. Common commands include SELECT, INSERT, UPDATE and DELETE. SQL is widely used in relational database systems.",
    category: "DBMS"
},

{
    question: "What is a JOIN in SQL?",
    answer: "A JOIN is used to combine data from two or more tables based on a related column. Common types include INNER JOIN, LEFT JOIN, RIGHT JOIN and FULL JOIN. For example, a JOIN can combine user information with their progress records. JOINs are important when related data is stored in separate tables.",
    category: "DBMS"
},

{
    question: "What is an INNER JOIN?",
    answer: "An INNER JOIN returns only the records that have matching values in both tables. If a record does not have a matching record in the other table, it is not included in the result. It is commonly used when only related records are required. For example, it can retrieve users who have corresponding progress records.",
    category: "DBMS"
},

{
    question: "What is an index in a database?",
    answer: "An index is a data structure that helps a database find records faster. Instead of scanning every record, the database can use the index to locate required data more efficiently. Indexes can improve read performance but may require additional storage and can make writes slightly more expensive. They are commonly created on frequently searched fields.",
    category: "DBMS"
},

{
    question: "What are ACID properties?",
    answer: "ACID stands for Atomicity, Consistency, Isolation and Durability. Atomicity means a transaction is completed fully or not at all. Consistency keeps the database in a valid state, Isolation controls how transactions interact, and Durability ensures committed data is preserved. These properties help maintain reliable database transactions.",
    category: "DBMS"
},

{
    question: "What is a transaction?",
    answer: "A transaction is a sequence of database operations treated as a single logical unit of work. It should either complete successfully or be rolled back if an error occurs. Transactions are important when multiple related operations must remain consistent. Banking transactions are a common example.",
    category: "DBMS"
},

{
    question: "What is the difference between DELETE, DROP and TRUNCATE?",
    answer: "DELETE removes selected rows from a table and can use a WHERE condition. TRUNCATE removes all rows from a table while keeping the table structure. DROP removes the entire table including its structure. These commands have different purposes and should be used carefully.",
    category: "DBMS"
},

{
    question: "What is data redundancy?",
    answer: "Data redundancy means storing the same piece of information unnecessarily in multiple places. It can increase storage usage and may cause inconsistency when one copy is updated but another is not. Database normalization is commonly used to reduce unnecessary redundancy. Proper database design helps maintain consistent data.",
    category: "DBMS"
},

{
    question: "What is the difference between DBMS and RDBMS?",
    answer: "DBMS is a general term for software used to manage databases, while RDBMS specifically manages relational databases using tables and relationships. RDBMS systems usually support concepts such as primary keys, foreign keys and SQL. MySQL and PostgreSQL are examples of RDBMS. MongoDB, on the other hand, is a NoSQL document database.",
    category: "DBMS"
},


// ==================== OPERATING SYSTEM - 10 QUESTIONS ====================

{
    question: "What is an Operating System?",
    answer: "An Operating System is system software that manages computer hardware and provides services for applications. It manages resources such as CPU, memory, storage and input/output devices. It also provides an interface between users, applications and hardware. Examples include Windows, Linux and macOS.",
    category: "OS"
},

{
    question: "What is a process?",
    answer: "A process is a program that is currently being executed by the operating system. It has its own memory space and resources. The operating system manages processes and allocates CPU time to them. For example, running a browser creates one or more processes.",
    category: "OS"
},

{
    question: "What is a thread?",
    answer: "A thread is the smallest unit of execution within a process. Multiple threads can exist inside the same process and share its resources. Threads allow applications to perform multiple tasks concurrently. Using multiple threads can improve responsiveness and performance for suitable workloads.",
    category: "OS"
},

{
    question: "What is the difference between a process and a thread?",
    answer: "A process is an independent program execution environment with its own memory space, while threads exist inside a process and share its resources. Creating processes generally requires more resources than creating threads. Threads are useful when tasks need to share data efficiently. A process can contain multiple threads.",
    category: "OS"
},

{
    question: "What is multitasking?",
    answer: "Multitasking is the ability of an operating system to execute multiple tasks seemingly at the same time. The CPU switches between processes or threads very quickly. This allows users to run applications such as a browser, editor and music player simultaneously. Modern operating systems use scheduling techniques to manage these tasks.",
    category: "OS"
},

{
    question: "What is CPU scheduling?",
    answer: "CPU scheduling is the process of deciding which process should get CPU time next. The operating system uses scheduling algorithms to manage competing processes. Common algorithms include FCFS, SJF, Round Robin and Priority Scheduling. The goal is to use CPU resources efficiently while maintaining good response time.",
    category: "OS"
},

{
    question: "What is deadlock?",
    answer: "Deadlock is a situation where two or more processes are waiting for resources held by each other and none of them can continue. It can cause processes to remain blocked indefinitely. Deadlock generally involves conditions such as mutual exclusion, hold and wait, no preemption and circular wait. Operating systems use different techniques to prevent or handle deadlocks.",
    category: "OS"
},

{
    question: "What is virtual memory?",
    answer: "Virtual memory is a memory management technique that allows the operating system to use part of secondary storage as an extension of RAM. It allows programs to run even when physical memory is limited. The operating system moves data between RAM and storage when required. However, storage is slower than RAM, so excessive virtual memory usage can reduce performance.",
    category: "OS"
},

{
    question: "What is paging?",
    answer: "Paging is a memory management technique in which physical memory is divided into fixed-size blocks called frames and logical memory is divided into pages. Pages can be loaded into available frames as required. Paging helps avoid external fragmentation and supports virtual memory. The operating system maintains page tables to map pages to frames.",
    category: "OS"
},

{
    question: "What is context switching?",
    answer: "Context switching occurs when the operating system switches the CPU from one process or thread to another. The current execution state is saved and the state of another process is loaded. This allows multiple processes to share CPU time. However, context switching introduces some overhead because saving and loading states takes time.",
    category: "OS"
},


// ==================== COMPUTER NETWORKS - 10 QUESTIONS ====================

{
    question: "What is a computer network?",
    answer: "A computer network is a collection of interconnected devices that communicate and share data and resources. Devices can communicate using wired or wireless connections and networking protocols. Networks are used for applications such as web browsing, file sharing and online communication. The Internet is the largest example of a computer network.",
    category: "Computer Networks"
},

{
    question: "What is an IP address?",
    answer: "An IP address is a logical address used to identify a device on a network. It allows devices to communicate with each other and helps determine where data should be delivered. IPv4 uses 32-bit addresses while IPv6 uses 128-bit addresses. For example, 192.168.1.1 is an example of an IPv4 address.",
    category: "Computer Networks"
},

{
    question: "What is the difference between IPv4 and IPv6?",
    answer: "IPv4 uses 32-bit addresses and supports a limited number of unique addresses. IPv6 uses 128-bit addresses and provides a much larger address space. IPv6 also includes improvements in areas such as address configuration and network design. IPv6 was introduced partly because the available IPv4 address space is limited.",
    category: "Computer Networks"
},

{
    question: "What is DNS?",
    answer: "DNS stands for Domain Name System. It translates human-readable domain names into IP addresses that computers can use to locate servers. For example, a browser can use DNS to find the IP address associated with a website domain. DNS makes it easier for users to access websites without remembering numerical IP addresses.",
    category: "Computer Networks"
},

{
    question: "What is HTTP?",
    answer: "HTTP stands for HyperText Transfer Protocol. It is an application-layer protocol used for communication between clients and web servers. It defines methods such as GET, POST, PUT and DELETE along with status codes and headers. Web browsers and backend APIs commonly communicate using HTTP.",
    category: "Computer Networks"
},

{
    question: "What is HTTPS?",
    answer: "HTTPS stands for HyperText Transfer Protocol Secure. It is HTTP communication protected using encryption through TLS. HTTPS helps protect data from being read or modified by unauthorized parties during transmission. It is commonly used for websites, APIs and applications that handle sensitive information.",
    category: "Computer Networks"
},

{
    question: "What is TCP?",
    answer: "TCP stands for Transmission Control Protocol. It is a connection-oriented protocol that provides reliable and ordered delivery of data. TCP uses mechanisms such as acknowledgements and retransmission to handle lost packets. It is commonly used for applications such as web communication and file transfers.",
    category: "Computer Networks"
},

{
    question: "What is UDP?",
    answer: "UDP stands for User Datagram Protocol. It is a connectionless protocol that sends data without guaranteeing delivery or ordering. Because it has lower overhead than TCP, it can be useful where speed is more important than guaranteed delivery. UDP is commonly used in applications such as streaming, gaming and DNS.",
    category: "Computer Networks"
},

{
    question: "What is a port number?",
    answer: "A port number identifies a specific service or application running on a device. It allows multiple network services to operate on the same IP address. For example, HTTP commonly uses port 80 and HTTPS commonly uses port 443. In my project, the Express backend runs locally on port 5000.",
    category: "Computer Networks"
},

{
    question: "What is the difference between client and server?",
    answer: "A client is a device or application that requests a service, while a server provides the requested service. For example, a web browser acts as a client and sends requests to a web server. In my project, the frontend acts as the client and communicates with the Node.js and Express backend server through API requests.",
    category: "Computer Networks"
},


// ==================== OOP - 5 QUESTIONS ====================

{
    question: "What is OOP?",
    answer: "OOP stands for Object-Oriented Programming. It is a programming approach that organizes code around objects containing data and behavior. The main concepts of OOP are encapsulation, inheritance, polymorphism and abstraction. OOP helps make large programs more organized, reusable and maintainable.",
    category: "OOP"
},

{
    question: "What is encapsulation?",
    answer: "Encapsulation means combining data and the methods that operate on that data into a single unit such as a class. It also helps control access to internal data using access modifiers. This prevents unnecessary direct access to internal implementation details. Encapsulation improves code organization and security.",
    category: "OOP"
},

{
    question: "What is inheritance?",
    answer: "Inheritance allows one class to acquire properties and methods from another class. The existing class is generally called the parent or base class, while the new class is called the child or derived class. It promotes code reuse and allows related classes to share common functionality. Inheritance is an important concept in object-oriented programming.",
    category: "OOP"
},

{
    question: "What is polymorphism?",
    answer: "Polymorphism means the ability of the same interface or method name to behave differently in different situations. It allows objects of different classes to respond differently to the same operation. Common forms include method overloading and method overriding, depending on the programming language. Polymorphism improves flexibility and extensibility.",
    category: "OOP"
},

{
    question: "What is abstraction?",
    answer: "Abstraction means hiding unnecessary implementation details and exposing only the important functionality to the user. It helps reduce complexity and allows developers to focus on what an object does rather than how it does it. Abstract classes and interfaces are common ways to implement abstraction in object-oriented languages.",
    category: "OOP"
},


// ==================== HR - 10 QUESTIONS ====================

{
    question: "Tell me about yourself.",
    answer: "I am a B.Tech Computer Science student with a strong interest in software development. I have been strengthening my DSA, core CS fundamentals and full-stack development skills. I have also built projects using technologies such as JavaScript, Node.js, Express and MongoDB. Currently, I am focused on becoming interview-ready for software development roles.",
    category: "HR"
},

{
    question: "Why should we hire you?",
    answer: "I believe I can contribute through my technical skills, consistency and willingness to learn. I have been actively working on DSA, development projects and core computer science subjects. I also focus on understanding concepts rather than only memorizing them. I would bring a learning mindset and a strong commitment to improving my skills.",
    category: "HR"
},

{
    question: "What are your strengths?",
    answer: "My strengths are consistency, discipline and willingness to learn. When I start working on a task, I try to understand it properly and complete it carefully. I also enjoy solving technical problems and improving my skills through practical projects.",
    category: "HR"
},

{
    question: "What is your weakness?",
    answer: "One area I am working on is spending too much time trying to perfect my work. Sometimes I focus on small details more than necessary. I am improving this by setting time limits and prioritizing the most important requirements first. This helps me maintain both quality and productivity.",
    category: "HR"
},

{
    question: "Why do you want to become a software developer?",
    answer: "I enjoy solving problems using technology and building applications that are useful to people. Software development also gives me opportunities to continuously learn new technologies and improve my problem-solving skills. My interest in programming and web development motivated me to pursue software development as a career.",
    category: "HR"
},

{
    question: "Why do you want to join our company?",
    answer: "I want to join a company where I can work on real-world software projects and learn from experienced developers. I am interested in environments that provide opportunities to improve my technical and problem-solving skills. I would also like to contribute to the team while continuously developing professionally.",
    category: "HR"
},

{
    question: "Where do you see yourself in five years?",
    answer: "In five years, I want to be a strong software developer with solid expertise in problem solving, backend development and system design. I would like to take ownership of meaningful projects and contribute to the success of my team. I also want to keep learning and gradually take on greater technical responsibilities.",
    category: "HR"
},

{
    question: "How do you handle pressure or deadlines?",
    answer: "I handle pressure by breaking the task into smaller and manageable parts and prioritizing the most important work first. I create a realistic plan and focus on completing tasks step by step. If I face a problem, I try to identify it early and work on a solution instead of delaying it. This approach helps me remain organized during deadlines.",
    category: "HR"
},

{
    question: "How do you handle failure?",
    answer: "I try to treat failure as feedback rather than simply as a negative result. I first understand what went wrong, identify the areas I need to improve and then work on them. For example, if I make a mistake while coding, I debug the issue and understand the underlying concept so that I can avoid repeating it.",
    category: "HR"
},

{
    question: "Do you prefer working individually or in a team?",
    answer: "I am comfortable working both individually and in a team. Individual work helps me take ownership of my responsibilities, while teamwork allows me to learn from different ideas and approaches. In a team, I believe clear communication and responsibility are important for completing a project successfully.",
    category: "HR"
}

];

function displayInterviewQuestions(questionsToDisplay = interviewQuestions) {

    interviewList.innerHTML = "";

    if (questionsToDisplay.length === 0) {
        interviewList.innerHTML = "<p>No interview questions found.</p>";
        return;
    }

    questionsToDisplay.forEach(function (item) {

        const questionCard = document.createElement("div");

        questionCard.className = "interview-card";

        questionCard.innerHTML = `
            <h3>${item.question}</h3>
            <span>${item.category}</span>
            <div class="answer" style="display: none;">
    <p>${item.answer}</p>
</div>

<button class="show-answer-btn" onclick="toggleAnswer(this)">
    Show Answer
</button>
        `;

        interviewList.appendChild(questionCard);
    });
}

displayInterviewQuestions();

function filterInterviewQuestions() {

    const searchText = searchInterview.value.toLowerCase().trim();
    const selectedCategory = interviewCategory.value;

    const filteredQuestions = interviewQuestions.filter(function (item) {

        const matchesSearch =
            item.question.toLowerCase().includes(searchText) ||
            item.answer.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" ||
            item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    displayInterviewQuestions(filteredQuestions);
}

if (searchInterview) {
    searchInterview.addEventListener("input", filterInterviewQuestions);
}

if (interviewCategory) {
    interviewCategory.addEventListener("change", filterInterviewQuestions);
}
function toggleAnswer(button) {

    const answer = button.previousElementSibling;

    if (answer.style.display === "none") {
        answer.style.display = "block";
        button.textContent = "Hide Answer";
    } else {
        answer.style.display = "none";
        button.textContent = "Show Answer";
    }
}
 // ==================== DSA QUESTION BANK ====================

const dsaQuestionList =
    document.getElementById("dsa-question-list");

const searchDsa =
    document.getElementById("search-dsa");

const dsaTopicFilter =
    document.getElementById("dsa-topic-filter");

const dsaDifficultyFilter =
    document.getElementById("dsa-difficulty-filter");

const dsaPlatformFilter =
    document.getElementById("dsa-platform-filter");


const dsaQuestions = [
    
    // Arrays questions will be added here
    {
    question: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.",
    approach: "Use a hash map to store each number and its index. For every element, calculate target - nums[i]. If the required value already exists in the hash map, return its stored index and the current index. Otherwise, store the current number and its index.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "This problem tests array traversal and hash map usage. The brute-force approach takes O(n²), while the hash map reduces the lookup time and gives an O(n) solution."
},

{
    question: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array where prices[i] represents the price of a stock on the ith day, find the maximum profit that can be achieved by buying on one day and selling on a later day.",
    approach: "Maintain the minimum price seen so far and calculate the profit if the stock is sold on the current day. Update the maximum profit whenever a better profit is found. This requires only one traversal of the array.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The important idea is that we only need the cheapest buying price before the current selling day. This avoids checking every possible buy and sell pair."
},

{
    question: "Contains Duplicate",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array nums, return true if any value appears at least twice and return false if every element is distinct.",
    approach: "Use a hash set to keep track of elements already encountered. Traverse the array and check whether the current element already exists in the set. If it does, a duplicate has been found. Otherwise, add the element to the set.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "A hash set provides average O(1) lookup, making it much faster than comparing every pair of elements."
},

{
    question: "Valid Anagram",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given two strings s and t, determine whether t is an anagram of s, meaning both strings contain the same characters with the same frequencies.",
    approach: "Count the frequency of each character in the first string and reduce the count while processing the second string. If the lengths are different, the strings cannot be anagrams. Finally, verify that all character counts are zero.",
    complexity: "Time: O(n), Space: O(1) for a fixed character set.",
    interview: "This problem tests frequency counting. A hash map or fixed-size frequency array can be used to compare character occurrences efficiently."
},

{
    question: "Maximum Subarray",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array nums, find the contiguous subarray with the largest sum and return its sum.",
    approach: "Use Kadane's Algorithm. Maintain the maximum sum ending at the current position. At every element, decide whether to start a new subarray or extend the existing one. Keep track of the maximum sum found so far.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Kadane's Algorithm is a classic dynamic programming approach. The key idea is that a negative running sum should not be carried forward when starting a new subarray gives a better result."
},

{
    question: "Move Zeroes",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array, move all zeroes to the end while maintaining the relative order of the non-zero elements.",
    approach: "Use a pointer to represent the position where the next non-zero element should be placed. Traverse the array and move non-zero values to the front. After that, fill the remaining positions with zeroes.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is an in-place array manipulation problem. The two-pointer technique allows us to solve it without using an additional array."
},

{
    question: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a sorted array, remove the duplicates in-place so that each unique element appears only once and return the number of unique elements.",
    approach: "Use two pointers. One pointer tracks the position of the last unique element while the other scans the array. Whenever a new unique value is found, place it after the previous unique value.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Because the array is sorted, duplicate values are adjacent. This allows the two-pointer technique to remove duplicates efficiently without extra space."
},

{
    question: "Remove Element",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array nums and a value val, remove all occurrences of val in-place and return the number of elements remaining.",
    approach: "Maintain a write pointer. Traverse the array and whenever the current value is not equal to val, place it at the write position and increment the pointer.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This problem tests in-place modification. We do not need to physically delete elements; we only need to overwrite unwanted values and return the valid length."
},

{
    question: "Merge Sorted Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given two sorted arrays nums1 and nums2, merge nums2 into nums1 so that nums1 becomes one sorted array.",
    approach: "Use three pointers starting from the ends of the valid elements. Compare the largest remaining elements and place the larger one at the end of nums1. Working backwards prevents overwriting useful values.",
    complexity: "Time: O(m+n), Space: O(1).",
    interview: "The important trick is to merge from the back because nums1 already contains extra space. This allows an in-place solution."
},

{
    question: "Rotate Array",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array, rotate the elements to the right by k positions.",
    approach: "First reduce k using k = k % n. Then reverse the complete array, reverse the first k elements and finally reverse the remaining elements. This produces the required rotation in-place.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The reversal technique is a common array manipulation pattern. It achieves rotation without using another array."
},

{
    question: "Majority Element",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array nums of size n, find the element that appears more than n/2 times.",
    approach: "Use the Boyer-Moore Voting Algorithm. Maintain a candidate and a counter. Increase the counter when the current element matches the candidate and decrease it otherwise. When the counter reaches zero, choose the next element as the candidate.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Boyer-Moore is important because it finds the majority element using constant extra space. The majority element's frequency guarantees that the final candidate is correct."
},

{
    question: "Missing Number",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array containing n distinct numbers from 0 to n, find the missing number.",
    approach: "Use the XOR operation or calculate the expected sum from 0 to n and subtract the actual sum. The XOR approach avoids possible integer overflow associated with large sums.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The XOR solution works because x XOR x becomes zero. All numbers that appear cancel each other, leaving only the missing number."
},

{
    question: "Single Number",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a non-empty array where every element appears twice except one element, find the element that appears only once.",
    approach: "Initialize a result variable with zero and XOR every element with it. Every duplicate pair cancels because a XOR a equals zero. The remaining value is the unique element.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This problem is a common application of XOR. It provides a simple constant-space solution without using a hash map."
},

{
    question: "Intersection of Two Arrays",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given two integer arrays, return their intersection where each value appears only once in the result.",
    approach: "Store the elements of one array in a hash set. Traverse the second array and check whether each element exists in the set. Add matching values to another set to avoid duplicates.",
    complexity: "Time: O(n+m), Space: O(n+m).",
    interview: "Hash sets provide efficient membership checks. This approach avoids comparing every element of the two arrays."
},

{
    question: "Intersection of Two Arrays II",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given two arrays, return their intersection including duplicate values according to their frequency in both arrays.",
    approach: "Use a frequency map for the first array. Traverse the second array and check the frequency of each element. If its frequency is greater than zero, add it to the result and decrease the frequency.",
    complexity: "Time: O(n+m), Space: O(n).",
    interview: "Unlike the previous intersection problem, duplicates matter here. Frequency counting allows us to correctly maintain how many times each value can appear."
},

{
    question: "Product of Array Except Self",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array nums, return an array where each element is the product of all elements except nums[i]. Division should not be used.",
    approach: "Calculate prefix products from left to right and store them in the result. Then traverse from right to left while maintaining a suffix product and multiply it with the prefix value already stored.",
    complexity: "Time: O(n), Space: O(1) extra space excluding the output array.",
    interview: "The key idea is separating the product into values before and after the current index. This avoids division and handles arrays containing zero."
},

{
    question: "Maximum Product Subarray",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the contiguous subarray within an array that has the largest product.",
    approach: "Maintain both the maximum and minimum product ending at the current position because a negative number can turn the minimum product into the maximum. For every element, update both values and track the global maximum.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Unlike maximum sum, product can change dramatically because of negative values. Keeping both maximum and minimum products handles this correctly."
},

{
    question: "Find Pivot Index",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the leftmost index where the sum of elements on the left equals the sum of elements on the right.",
    approach: "Calculate the total sum of the array. Maintain a left sum while traversing the array. The right sum can be calculated as total - left - current element. If left equals right, the current index is the pivot.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The total-sum technique avoids calculating left and right sums repeatedly. This reduces the solution from potentially O(n²) to O(n)."
},

{
    question: "Running Sum of 1d Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array nums, return the running sum where runningSum[i] equals the sum of elements from index 0 through i.",
    approach: "Maintain a running total while traversing the array. Add the current element to the total and store the result at the current position.",
    complexity: "Time: O(n), Space: O(1) extra space if modifying the input array.",
    interview: "This is a basic prefix-sum problem. It introduces the idea of maintaining cumulative information while traversing an array."
},

{
    question: "Find All Numbers Disappeared in an Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array containing integers from 1 to n, find all numbers in the range that do not appear in the array.",
    approach: "Use the array itself as a marker structure. For every value x, mark the element at index x-1 as negative. After processing all values, positive positions represent missing numbers.",
    complexity: "Time: O(n), Space: O(1) extra space excluding the output.",
    interview: "This problem demonstrates how an input array can be reused as a data structure to achieve constant extra space."
},

{
    question: "Find the Duplicate Number",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array containing n+1 integers where each integer is between 1 and n, find the duplicate number without modifying the array.",
    approach: "Treat the array as a linked-list-like structure where each value points to another index. Floyd's cycle detection algorithm can then be used to find the cycle and identify the duplicate value.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This problem is interesting because the array cannot be modified and extra space is not allowed. Floyd's cycle detection provides an elegant solution."
},

{
    question: "Sort Colors",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array containing only 0, 1 and 2, sort the array in-place.",
    approach: "Use the Dutch National Flag algorithm with three pointers representing the regions for 0, 1 and 2. Move elements into their correct regions while traversing the array once.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is a classic three-pointer problem. It demonstrates how an array containing a small fixed set of values can be sorted in one pass."
},

{
    question: "Pascal's Triangle",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer numRows, generate the first numRows of Pascal's triangle.",
    approach: "Each row starts and ends with 1. Every middle element is calculated by adding the two elements directly above it from the previous row. Build each row using the previously generated row.",
    complexity: "Time: O(n²), Space: O(n²) for the output.",
    interview: "This problem demonstrates how previously calculated results can be used to build a two-dimensional structure."
},

{
    question: "Spiral Matrix",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an m x n matrix, return all elements in spiral order.",
    approach: "Maintain four boundaries: top, bottom, left and right. Traverse the top row, right column, bottom row and left column, then move the boundaries inward. Continue until all elements are processed.",
    complexity: "Time: O(m*n), Space: O(1) excluding the output.",
    interview: "The main challenge is correctly updating boundaries after each directional traversal and avoiding duplicate processing."
},

{
    question: "Rotate Image",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an n x n matrix, rotate the matrix 90 degrees clockwise in-place.",
    approach: "First transpose the matrix by swapping elements across the main diagonal. Then reverse every row. The combination produces a 90-degree clockwise rotation.",
    complexity: "Time: O(n²), Space: O(1).",
    interview: "The transpose-and-reverse technique is an efficient in-place matrix transformation. It avoids creating another matrix."
},

{
    question: "Set Matrix Zeroes",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "If an element in a matrix is zero, set its entire row and column to zero.",
    approach: "Use the first row and first column as markers to remember which rows and columns contain zeroes. Traverse the matrix and mark the appropriate positions. Then update the matrix based on those markers.",
    complexity: "Time: O(m*n), Space: O(1).",
    interview: "The challenge is achieving constant extra space. Reusing the matrix itself as marker storage provides the optimized solution."
},

{
    question: "Subarray Sum Equals K",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array nums and an integer k, find the total number of continuous subarrays whose sum equals k.",
    approach: "Use a prefix sum and a hash map storing how many times each prefix sum has appeared. For the current prefix sum, check whether prefixSum - k exists in the map. Its frequency tells how many valid subarrays end at the current position.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "This is an important prefix-sum and hashing problem. The hash map avoids checking every possible subarray."
},

{
    question: "Longest Consecutive Sequence",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an unsorted array of integers, find the length of the longest consecutive elements sequence.",
    approach: "Store all numbers in a hash set. For each number, start a sequence only when number-1 is not present. Then keep checking number+1 to calculate the sequence length.",
    complexity: "Time: O(n) average, Space: O(n).",
    interview: "The important optimization is starting a sequence only from its smallest element. This prevents repeatedly scanning the same sequence."
},

{
    question: "3Sum",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array, find all unique triplets whose sum is zero.",
    approach: "Sort the array first. Fix one element and use two pointers for the remaining part of the array. Move the pointers based on whether the current sum is smaller or larger than zero, while skipping duplicates.",
    complexity: "Time: O(n²), Space: O(1) extra space excluding sorting requirements.",
    interview: "Sorting allows the two-pointer technique to be applied. Handling duplicate values carefully is an important part of the problem."
},

{
    question: "Container With Most Water",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array of heights, find two lines that together with the x-axis form a container containing the maximum amount of water.",
    approach: "Use two pointers at the beginning and end of the array. Calculate the current area and move the pointer with the smaller height inward because the smaller height limits the container.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The two-pointer strategy eliminates the need to check every pair. Moving the shorter line is the key greedy observation."
},

{
    question: "Maximum Difference Between Increasing Elements",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the maximum difference nums[j] - nums[i] where i is smaller than j and nums[j] is greater than nums[i].",
    approach: "Maintain the minimum value encountered so far. For every current value, calculate the difference between the current value and the minimum. Update the maximum difference and minimum value as needed.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is similar to the stock buy-and-sell pattern. We only need the smallest previous value to maximize the current difference."
},

{
    question: "Squares of a Sorted Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array sorted in non-decreasing order, return an array containing the squares of each number also sorted in non-decreasing order.",
    approach: "Use two pointers at both ends because the largest absolute values can occur at either end. Compare their squares and place the larger square at the end of the result array.",
    complexity: "Time: O(n), Space: O(n) for the result.",
    interview: "Simply squaring and sorting would take O(n log n). The two-pointer approach takes linear time because the input is already sorted."
},

{
    question: "Merge Intervals",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array of intervals, merge all overlapping intervals.",
    approach: "Sort intervals by their starting value. Keep a current interval and compare the next interval's start with the current end. If they overlap, extend the current interval; otherwise, add the current interval to the result.",
    complexity: "Time: O(n log n), Space: O(n) for the output.",
    interview: "Sorting makes overlapping intervals appear next to each other. The problem then becomes a simple linear scan after sorting."
},

{
    question: "Insert Interval",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a collection of non-overlapping intervals sorted by start time and a new interval, insert the new interval and merge if necessary.",
    approach: "Add intervals that end before the new interval starts. Merge all intervals that overlap with the new interval. Finally, add the remaining intervals.",
    complexity: "Time: O(n), Space: O(n) for the result.",
    interview: "Because the intervals are already sorted, we do not need to sort them again. We can process them in a single pass."
},

{
    question: "Non-decreasing Array",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Determine whether an array can become non-decreasing by modifying at most one element.",
    approach: "Traverse the array and detect when nums[i] is smaller than nums[i-1]. When this happens, modify either the current element or the previous element based on surrounding values. Count such violations and ensure there is at most one.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The key is deciding which of the two conflicting values should be changed. Checking neighboring elements prevents making a choice that creates another violation."
},

{
    question: "Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a rotated sorted array with unique elements, find the minimum element.",
    approach: "Use binary search. Compare the middle element with the rightmost element to determine which half contains the minimum. Continue narrowing the search range until the minimum is found.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "Although the array is rotated, it still has enough sorted structure to apply binary search. This reduces the search from linear to logarithmic time."
},

{
    question: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a rotated sorted array of unique integers and a target value, return the target's index or -1 if it is not present.",
    approach: "Use binary search and determine which half of the array is sorted. Check whether the target lies inside that sorted half. If it does, search there; otherwise search the other half.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The main insight is that at least one half remains sorted after rotation. This allows binary search to continue efficiently."
},

{
    question: "Find Peak Element",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find an element that is greater than its neighboring elements in an array.",
    approach: "Use binary search by comparing the middle element with the next element. If the next element is greater, a peak must exist on the right; otherwise, a peak exists on the left including the middle.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The important observation is that if the array is increasing at a point, a peak must exist somewhere to the right. This allows binary search."
},

{
    question: "Kth Largest Element in an Array",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the kth largest element in an unsorted array.",
    approach: "A min-heap of size k can be used to keep the k largest elements seen so far. When the heap size exceeds k, remove the smallest element. The root of the heap becomes the kth largest value.",
    complexity: "Time: O(n log k), Space: O(k).",
    interview: "A heap is useful when k is much smaller than n. Instead of sorting the entire array, we maintain only the k most important elements."
},

{
    question: "Top K Frequent Elements",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an integer array nums and an integer k, return the k most frequent elements.",
    approach: "First count the frequency of every element using a hash map. Then use a heap or bucket-based approach to retrieve the elements with the highest frequencies.",
    complexity: "Time: O(n log k) using a heap, Space: O(n).",
    interview: "This problem combines frequency counting with a selection data structure. It is a common interview question for testing hashing and heaps."
},

{
    question: "Maximum Sum Circular Subarray",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the maximum possible sum of a non-empty subarray in a circular array.",
    approach: "Calculate the normal maximum subarray sum using Kadane's algorithm. Also calculate the minimum subarray sum and subtract it from the total sum to represent a circular subarray. Handle the all-negative case separately.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The circular case can be transformed into total sum minus the minimum subarray. Understanding this transformation is the key insight."
},

{
    question: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array representing elevation heights, calculate how much rainwater can be trapped after raining.",
    approach: "Use two pointers with left and right maximum heights. At each step, process the side with the smaller maximum because that side determines the amount of trapped water. Add the difference between the maximum height and current height.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The two-pointer solution avoids storing separate prefix and suffix arrays. The main insight is that water level is limited by the smaller boundary."
},

{
    question: "First Missing Positive",
    difficulty: "Hard",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an unsorted integer array, find the smallest missing positive integer using constant extra space.",
    approach: "Place every valid positive number x at index x-1 whenever possible. After rearranging, scan the array for the first index where nums[i] is not i+1. That index gives the smallest missing positive number.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The challenge is achieving linear time and constant extra space. The array itself is used as a hash-like structure by placing values at their corresponding indexes."
},

{
    question: "Majority Element II",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find all elements that appear more than n/3 times in an integer array.",
    approach: "Use an extended Boyer-Moore Voting Algorithm with two candidates because there can be at most two elements occurring more than n/3 times. Track two candidates and their counts during the first pass, then verify their actual frequencies.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The important mathematical observation is that there can be at most two elements with frequency greater than n/3. This allows constant-space candidate tracking."
},

{
    question: "Maximum Length of Subarray With Positive Product",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the length of the longest subarray whose product is positive.",
    approach: "Track the length of the longest positive-product and negative-product subarrays ending at the current position. A positive number extends both states, while a negative number swaps their roles. Reset both states when a zero appears.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Instead of calculating products directly, track their signs. Maintaining positive and negative lengths avoids overflow and gives a linear solution."
},

{
    question: "Find the Middle Index in Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the leftmost index where the sum of the elements to the left equals the sum of the elements to the right.",
    approach: "Calculate the total sum first. Maintain a left sum while traversing. The right sum is totalSum - leftSum - nums[i]. Return the first index where both sums are equal.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is another useful prefix-sum pattern. By maintaining the total and left sum, we avoid recalculating the right side for every index."
},

{
    question: "Find Common Elements in Three Sorted Arrays",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Given three sorted arrays, find the elements that appear in all three arrays.",
    approach: "Use three pointers, one for each array. Compare the current elements. If they are equal, add the value to the result and move all pointers. Otherwise, move the pointer containing the smallest value.",
    complexity: "Time: O(n1+n2+n3), Space: O(1) excluding the result.",
    interview: "Because all arrays are sorted, three pointers allow us to skip values that cannot possibly match later elements."
},

{
    question: "Leaders in an Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "An element is called a leader if it is greater than or equal to all elements to its right. Find all leaders in an array.",
    approach: "Traverse the array from right to left while maintaining the maximum value seen so far. If the current element is greater than or equal to that maximum, it is a leader. Update the maximum after each element.",
    complexity: "Time: O(n), Space: O(1) excluding the result.",
    interview: "Traversing from the right is the key idea because the leader condition depends on elements to the right."
},

{
    question: "Equilibrium Index of an Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Find an index where the sum of elements on the left is equal to the sum of elements on the right.",
    approach: "Calculate the total sum of the array. Maintain a left sum while traversing and calculate the right sum using total - left - current. Return the first index where both sums match.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The problem is solved efficiently using a running prefix sum and total sum. It is a common pattern for balance or equilibrium problems."
},

{
    question: "Rearrange Array Alternately",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Given a sorted array, rearrange it so that the maximum and minimum elements appear alternately.",
    approach: "Use two pointers, one at the beginning and one at the end. Pick the maximum value, then the minimum value, and continue alternately. If an in-place solution is required, encoding techniques can be used to preserve original values temporarily.",
    complexity: "Time: O(n), Space: O(1) for an appropriate in-place encoding approach.",
    interview: "The main pattern is two-pointer traversal from both ends. It is useful for rearrangement problems where the smallest and largest values must be accessed repeatedly."
},

{
    question: "Maximum Consecutive Ones",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a binary array, find the maximum number of consecutive 1s in the array.",
    approach: "Maintain a current count of consecutive ones and a maximum count. Increment the current count when the element is one and reset it to zero when the element is zero.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is a simple linear traversal problem that demonstrates maintaining state while scanning an array."
},

{
    question: "Maximum Consecutive Ones III",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given a binary array and an integer k, find the longest subarray containing at most k zeroes.",
    approach: "Use a sliding window with left and right pointers. Expand the window and count zeroes. When the number of zeroes becomes greater than k, move the left pointer until the window becomes valid again.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This problem introduces the sliding-window technique. The window represents the longest valid range under a given constraint."
},

{
    question: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array of positive integers and a target value, find the minimum length of a contiguous subarray whose sum is greater than or equal to the target.",
    approach: "Use a sliding window. Expand the right pointer until the sum reaches the target. Then move the left pointer while the condition remains satisfied to minimize the window length.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Because all values are positive, increasing the right pointer increases the sum and moving the left pointer decreases it. This makes sliding window effective."
},

{
    question: "Next Permutation",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Rearrange numbers into the lexicographically next greater permutation. If no greater permutation exists, rearrange the array into the lowest possible order.",
    approach: "Find the first decreasing element from the right. Find the smallest element greater than it on the right, swap them, and reverse the suffix.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The algorithm identifies the longest decreasing suffix and makes the smallest possible change to produce the next permutation."
},

{
    question: "Find the Duplicate and Missing Number",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Given an array containing numbers from 1 to n where one number is duplicated and another is missing, find both numbers.",
    approach: "Use mathematical equations or XOR to identify the duplicate and missing values. Another approach is to use frequency counting, although that requires extra space. The XOR method can achieve constant extra space.",
    complexity: "Time: O(n), Space: O(1) using an XOR-based solution.",
    interview: "This problem tests mathematical reasoning and XOR properties. The important part is finding both values without sorting or using an additional frequency array."
},

{
    question: "Maximum Product of Two Elements in an Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Find the maximum value of (nums[i]-1) * (nums[j]-1) for two distinct elements in the array.",
    approach: "Find the two largest elements in a single traversal. Since the expression increases as the selected values increase, these two elements produce the maximum product.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The problem can be solved without sorting because only the two largest values are required. Tracking them during one traversal is optimal."
},

{
    question: "Array Partition",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given an array of 2n integers, group them into n pairs so that the sum of the minimum values of each pair is maximized.",
    approach: "Sort the array and pair adjacent elements. For every pair, the smaller element contributes to the result. Sorting ensures that larger values are not wasted as minimum elements.",
    complexity: "Time: O(n log n), Space: O(1) or dependent on sorting implementation.",
    interview: "The greedy strategy is based on pairing neighboring sorted values. This maximizes the possible minimum contribution from each pair."
},

{
    question: "Can Make Arithmetic Progression From Sequence",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Determine whether an array can be rearranged to form an arithmetic progression.",
    approach: "Sort the array and calculate the difference between the first two elements. Then verify that every consecutive pair has the same difference.",
    complexity: "Time: O(n log n), Space: O(1) excluding sorting requirements.",
    interview: "Sorting converts the unordered input into the natural progression order. Then a single traversal verifies the common difference."
},

{
    question: "Find the Difference of Two Arrays",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "LeetCode",
    problem: "Given two arrays, find values that appear in one array but not in the other.",
    approach: "Convert both arrays into sets. For every value in the first set, check whether it exists in the second set, and vice versa. Add values that are missing from the opposite set.",
    complexity: "Time: O(n+m) average, Space: O(n+m).",
    interview: "Using sets makes membership checks efficient. It also automatically removes duplicate values from the input arrays."
},

{
    question: "Find the Largest Element in an Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Given an array of integers, find the largest element.",
    approach: "Initialize the maximum with the first element and traverse the array. Whenever a larger element is found, update the maximum.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "A single traversal is sufficient because every element must be inspected at least once. No sorting is required."
},

{
    question: "Find the Second Largest Element",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Find the second largest distinct element in an array.",
    approach: "Maintain two variables for the largest and second largest values. Update them while traversing the array and ignore values equal to the largest when looking for a distinct second largest value.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Sorting would take O(n log n), but maintaining the top two values during one traversal gives an optimal O(n) solution."
},

{
    question: "Check if Array Is Sorted",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Determine whether an array is sorted in non-decreasing order.",
    approach: "Traverse the array and compare every element with the previous element. If any current element is smaller than the previous element, the array is not sorted.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Only adjacent elements need to be compared. The first violation is enough to conclude that the array is not sorted."
},

{
    question: "Reverse an Array",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Reverse the elements of an array in-place.",
    approach: "Use two pointers, one at the beginning and one at the end. Swap the elements and move both pointers toward the center until they meet.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The two-pointer technique provides an in-place solution without creating another array. It is a fundamental pattern used in many array and string problems."
},

{
    question: "Find Frequency of Each Element",
    difficulty: "Easy",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Given an array, find how many times each distinct element occurs.",
    approach: "Use a hash map where each element is used as a key and its occurrence count is stored as the value. Traverse the array once and increment the corresponding count.",
    complexity: "Time: O(n) average, Space: O(n).",
    interview: "Frequency counting is a fundamental hashing pattern. It is used in problems involving duplicates, anagrams, majority elements and frequency-based selection."
},

{
    question: "Rearrange Positive and Negative Numbers",
    difficulty: "Medium",
    topic: "Arrays",
    platform: "GeeksforGeeks",
    problem: "Rearrange an array so that positive and negative elements appear alternately whenever possible.",
    approach: "Separate or partition positive and negative elements and then place them alternately. An in-place approach can use partitioning and rotation, while an auxiliary-array approach is simpler.",
    complexity: "Time: O(n), Space: O(n) for the auxiliary-array approach.",
    interview: "The problem tests partitioning and array rearrangement. The exact approach depends on whether maintaining relative order and constant extra space are required."
},

// ==================== STRINGS — 40 QUESTIONS ====================

{
    question: "Valid Palindrome",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Given a string, determine whether it is a palindrome after converting uppercase letters to lowercase and removing non-alphanumeric characters.",
    approach: "Use two pointers, one from the beginning and one from the end. Skip non-alphanumeric characters and compare the remaining characters after converting them to lowercase. Move both pointers inward until they meet.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Explain that the two-pointer technique avoids creating another cleaned string. The key idea is to compare only valid characters from both ends."
},

{
    question: "Reverse String",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Reverse an array of characters in-place without using an extra array.",
    approach: "Use two pointers at the first and last positions. Swap the characters and move both pointers toward the center until the complete string is reversed.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Mention that swapping from both ends allows the string to be reversed in-place without extra memory."
},

{
    question: "Reverse Words in a String",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Given a string containing words separated by spaces, reverse the order of the words while removing unnecessary spaces.",
    approach: "Split the string into words, remove empty entries caused by extra spaces, reverse the words and join them using a single space.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "Explain how whitespace handling is important because the input can contain leading, trailing or multiple spaces."
},

{
    question: "Longest Common Prefix",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the longest common prefix shared by all strings in an array.",
    approach: "Take the first string as the initial prefix and compare it with every other string. Shorten the prefix until it matches the beginning of the current string.",
    complexity: "Time: O(n × m), where m is the prefix length, Space: O(1).",
    interview: "The important idea is continuously reducing the prefix until every string shares it."
},

{
    question: "First Unique Character in a String",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the index of the first character that occurs exactly once in a string.",
    approach: "First count the frequency of every character using a hash map or frequency array. Traverse the string again and return the first character whose frequency is one.",
    complexity: "Time: O(n), Space: O(1) for a fixed character set.",
    interview: "Use two passes: one to count frequencies and another to preserve the original order while finding the first unique character."
},

{
    question: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether brackets in a string are correctly opened and closed in the proper order.",
    approach: "Use a stack. Push opening brackets and whenever a closing bracket appears, check whether it matches the top of the stack.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "The stack works because the most recently opened bracket must be the first one closed."
},

{
    question: "Group Anagrams",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Group strings that are anagrams of each other.",
    approach: "Create a canonical representation for each string, such as its sorted characters or character-frequency signature. Use that representation as a hash-map key.",
    complexity: "Time: O(n × k log k) using sorting, Space: O(n × k).",
    interview: "Explain that anagrams have the same character composition, so a common signature allows them to be grouped efficiently."
},

{
    question: "Longest Palindromic Substring",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the longest substring that reads the same forward and backward.",
    approach: "Expand around every possible center. Consider both odd-length and even-length palindromes and keep track of the longest one.",
    complexity: "Time: O(n²), Space: O(1).",
    interview: "Explain the center-expansion technique and why every palindrome has either one character or a gap between two characters as its center."
},

{
    question: "Palindromic Substrings",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Count how many substrings of a string are palindromes.",
    approach: "Expand around every possible center and count every valid palindrome found during expansion.",
    complexity: "Time: O(n²), Space: O(1).",
    interview: "Instead of generating every substring separately, expand around centers and count palindromes directly."
},

{
    question: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the length of the longest substring containing no repeated characters.",
    approach: "Use a sliding window with two pointers and a set or map. Expand the right pointer and move the left pointer whenever a duplicate character enters the window.",
    complexity: "Time: O(n), Space: O(k), where k is the character set size.",
    interview: "This is a classic sliding-window problem. Maintain a window that always contains unique characters."
},

{
    question: "Permutation in String",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether one string contains a substring that is a permutation of another string.",
    approach: "Maintain character frequencies for the smaller string and compare them with every fixed-size sliding window of the larger string.",
    complexity: "Time: O(n), Space: O(1) for a fixed alphabet.",
    interview: "The key observation is that every permutation has exactly the same character frequencies."
},

{
    question: "Find All Anagrams in a String",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find all starting indices where an anagram of a pattern occurs in a given string.",
    approach: "Use a fixed-size sliding window equal to the pattern length and maintain character frequencies for the current window.",
    complexity: "Time: O(n), Space: O(1) for a fixed alphabet.",
    interview: "Use frequency comparison rather than sorting every substring, which keeps the solution linear."
},

{
    question: "String Compression",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Compress consecutive repeated characters by storing the character followed by its count.",
    approach: "Traverse the characters and count consecutive occurrences. Write the character and count directly into the array.",
    complexity: "Time: O(n), Space: O(1) extra.",
    interview: "Mention that the important part is handling counts greater than nine correctly by writing their digits individually."
},

{
    question: "String to Integer (atoi)",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Convert a string representation of an integer into an actual integer while handling spaces, signs and overflow.",
    approach: "Skip leading spaces, process an optional sign, then read consecutive digits. Before adding each digit, check whether the result would exceed the integer limits.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Focus on edge cases such as leading spaces, positive or negative signs, non-digit characters and integer overflow."
},

{
    question: "Implement strStr()",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the first occurrence of a pattern string inside another string.",
    approach: "Compare the pattern against each possible starting position. For larger inputs, algorithms such as KMP can avoid repeated comparisons.",
    complexity: "Basic approach: O(n × m) time and O(1) space. KMP improves it to O(n + m).",
    interview: "Explain the simple approach first and mention KMP as an optimized pattern-matching technique."
},

{
    question: "Is Subsequence",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether one string is a subsequence of another string.",
    approach: "Use two pointers. Move through the larger string and advance the pointer of the smaller string whenever the characters match.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The relative order must remain unchanged, but characters do not need to be contiguous."
},

{
    question: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the longest substring that can be converted into the same character by replacing at most k characters.",
    approach: "Use a sliding window and maintain the frequency of the most common character. The window is valid when window size minus maximum frequency is at most k.",
    complexity: "Time: O(n), Space: O(1) for a fixed alphabet.",
    interview: "The key formula is replacements needed = window size - frequency of the most frequent character."
},

{
    question: "Minimum Window Substring",
    difficulty: "Hard",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the smallest substring of one string that contains all characters of another string with the required frequencies.",
    approach: "Use a sliding window with frequency maps. Expand the right pointer until the window becomes valid, then shrink from the left while preserving validity.",
    complexity: "Time: O(n), Space: O(k).",
    interview: "Explain the expand-and-shrink sliding-window pattern and how required character counts determine when the window is valid."
},

{
    question: "Decode String",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Decode encoded strings such as 3[a2[c]] into their expanded form.",
    approach: "Use stacks to store previous strings and repetition counts whenever an opening bracket is encountered. Build the current string until a closing bracket completes a nested section.",
    complexity: "Time: O(n) excluding the size of the final expanded output, Space: O(n).",
    interview: "Nested brackets make this a natural stack problem because the most recently opened section must be completed first."
},

{
    question: "Multiply Strings",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Multiply two non-negative integers represented as strings without converting them directly into integer types.",
    approach: "Simulate schoolbook multiplication using an integer array to store digit products and carries.",
    complexity: "Time: O(m × n), Space: O(m + n).",
    interview: "Explain how each digit contributes to a position in the result and how carry propagation is handled."
},

{
    question: "Add Strings",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Add two non-negative integers represented as strings without using built-in big integer conversion.",
    approach: "Start from the last characters of both strings and add corresponding digits with a carry.",
    complexity: "Time: O(max(m,n)), Space: O(max(m,n)).",
    interview: "This is similar to manual addition. Process digits from right to left and maintain a carry."
},

{
    question: "Compare Version Numbers",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Compare two version numbers represented as dot-separated numeric components.",
    approach: "Split both versions into components and compare corresponding numeric values. Missing components are treated as zero.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "Be careful about leading zeros and different numbers of components."
},

{
    question: "Roman to Integer",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Convert a Roman numeral into its integer value.",
    approach: "Map each Roman symbol to its value. If the current value is smaller than the next value, subtract it; otherwise add it.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "The key observation is that subtraction occurs when a smaller numeral appears before a larger numeral."
},

{
    question: "Integer to Roman",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Convert an integer into its Roman numeral representation.",
    approach: "Store Roman symbols in descending value order, including special combinations such as IV, IX, XL and CM. Repeatedly take the largest possible value.",
    complexity: "Time: O(1) for the bounded Roman numeral range, Space: O(1).",
    interview: "A greedy approach works because Roman numeral values can be represented by taking the largest valid symbol at each step."
},

{
    question: "Count and Say",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Generate the nth term of the count-and-say sequence.",
    approach: "For each term, scan the previous string and count consecutive equal characters, then append the count followed by the character.",
    complexity: "Time: O(n × L), where L is the generated string length, Space: O(L).",
    interview: "Explain that every term is generated directly from the previous term by run-length encoding."
},

{
    question: "Zigzag Conversion",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Write a string in a zigzag pattern across a given number of rows and then read it row by row.",
    approach: "Simulate movement between rows using a direction flag. Append each character to its current row and reverse direction at the top and bottom.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "The main challenge is handling the direction change correctly when reaching the first or last row."
},

{
    question: "Partition Labels",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Partition a string into as many parts as possible so that each character appears in at most one part.",
    approach: "Record the last occurrence of every character. Expand the current partition until its right boundary reaches the last occurrence of every character inside it.",
    complexity: "Time: O(n), Space: O(1) for a fixed alphabet.",
    interview: "The partition boundary is determined by the farthest last occurrence of characters already included in the current partition."
},

{
    question: "Remove Duplicate Letters",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Remove duplicate letters so that every character appears once and the resulting string is lexicographically smallest.",
    approach: "Use a monotonic stack. Remove a larger character from the stack when it appears later again and replacing it produces a smaller lexicographic result.",
    complexity: "Time: O(n), Space: O(k).",
    interview: "Explain the combination of frequency tracking, a stack and a visited set."
},

{
    question: "Smallest String Starting From Leaf",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Given a binary tree whose nodes contain values from 0 to 25, find the lexicographically smallest string from a leaf to the root.",
    approach: "Perform DFS while maintaining the current path. Whenever a leaf is reached, reverse the path representation and compare it with the best answer.",
    complexity: "Time: O(n × h) in a straightforward implementation, Space: O(h).",
    interview: "The important detail is that the required string direction is leaf-to-root, not root-to-leaf."
},

{
    question: "Backspace String Compare",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Compare two strings after interpreting # as a backspace character.",
    approach: "Use two pointers from the end and skip characters that are deleted by backspaces. Compare the remaining valid characters.",
    complexity: "Time: O(n + m), Space: O(1).",
    interview: "Processing from the end allows backspaces to be handled without constructing new strings."
},

{
    question: "Buddy Strings",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether two strings can become equal by swapping exactly two characters in the first string.",
    approach: "If lengths differ, return false. Find all mismatched positions. There must be exactly two mismatches that cross-match, or the strings must already match and contain a duplicate character.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Carefully handle the special case where the strings are already equal."
},

{
    question: "Reorganize String",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Rearrange characters so that no two adjacent characters are equal.",
    approach: "Use a max heap based on character frequency. Repeatedly choose the most frequent character that differs from the previously placed character.",
    complexity: "Time: O(n log k), Space: O(k).",
    interview: "The heap always gives access to the character with the highest remaining frequency while preventing adjacent duplicates."
},

{
    question: "Word Pattern",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether a string of words follows the same pattern as a sequence of characters.",
    approach: "Maintain two mappings: character to word and word to character. This ensures the relationship is one-to-one.",
    complexity: "Time: O(n), Space: O(n).",
    interview: "Two-way mapping is necessary because different pattern characters cannot map to the same word."
},

{
    question: "Isomorphic Strings",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether characters in one string can be replaced to obtain another string while preserving the character structure.",
    approach: "Maintain mappings in both directions and verify that every pair of corresponding characters has a consistent mapping.",
    complexity: "Time: O(n), Space: O(k).",
    interview: "The mapping must be one-to-one; otherwise two different characters could incorrectly map to the same character."
},

{
    question: "Repeated Substring Pattern",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether a string can be constructed by repeating one of its substrings multiple times.",
    approach: "Try prefix lengths that divide the total length and verify whether repeating the prefix reconstructs the complete string. An optimized solution can use the prefix-function/LPS array.",
    complexity: "Basic approach: O(n²); KMP-based approach: O(n).",
    interview: "Mention that periodic strings have a repeating structure that can be detected efficiently using KMP."
},

{
    question: "Longest Palindrome",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Find the maximum possible length of a palindrome that can be built using the characters of a given string.",
    approach: "Count character frequencies. Use every even count and use the largest possible odd count after taking pairs. One odd character can be placed at the center.",
    complexity: "Time: O(n), Space: O(k).",
    interview: "The palindrome is built from pairs of identical characters, with at most one odd-frequency character placed in the center."
},

{
    question: "Reverse Vowels of a String",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Reverse only the vowels in a string while keeping all other characters unchanged.",
    approach: "Use two pointers. Move them until both point to vowels, swap those vowels and continue inward.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is a direct application of the two-pointer technique where the pointers skip irrelevant characters."
},

{
    question: "Detect Capital",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Check whether capitalization in a word follows valid English capitalization rules.",
    approach: "A word is valid if all letters are uppercase, all are lowercase, or only the first letter is uppercase.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "Instead of converting the entire word unnecessarily, count or check the capitalization pattern directly."
},

{
    question: "Sort Characters By Frequency",
    difficulty: "Medium",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Sort the characters of a string in decreasing order of their frequency.",
    approach: "Count frequencies using a hash map and then sort the characters by frequency or place them into frequency buckets.",
    complexity: "Sorting approach: O(n log k) time; bucket approach can achieve O(n) time.",
    interview: "Explain the difference between comparison sorting and bucket-based frequency sorting."
},

{
    question: "Ransom Note",
    difficulty: "Easy",
    topic: "Strings",
    platform: "LeetCode",
    problem: "Determine whether a ransom note can be constructed using letters available in another string, with each letter usable only once.",
    approach: "Count the frequency of every character in the available magazine string and decrease the count while processing the ransom note.",
    complexity: "Time: O(n + m), Space: O(k).",
    interview: "The key is frequency management: every required character must have sufficient availability."
},

// ==================== BINARY SEARCH — 35 QUESTIONS ====================

{
    question: "Binary Search",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Given a sorted array and a target value, return the index of the target if it exists, otherwise return -1.",
    approach: "Maintain low and high pointers. Calculate the middle element and compare it with the target. If the target is smaller, search the left half; otherwise search the right half.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "Binary search repeatedly cuts the search space into half, making it much faster than linear search on sorted data."
},

{
    question: "Search Insert Position",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Given a sorted array and a target, return the index where the target is found or where it should be inserted to maintain sorted order.",
    approach: "Use binary search and continue searching toward the left whenever the middle value is greater than or equal to the target. The final low position represents the insertion index.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The important observation is that the answer is the first position where the value is greater than or equal to the target."
},

{
    question: "First Bad Version",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Given versions where all versions after the first bad version are also bad, find the first bad version.",
    approach: "Apply binary search on the version range. If the middle version is bad, search the left half; otherwise search the right half.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "This demonstrates binary search on an answer space where the predicate changes from false to true exactly once."
},

{
    question: "Find First and Last Position",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the starting and ending positions of a target value in a sorted array.",
    approach: "Perform two binary searches: one to find the first occurrence and another to find the last occurrence.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "Using separate searches for the lower and upper boundaries is more efficient than scanning all occurrences."
},

{
    question: "Search a 2D Matrix",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Search for a target in a matrix where every row is sorted and each row starts after the previous row ends.",
    approach: "Treat the matrix as one sorted one-dimensional array. Convert a virtual index into row and column using division and modulo.",
    complexity: "Time: O(log(m × n)), Space: O(1).",
    interview: "The matrix's ordering allows us to perform normal binary search without physically flattening it."
},

{
    question: "Search a 2D Matrix II",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Search for a target in a matrix where every row and column is sorted in ascending order.",
    approach: "Start from the top-right corner. If the current value is greater than the target, move left; otherwise move down.",
    complexity: "Time: O(m + n), Space: O(1).",
    interview: "This is often called staircase search. Every move eliminates an entire row or column."
},

{
    question: "Sqrt(x)",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Return the integer square root of a non-negative integer without using built-in square-root functions.",
    approach: "Binary search between 0 and x. For each middle value, compare mid × mid with x while avoiding integer overflow.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "Binary search can be applied to numerical answer spaces, not only arrays."
},

{
    question: "Valid Perfect Square",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Determine whether a positive integer is a perfect square without using a square-root function.",
    approach: "Binary search possible square roots from 1 to num and compare mid × mid with the target.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The solution searches for an integer whose square equals the given number."
},

{
    question: "Guess Number Higher or Lower",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find a hidden number between 1 and n using an API that tells whether your guess is higher or lower.",
    approach: "Maintain a search range and use the API result to eliminate half of the possibilities after every guess.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The API provides exactly the comparison needed for binary search."
},

{
    question: "Peak Index in a Mountain Array",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the peak index in an array that strictly increases and then strictly decreases.",
    approach: "Compare the middle element with the next element. If the sequence is increasing, move right; otherwise move left including the middle.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The slope tells us which side contains the peak."
},

{
    question: "Find Smallest Letter Greater Than Target",
    difficulty: "Easy",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Given a sorted array of characters, find the smallest character that is strictly greater than a target.",
    approach: "Use binary search to find the first element greater than the target. If no such element exists, wrap around to the first character.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "This is another lower-bound style binary search problem."
},

{
    question: "Koko Eating Bananas",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the minimum eating speed that allows Koko to finish all banana piles within a given number of hours.",
    approach: "Binary search the possible eating speed from 1 to the maximum pile size. For every speed, calculate the required hours.",
    complexity: "Time: O(n log m), Space: O(1), where m is the maximum pile size.",
    interview: "This is binary search on answer. We search for the smallest speed that satisfies the condition."
},

{
    question: "Capacity To Ship Packages Within D Days",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the minimum ship capacity required to transport all packages within a given number of days while preserving their order.",
    approach: "Binary search the capacity between the largest package and the total weight. Simulate the number of days needed for each candidate capacity.",
    complexity: "Time: O(n log S), where S is the total weight, Space: O(1).",
    interview: "The feasibility condition is monotonic: if a capacity works, every larger capacity also works."
},

{
    question: "Split Array Largest Sum",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Split an array into k non-empty continuous subarrays while minimizing the largest subarray sum.",
    approach: "Binary search the possible maximum sum. For each candidate, greedily count how many subarrays are required.",
    complexity: "Time: O(n log S), Space: O(1).",
    interview: "The problem becomes easier when viewed as searching for the minimum feasible maximum sum."
},

{
    question: "Aggressive Cows",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Place cows in stalls so that the minimum distance between any two cows is maximized.",
    approach: "Sort the stall positions and binary search the possible minimum distance. Greedily place cows from left to right to check feasibility.",
    complexity: "Time: O(n log n + n log D), Space: O(1) apart from sorting.",
    interview: "This is a classic binary-search-on-answer problem. The feasibility check greedily places cows."
},

{
    question: "Allocate Minimum Pages",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Allocate books to students so that each student gets contiguous books and the maximum pages assigned to any student is minimized.",
    approach: "Binary search the maximum allowed pages. Greedily assign consecutive books until the limit is exceeded, then move to the next student.",
    complexity: "Time: O(n log S), Space: O(1).",
    interview: "The important constraint is that each student receives contiguous books."
},

{
    question: "Book Allocation Problem",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Distribute books among students while minimizing the maximum number of pages assigned to a student.",
    approach: "Use binary search over the answer range and a greedy feasibility check to determine whether the current page limit is possible.",
    complexity: "Time: O(n log S), Space: O(1).",
    interview: "Explain why the answer range starts at the largest book and ends at the total number of pages."
},

{
    question: "Painter's Partition Problem",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Partition boards among painters so that each painter gets contiguous boards and the maximum painting time is minimized.",
    approach: "Binary search the maximum work allowed for one painter and greedily assign consecutive boards until adding another board exceeds the limit.",
    complexity: "Time: O(n log S), Space: O(1).",
    interview: "This uses the same binary-search-on-answer pattern as book allocation."
},

{
    question: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the median of two sorted arrays in logarithmic time.",
    approach: "Binary search the partition position in the smaller array. Choose corresponding elements from the other array so that the left partition contains half the elements and every left element is less than every right element.",
    complexity: "Time: O(log(min(m,n))), Space: O(1).",
    interview: "The key idea is finding a correct partition rather than merging both arrays."
},

{
    question: "Kth Element of Two Sorted Arrays",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Find the kth smallest element from two sorted arrays without completely merging them.",
    approach: "Binary search how many elements should be taken from the first array while taking the remaining elements from the second array.",
    complexity: "Time: O(log(min(m,n))), Space: O(1).",
    interview: "This is closely related to the partition technique used for finding the median of two sorted arrays."
},

{
    question: "Minimum Days to Make m Bouquets",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the minimum day on which at least m bouquets can be made using adjacent flowers that have bloomed by that day.",
    approach: "Binary search the day. For each candidate day, scan the array and count how many bouquets can be formed from consecutive bloomed flowers.",
    complexity: "Time: O(n log D), Space: O(1).",
    interview: "The feasibility condition is monotonic: once a day is sufficient, every later day is also sufficient."
},

{
    question: "Magnetic Force Between Two Balls",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Place m balls in baskets so that the minimum magnetic force between any two balls is maximized.",
    approach: "Sort basket positions and binary search the minimum distance. Greedily place each next ball at the earliest valid basket.",
    complexity: "Time: O(n log D + n log n), Space: O(1) apart from sorting.",
    interview: "The greedy feasibility check determines whether a particular minimum distance is achievable."
},

{
    question: "Minimize Maximum Distance to Gas Station",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Add k gas stations so that the maximum distance between adjacent stations is minimized.",
    approach: "Binary search the possible maximum distance and calculate how many stations are needed to make every interval no larger than that distance.",
    complexity: "Time: O(n log D), Space: O(1).",
    interview: "This is another continuous answer-space binary search problem."
},

{
    question: "Find K Closest Elements",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find k elements closest to a given value x in a sorted array.",
    approach: "Binary search the starting index of the answer window of size k. Compare the distances at both boundaries to decide which side to discard.",
    complexity: "Time: O(log(n-k) + k), Space: O(1) excluding the output.",
    interview: "Instead of searching individual elements, binary search the position of the complete k-sized window."
},

{
    question: "Time Based Key-Value Store",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Design a data structure that stores values with timestamps and returns the value associated with the largest timestamp not greater than the requested timestamp.",
    approach: "Store timestamps in sorted order for every key. Use binary search to find the rightmost timestamp less than or equal to the requested time.",
    complexity: "Set: O(1) amortized; Get: O(log n) per key.",
    interview: "The central idea is applying binary search to timestamp history instead of scanning all stored values."
},

{
    question: "Random Pick with Weight",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Randomly select an index according to its assigned weight.",
    approach: "Build prefix sums of weights. Generate a random number in the total weight range and binary search the first prefix sum greater than or equal to it.",
    complexity: "Preprocessing: O(n), Pick: O(log n), Space: O(n).",
    interview: "Prefix sums convert weighted probabilities into intervals, and binary search identifies the selected interval."
},

{
    question: "Find Minimum in Rotated Sorted Array II",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the minimum value in a rotated sorted array that may contain duplicate values.",
    approach: "Compare the middle element with the right boundary. When equal, safely reduce the search range by one because duplicates make the direction ambiguous.",
    complexity: "Average: O(log n), Worst case: O(n), Space: O(1).",
    interview: "Duplicates can destroy the strict binary-search guarantee, so the worst case can become linear."
},

{
    question: "Search in Rotated Sorted Array II",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Search for a target in a rotated sorted array that may contain duplicate values.",
    approach: "Determine which half is sorted. If duplicates make the sorted half unclear, shrink the boundaries. Then decide which half can contain the target.",
    complexity: "Average: O(log n), Worst case: O(n), Space: O(1).",
    interview: "The key challenge is handling duplicates because they can make both halves appear identical."
},

{
    question: "Single Element in a Sorted Array",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the only element that appears once while every other element appears exactly twice in a sorted array.",
    approach: "Use the index parity pattern. Before the single element, pairs begin at even indices; after it, the pattern shifts. Binary search for the point where this pattern changes.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "The solution uses pair-position parity rather than searching for frequencies."
},

{
    question: "H-Index II",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the H-index of a researcher when citation counts are already sorted in ascending order.",
    approach: "Binary search for the first position where citations[i] is greater than or equal to the number of papers from that position onward.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "Sorting allows the H-index condition to become a monotonic binary-search predicate."
},

{
    question: "Successful Pairs of Spells and Potions",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "For each spell, count how many potions produce a product at least equal to a required success value.",
    approach: "Sort the potion strengths. For each spell, binary search the first potion whose strength is large enough to meet the required product.",
    complexity: "Time: O(n log m + m log m), Space: O(1) apart from sorting.",
    interview: "Sorting the potions allows every spell to be answered using a lower-bound binary search."
},

{
    question: "Minimum Number of Days to Eat N Oranges",
    difficulty: "Hard",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Find the minimum number of days required to eat n oranges when each day allows specific division and subtraction operations.",
    approach: "Use memoized recursion based on the nearest divisible values. For division operations, calculate the number of oranges that must first be removed to make n divisible.",
    complexity: "Approximately O(log n) distinct states with memoization, depending on the transitions.",
    interview: "This problem is primarily a DP/memoization problem, but it demonstrates how reducing the state space can make a huge input manageable."
},

{
    question: "Maximum Value at a Given Index in a Bounded Array",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "LeetCode",
    problem: "Construct an array under sum constraints and adjacent-difference restrictions while maximizing the value at a specific index.",
    approach: "Binary search the value at the target index. For every candidate value, calculate the minimum possible total sum required around it.",
    complexity: "Time: O(log maxSum), Space: O(1).",
    interview: "The main challenge is deriving a mathematical formula for the minimum sum around a chosen peak."
},

{
    question: "Nth Root of a Number",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Find the integer nth root of a given number when it exists.",
    approach: "Binary search the possible root from 1 to the number. Use a safe multiplication or exponentiation check to determine whether mid^n is equal to or less than the target.",
    complexity: "Time: O(log m × n), Space: O(1).",
    interview: "Binary search reduces the candidate roots exponentially while the power check verifies feasibility."
},

{
    question: "Floor and Ceil in a Sorted Array",
    difficulty: "Medium",
    topic: "Binary Search",
    platform: "GeeksforGeeks",
    problem: "Find the floor and ceil of a target value in a sorted array.",
    approach: "Use binary search to find the largest value less than or equal to the target and the smallest value greater than or equal to it.",
    complexity: "Time: O(log n), Space: O(1).",
    interview: "This problem is essentially about finding lower and upper bounds using binary search."
},

// ==================== SORTING — 30 QUESTIONS ====================

{
    question: "Bubble Sort",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array in ascending order using the Bubble Sort algorithm.",
    approach: "Repeatedly compare adjacent elements and swap them when they are in the wrong order. After every pass, the largest remaining element moves to its correct position.",
    complexity: "Average/Worst: O(n²), Best: O(n) with optimization, Space: O(1).",
    interview: "Bubble Sort is simple but inefficient for large datasets. Mention the optimized version that stops when no swaps occur."
},

{
    question: "Selection Sort",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array using Selection Sort by repeatedly selecting the smallest remaining element.",
    approach: "For every position, search the remaining unsorted portion for the minimum element and swap it with the current position.",
    complexity: "Time: O(n²), Space: O(1).",
    interview: "Selection Sort performs a fixed number of comparisons and performs relatively few swaps compared with Bubble Sort."
},

{
    question: "Insertion Sort",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array using Insertion Sort by building the sorted portion one element at a time.",
    approach: "Take each element and shift larger elements in the sorted portion to the right until the correct position for the current element is found.",
    complexity: "Average/Worst: O(n²), Best: O(n), Space: O(1).",
    interview: "Insertion Sort performs very well on small or nearly sorted arrays and is stable and in-place."
},

{
    question: "Merge Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array using the divide-and-conquer Merge Sort algorithm.",
    approach: "Divide the array into two halves recursively, sort both halves, and merge the two sorted halves into one sorted array.",
    complexity: "Time: O(n log n), Space: O(n).",
    interview: "Merge Sort guarantees O(n log n) time and is stable, but it requires additional memory for merging."
},

{
    question: "Quick Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array using the Quick Sort divide-and-conquer algorithm.",
    approach: "Choose a pivot and partition the array so smaller elements go to one side and larger elements to the other. Recursively sort both partitions.",
    complexity: "Average: O(n log n), Worst: O(n²), Space: O(log n) average recursion stack.",
    interview: "Pivot selection is important. Randomized or balanced pivots reduce the probability of worst-case behavior."
},

{
    question: "Heap Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array using a binary heap.",
    approach: "Build a max heap and repeatedly move the largest element to the end of the array, then restore the heap property.",
    complexity: "Time: O(n log n), Space: O(1).",
    interview: "Heap Sort provides guaranteed O(n log n) time and works in-place, although it is generally not stable."
},

{
    question: "Counting Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array of integers when the range of possible values is relatively small.",
    approach: "Create a frequency array for the possible values and reconstruct the sorted array according to those frequencies.",
    complexity: "Time: O(n + k), Space: O(k), where k is the value range.",
    interview: "Counting Sort does not compare elements. It is useful when the value range is small relative to the number of elements."
},

{
    question: "Radix Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort non-negative integers by processing their digits from least significant to most significant.",
    approach: "Use a stable sorting method such as Counting Sort for each digit position. Continue until the highest digit has been processed.",
    complexity: "Time: O(d × (n + k)), Space: O(n + k).",
    interview: "Radix Sort is useful when numbers have a limited number of digits and the intermediate digit sort is stable."
},

{
    question: "Bucket Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort values by distributing them into several buckets and individually sorting each bucket.",
    approach: "Map elements into buckets based on their value range. Sort each bucket and concatenate all buckets.",
    complexity: "Average: O(n + k), Worst: O(n²) depending on distribution and bucket sorting.",
    interview: "Bucket Sort works especially well when input values are uniformly distributed."
},

{
    question: "Sort an Array",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Sort an unsorted integer array in ascending order efficiently.",
    approach: "Use an efficient comparison-based sorting algorithm such as Merge Sort or Quick Sort. For guaranteed complexity, Merge Sort or Heap Sort can be used.",
    complexity: "Typical efficient solution: O(n log n) time.",
    interview: "Explain why O(n log n) comparison sorting is preferred for general-purpose sorting."
},

{
    question: "Sort Colors",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Sort an array containing only 0, 1 and 2 without using a standard sorting function.",
    approach: "Use the Dutch National Flag algorithm with low, mid and high pointers to partition the array into three sections.",
    complexity: "Time: O(n), Space: O(1).",
    interview: "This is a classic in-place three-way partitioning problem."
},

{
    question: "Merge Sorted Array",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Merge two sorted arrays into the first array, where the first array has enough space to contain both.",
    approach: "Start from the end of both arrays and place the larger element at the end of the first array. This avoids overwriting unprocessed values.",
    complexity: "Time: O(m + n), Space: O(1).",
    interview: "Processing from the back is the key because the destination array already contains its valid elements at the beginning."
},

{
    question: "Squares of a Sorted Array",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Return the squares of a sorted array in non-decreasing order.",
    approach: "Use two pointers at both ends because the largest absolute values can occur at either end. Place the larger square into the result from right to left.",
    complexity: "Time: O(n), Space: O(n) for the output.",
    interview: "Although the input is sorted, squaring can change the order, so compare absolute values from both ends."
},

{
    question: "Largest Number",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Arrange a list of non-negative integers to form the largest possible number when concatenated.",
    approach: "Convert numbers to strings and sort them using the comparator a+b > b+a. Concatenate the sorted strings.",
    complexity: "Time: O(n log n × k), Space: O(n).",
    interview: "The comparison is not based on numeric value. The correct ordering depends on which concatenation produces the larger result."
},

{
    question: "Relative Sort Array",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Sort one array according to the order specified by another array, placing remaining elements in ascending order.",
    approach: "Count frequencies of elements in the first array. Output elements according to the second array's order and then output remaining elements in sorted order.",
    complexity: "Time: O(n + m + k log k), Space: O(k).",
    interview: "Frequency counting makes the custom ordering straightforward."
},

{
    question: "Sort Characters By Frequency",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Sort characters in a string by decreasing frequency.",
    approach: "Count each character and sort characters according to their frequencies. A bucket approach can also be used for linear-time processing.",
    complexity: "Sorting approach: O(n log k), Space: O(k).",
    interview: "The main observation is that frequency, rather than alphabetical order, determines the final arrangement."
},

{
    question: "Meeting Rooms",
    difficulty: "Easy",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Determine whether a person can attend all meetings without any overlapping time intervals.",
    approach: "Sort meetings by starting time and compare each meeting's start time with the previous meeting's end time.",
    complexity: "Time: O(n log n), Space: O(1) apart from sorting.",
    interview: "Sorting transforms the overlap problem into a simple adjacent-interval comparison."
},

{
    question: "Meeting Rooms II",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Find the minimum number of meeting rooms required to accommodate all meetings.",
    approach: "Sort start and end times separately. Use two pointers to track when a meeting starts and when a room becomes free.",
    complexity: "Time: O(n log n), Space: O(n).",
    interview: "Another solution uses a min heap of meeting end times. Both approaches track active meetings."
},

{
    question: "Minimum Number of Arrows to Burst Balloons",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Find the minimum number of arrows required to burst all balloons represented by overlapping intervals.",
    approach: "Sort balloons by their ending coordinate. Shoot an arrow at the current end and reuse it for every overlapping balloon.",
    complexity: "Time: O(n log n), Space: O(1) apart from sorting.",
    interview: "The greedy strategy works because choosing the earliest ending interval gives the maximum chance of covering future intervals."
},

{
    question: "Non-overlapping Intervals",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Find the minimum number of intervals that must be removed so the remaining intervals do not overlap.",
    approach: "Sort intervals by their ending times and greedily keep the interval that ends earliest. Remove intervals that overlap with the selected interval.",
    complexity: "Time: O(n log n), Space: O(1) apart from sorting.",
    interview: "This is an interval scheduling problem. Keeping the earliest finishing interval leaves the most room for future intervals."
},

{
    question: "Merge Intervals",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Merge all overlapping intervals into non-overlapping intervals.",
    approach: "Sort intervals by starting time. Compare every interval with the last merged interval and extend its ending point whenever they overlap.",
    complexity: "Time: O(n log n), Space: O(n) for the output.",
    interview: "Sorting by start time ensures that all possible overlaps appear next to each other."
},

{
    question: "Insert Interval",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Insert a new interval into a sorted list of non-overlapping intervals and merge any overlapping intervals.",
    approach: "Add intervals that end before the new interval starts, merge all overlapping intervals, then append the remaining intervals.",
    complexity: "Time: O(n), Space: O(n) for the output.",
    interview: "Because the input is already sorted, a full sort is unnecessary."
},

{
    question: "Maximum Gap",
    difficulty: "Hard",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Find the maximum difference between consecutive elements after sorting an unsorted array.",
    approach: "The straightforward solution sorts the array. An advanced solution uses bucket partitioning to achieve linear time under the given constraints.",
    complexity: "Sorting approach: O(n log n); bucket approach: O(n) time and O(n) space.",
    interview: "Mention the bucket-based solution when the interviewer asks for linear time."
},

{
    question: "Wiggle Sort",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Rearrange an array so that nums[0] <= nums[1] >= nums[2] <= nums[3] and so on.",
    approach: "Sort the array and swap adjacent elements where necessary, or use a one-pass approach that swaps whenever the current relationship violates the required pattern.",
    complexity: "Time: O(n log n) with sorting, Space: O(1) apart from sorting.",
    interview: "The important part is maintaining alternating less-than and greater-than relationships."
},

{
    question: "Wiggle Sort II",
    difficulty: "Hard",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Rearrange an array so that nums[0] < nums[1] > nums[2] < nums[3] and so on.",
    approach: "Use median selection and virtual indexing to place smaller and larger elements in alternating positions.",
    complexity: "Average: O(n) time with selection; O(n log n) with sorting, Space depends on implementation.",
    interview: "Explain that Wiggle Sort II is harder because strict inequalities must be maintained even with duplicates."
},

{
    question: "Sort a Nearly Sorted Array",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Sort an array where every element is at most k positions away from its correct position.",
    approach: "Maintain a min heap containing the next k+1 elements. Extract the smallest element and insert the next input element.",
    complexity: "Time: O(n log k), Space: O(k).",
    interview: "The key observation is that the smallest next element must be within the next k+1 positions."
},

{
    question: "Kth Largest Element",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Find the kth largest element in an unsorted array.",
    approach: "Sort the array and access the kth largest position. For better average complexity, use Quickselect or a min heap of size k.",
    complexity: "Sorting: O(n log n); Quickselect average: O(n); Heap: O(n log k).",
    interview: "Knowing multiple approaches is useful. Choose Quickselect when average linear time is required."
},

{
    question: "Kth Smallest Element",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "GeeksforGeeks",
    problem: "Find the kth smallest element in an unsorted array.",
    approach: "Sorting gives a direct solution. A min heap, max heap or Quickselect can improve performance depending on constraints.",
    complexity: "Sorting: O(n log n); Quickselect average: O(n); Heap approach: O(n log k).",
    interview: "Discuss the trade-off between simplicity of sorting and the efficiency of selection algorithms."
},

{
    question: "Top K Frequent Elements",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Return the k most frequent elements from an integer array.",
    approach: "Count frequencies using a hash map and sort elements by frequency, or use a heap/bucket sort for better performance.",
    complexity: "Sorting approach: O(n log n); heap: O(n log k); bucket: O(n).",
    interview: "This problem combines frequency counting with selection. Choose the technique based on the required complexity."
},

{
    question: "Custom Sort String",
    difficulty: "Medium",
    topic: "Sorting",
    platform: "LeetCode",
    problem: "Reorder the characters of one string according to the custom ordering defined by another string.",
    approach: "Count frequencies of characters in the target string and output them according to the order string. Append characters not present in the custom order afterward.",
    complexity: "Time: O(n + k), Space: O(k).",
    interview: "Frequency counting is preferable to comparison sorting because the alphabet size is bounded."
},

// ==================== TWO POINTERS ====================

{
    id: "tp01",
    question: "Two Sum II - Input Array Is Sorted",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Given a 1-indexed sorted array, find two numbers that add up to a target value.",
    approach: "Use two pointers at the beginning and end. If the sum is smaller than target, move left forward; otherwise move right backward.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Because the array is sorted, two pointers allow us to find the pair in one pass without using extra space."
},

{
    id: "tp02",
    question: "3Sum",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find all unique triplets in an array whose sum is equal to zero.",
    approach: "Sort the array. Fix one element and use two pointers for the remaining portion. Skip duplicate values.",
    complexity: "Time: O(n²), Space: O(1) excluding output",
    interview: "Sorting allows the two-pointer technique to efficiently find pairs for each fixed element."
},

{
    id: "tp03",
    question: "3Sum Closest",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find three integers whose sum is closest to the given target.",
    approach: "Sort the array, fix one element, and use left and right pointers to search for the closest sum.",
    complexity: "Time: O(n²), Space: O(1)",
    interview: "After sorting, pointer movement is based on whether the current sum is smaller or larger than the target."
},

{
    id: "tp04",
    question: "Container With Most Water",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find two lines that together with the x-axis form a container containing the most water.",
    approach: "Start with pointers at both ends. Calculate area and move the pointer with the smaller height.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Moving the shorter line is necessary because the shorter height limits the container's area."
},

{
    id: "tp05",
    question: "Valid Palindrome",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Check whether a string is a palindrome after ignoring non-alphanumeric characters and case.",
    approach: "Use one pointer from the start and another from the end. Compare valid characters while moving inward.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Two pointers compare characters from opposite ends without creating a reversed copy."
},

{
    id: "tp06",
    question: "Reverse String",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Reverse an array of characters in-place.",
    approach: "Use left and right pointers and swap characters while moving both pointers toward the center.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The two-pointer approach reverses the array in-place using constant extra space."
},

{
    id: "tp07",
    question: "Move Zeroes",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Move all zeroes to the end of an array while maintaining the relative order of non-zero elements.",
    approach: "Use one pointer to track the position where the next non-zero element should be placed.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "A slow pointer maintains the next valid position while the fast pointer scans the array."
},

{
    id: "tp08",
    question: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Remove duplicates from a sorted array in-place and return the number of unique elements.",
    approach: "Use a slow pointer for the position of the next unique element and a fast pointer to scan the array.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Because the array is sorted, duplicates are adjacent, making two pointers sufficient."
},

{
    id: "tp09",
    question: "Remove Element",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Remove all occurrences of a given value from an array in-place.",
    approach: "Use a pointer to place elements that are different from the target value.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The technique overwrites unwanted values with valid values without requiring another array."
},

{
    id: "tp10",
    question: "Squares of a Sorted Array",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Return the squares of a sorted array in sorted non-decreasing order.",
    approach: "Use pointers at both ends because the largest absolute values can occur at either end. Fill the result from the back.",
    complexity: "Time: O(n), Space: O(n) for output",
    interview: "Comparing absolute values at both ends avoids sorting the squared values again."
},

{
    id: "tp11",
    question: "Merge Sorted Array",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Merge two sorted arrays into the first array in non-decreasing order.",
    approach: "Start from the end of both arrays and place the larger element at the end of the first array.",
    complexity: "Time: O(m+n), Space: O(1)",
    interview: "Working backwards prevents overwriting unprocessed elements in the first array."
},

{
    id: "tp12",
    question: "Intersection of Two Arrays",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find the unique elements that appear in both arrays.",
    approach: "Sort both arrays and use two pointers to compare their elements.",
    complexity: "Time: O(n log n + m log m), Space: O(1) excluding output",
    interview: "Sorting enables both arrays to be traversed efficiently with two pointers."
},

{
    id: "tp13",
    question: "Intersection of Two Arrays II",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find the intersection of two arrays including duplicate occurrences.",
    approach: "Sort both arrays and move pointers according to comparisons. When values match, add the value and move both pointers.",
    complexity: "Time: O(n log n + m log m), Space: O(1) excluding output",
    interview: "Two pointers correctly handle duplicate occurrences after sorting."
},

{
    id: "tp14",
    question: "Boats to Save People",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find the minimum number of boats needed when each boat can carry at most two people.",
    approach: "Sort weights. Pair the lightest and heaviest person if possible; otherwise send the heaviest alone.",
    complexity: "Time: O(n log n), Space: O(1) excluding sorting",
    interview: "Pairing the heaviest person with the lightest possible person maximizes the chance of using one boat."
},

{
    id: "tp15",
    question: "Sort Colors",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Sort an array containing only 0, 1, and 2 in-place.",
    approach: "Use the Dutch National Flag algorithm with low, mid, and high pointers.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Three pointers divide the array into regions for 0, 1, and 2 in one pass."
},

{
    id: "tp16",
    question: "Partition Labels",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Partition a string into as many parts as possible so that each character appears in only one part.",
    approach: "Store the last occurrence of each character and expand the current partition until all character occurrences are contained.",
    complexity: "Time: O(n), Space: O(1) for fixed alphabet",
    interview: "The right boundary is extended whenever a character appears later in the string."
},

{
    id: "tp17",
    question: "Long Pressed Name",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Determine whether a typed string could be produced from a name by long-pressing some keys.",
    approach: "Use two pointers to compare characters. Extra repeated characters in typed are allowed if they match the previous character.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The second string can contain repeated characters, but every non-repeated character must match the original name."
},

{
    id: "tp18",
    question: "Backspace String Compare",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Compare two strings after processing '#' as a backspace.",
    approach: "Traverse both strings backwards while maintaining the number of backspaces and skip deleted characters.",
    complexity: "Time: O(n+m), Space: O(1)",
    interview: "Backward traversal allows us to process backspaces without building extra strings."
},

{
    id: "tp19",
    question: "Is Subsequence",
    difficulty: "Easy",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Determine whether string s is a subsequence of string t.",
    approach: "Use one pointer for s and one for t. Whenever characters match, move the pointer in s.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "We only need to preserve the order of characters, so a greedy two-pointer scan works."
},

{
    id: "tp20",
    question: "Append Characters to String to Make Subsequence",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Find the minimum number of characters that need to be appended to s so that t becomes a subsequence.",
    approach: "Use two pointers and match as many characters of t as possible while scanning s.",
    complexity: "Time: O(n+m), Space: O(1)",
    interview: "The number of unmatched characters remaining in t is the answer."
},

{
    id: "tp21",
    question: "Number of Subsequences That Satisfy the Given Sum Condition",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Count subsequences where the sum of the minimum and maximum elements is less than or equal to the target.",
    approach: "Sort the array and use two pointers. If the minimum plus maximum is valid, all combinations between them are valid.",
    complexity: "Time: O(n log n), Space: O(n)",
    interview: "Sorting allows us to determine the maximum possible element for each minimum using two pointers."
},

{
    id: "tp22",
    question: "Pairs of Songs With Total Durations Divisible by 60",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Count pairs of songs whose total duration is divisible by 60.",
    approach: "Use remainder information to find complementary durations that sum to a multiple of 60.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Grouping durations by their remainder modulo 60 lets us find valid pairs efficiently."
},

{
    id: "tp23",
    question: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Calculate how much rainwater can be trapped between bars of different heights.",
    approach: "Use left and right pointers with leftMax and rightMax. Process the side with the smaller height.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Water level is controlled by the smaller boundary, allowing us to process one side safely at a time."
},

{
    id: "tp24",
    question: "Minimum Length of String After Deleting Similar Ends",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Repeatedly remove equal characters from both ends and return the minimum remaining length.",
    approach: "Use left and right pointers. While both ends contain the same character, move both pointers inward across that character.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Only equal characters at both ends can be removed, so two pointers naturally simulate the process."
},

{
    id: "tp25",
    question: "Reverse Words in a String",
    difficulty: "Medium",
    topic: "Two Pointers",
    platform: "LeetCode",
    problem: "Reverse the order of words in a string while removing extra spaces.",
    approach: "Trim extra spaces and process words from the end, using pointer-based traversal to identify word boundaries.",
    complexity: "Time: O(n), Space: O(n) for output",
    interview: "Two-pointer traversal can identify word boundaries while scanning the string without repeatedly splitting it."
},

// ==================== SLIDING WINDOW ====================

{
    id: "sw01",
    question: "Maximum Average Subarray I",
    difficulty: "Easy",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the contiguous subarray of length k with the maximum average value.",
    approach: "Calculate the sum of the first k elements, then slide the window by removing the left element and adding the next right element.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Instead of calculating every subarray sum from scratch, the sliding window reuses the previous sum."
},

{
    id: "sw02",
    question: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the minimum length of a contiguous subarray whose sum is greater than or equal to target.",
    approach: "Expand the right pointer until the sum reaches the target, then shrink the window from the left while maintaining the condition.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The window is expanded when the sum is too small and contracted when the required condition is satisfied."
},

{
    id: "sw03",
    question: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the length of the longest substring without repeating characters.",
    approach: "Use a sliding window with a Set. Expand the right pointer and remove characters from the left until all characters are unique.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "The sliding window maintains a substring with unique characters at all times."
},

{
    id: "sw04",
    question: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest substring that can be made to contain the same character after at most k replacements.",
    approach: "Maintain the frequency of characters and the maximum frequency inside the current window. Shrink when replacements needed exceed k.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "A valid window satisfies window length minus the most frequent character count <= k."
},

{
    id: "sw05",
    question: "Permutation in String",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Determine whether one string contains a permutation of another string.",
    approach: "Maintain a fixed-size sliding window equal to the length of the smaller string and compare character frequencies.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Every permutation has the same character frequency, so frequency comparison identifies valid windows."
},

{
    id: "sw06",
    question: "Find All Anagrams in a String",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find all starting indices of p's anagrams in string s.",
    approach: "Use a fixed-size window of length p and maintain character frequencies as the window moves.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Anagrams have identical character frequencies, so a fixed sliding window works efficiently."
},

{
    id: "sw07",
    question: "Minimum Window Substring",
    difficulty: "Hard",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the minimum substring of s that contains all characters of t.",
    approach: "Expand the right pointer until all required characters are present, then shrink from the left while keeping the window valid.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "The algorithm first creates a valid window and then minimizes it by moving the left pointer."
},

{
    id: "sw08",
    question: "Max Consecutive Ones III",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest subarray containing only 1s after flipping at most k zeroes.",
    approach: "Maintain a window containing at most k zeroes. When zero count exceeds k, move the left pointer.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The number of zeroes acts as the constraint for maintaining a valid window."
},

{
    id: "sw09",
    question: "Fruit Into Baskets",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest contiguous subarray containing at most two distinct values.",
    approach: "Use a frequency map and maintain a window with at most two different fruit types.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "This is a classic variable-size sliding window with a distinct-element constraint."
},

{
    id: "sw10",
    question: "Longest Subarray of 1's After Deleting One Element",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest subarray of 1s after deleting exactly one element.",
    approach: "Maintain a window containing at most one zero. The answer is window length minus one.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Allowing one zero inside the window simulates deleting that zero."
},

{
    id: "sw11",
    question: "Binary Subarrays With Sum",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Count binary subarrays whose sum equals a given goal.",
    approach: "For binary arrays, calculate subarrays with sum at most goal and subtract subarrays with sum at most goal - 1.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "exactly(goal) can be calculated as atMost(goal) - atMost(goal - 1)."
},

{
    id: "sw12",
    question: "Subarrays with K Different Integers",
    difficulty: "Hard",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Count subarrays containing exactly k distinct integers.",
    approach: "Use atMost(k) - atMost(k - 1), where atMost uses a sliding window with a frequency map.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "Counting exactly k distinct values directly is difficult, but the difference of two at-most counts solves it."
},

{
    id: "sw13",
    question: "Count Number of Nice Subarrays",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Count subarrays containing exactly k odd numbers.",
    approach: "Use the same atMost technique by treating odd numbers as the relevant elements.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Exactly k odd numbers can be calculated using atMost(k) - atMost(k - 1)."
},

{
    id: "sw14",
    question: "Number of Sub-arrays With Odd Sum",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Count the number of subarrays having an odd sum.",
    approach: "Track the parity of prefix sums. An odd subarray occurs when the current prefix parity differs from a previous prefix parity.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Only the parity of the prefix sum matters, reducing the problem to tracking even and odd counts."
},

{
    id: "sw15",
    question: "Maximum Number of Vowels in a Substring of Given Length",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the maximum number of vowels in any substring of length k.",
    approach: "Count vowels in the first window and then slide by removing the outgoing character and adding the incoming character.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Since every window has the same size, a fixed-size sliding window avoids repeated counting."
},

{
    id: "sw16",
    question: "Get Equal Substrings Within Budget",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the maximum length substring that can be changed from s to t within a given cost budget.",
    approach: "Calculate the character conversion cost and maintain a window whose total cost does not exceed the budget.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The window expands while the conversion cost is within budget and shrinks when it exceeds the budget."
},

{
    id: "sw17",
    question: "Grumpy Bookstore Owner",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Maximize the number of satisfied customers by using a secret technique for a fixed number of minutes.",
    approach: "Calculate normally satisfied customers and use a fixed sliding window to find the maximum additional customers that can be satisfied.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The technique affects a fixed-length interval, making a fixed sliding window appropriate."
},

{
    id: "sw18",
    question: "Maximize the Confusion of an Exam",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest substring that can be changed into all T or all F using at most k changes.",
    approach: "Run a sliding window while allowing at most k occurrences of the opposite character.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "A window is valid if the number of characters that must be changed does not exceed k."
},

{
    id: "sw19",
    question: "Longest Nice Subarray",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest subarray where every pair of elements has a bitwise AND equal to zero.",
    approach: "Maintain a bitmask representing the current window. Remove elements from the left until the new number has no overlapping set bits.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The bitmask efficiently represents which bits are already used inside the sliding window."
},

{
    id: "sw20",
    question: "Maximum Points You Can Obtain from Cards",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Choose exactly k cards from either end of the array to maximize the total score.",
    approach: "Instead of selecting k cards directly, find the minimum-sum subarray of length n-k and subtract it from the total sum.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The cards not selected form one contiguous middle window, which converts the problem into a sliding-window minimum."
},

{
    id: "sw21",
    question: "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the longest subarray where the difference between maximum and minimum elements is at most limit.",
    approach: "Use a sliding window with monotonic deques to maintain the current maximum and minimum.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Monotonic deques provide O(1) access to the minimum and maximum of the current window."
},

{
    id: "sw22",
    question: "Frequency of the Most Frequent Element",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "LeetCode",
    problem: "Find the maximum possible frequency of an element after performing at most k increments.",
    approach: "Sort the array and maintain a window where all elements can be increased to the largest element within budget.",
    complexity: "Time: O(n log n), Space: O(1) excluding sorting",
    interview: "After sorting, making smaller values equal to the largest value in the window can be evaluated using the window sum."
},

{
    id: "sw23",
    question: "Longest Substring with At Most K Distinct Characters",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "GeeksforGeeks",
    problem: "Find the length of the longest substring containing at most k distinct characters.",
    approach: "Use a frequency map and expand the window. If distinct characters exceed k, shrink from the left.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "The frequency map tracks the number of distinct characters currently present in the window."
},

{
    id: "sw24",
    question: "Smallest Window Containing All Characters",
    difficulty: "Hard",
    topic: "Sliding Window",
    platform: "GeeksforGeeks",
    problem: "Find the smallest window in a string that contains all characters of another string.",
    approach: "Maintain required character frequencies and expand the window until all characters are included, then shrink it.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "This is a standard variable-size sliding-window problem based on maintaining character frequencies."
},

{
    id: "sw25",
    question: "Longest Subarray with Sum K",
    difficulty: "Medium",
    topic: "Sliding Window",
    platform: "GeeksforGeeks",
    problem: "Find the longest subarray whose sum is equal to k when array elements are non-negative.",
    approach: "Use a sliding window. Expand the right pointer and shrink from the left whenever the sum exceeds k.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The sliding-window approach works directly because non-negative elements ensure that expanding increases the sum and shrinking decreases it."
},

// ==================== HASHING ====================

{
    id: "hash01",
    question: "Two Sum",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Find two indices whose values add up to the target.",
    approach: "Store previously seen values in a hash map. For each number, check whether target - number already exists.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Hashing reduces the lookup time from O(n) to O(1) on average."
},

{
    id: "hash02",
    question: "Contains Duplicate",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Determine whether an array contains any duplicate values.",
    approach: "Insert each element into a Set. If an element already exists, a duplicate is present.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "A Set stores unique values and provides average O(1) lookup."
},

{
    id: "hash03",
    question: "Valid Anagram",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Determine whether two strings are anagrams of each other.",
    approach: "Count the frequency of every character in both strings and compare the frequencies.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "Two strings are anagrams when every character occurs the same number of times."
},

{
    id: "hash04",
    question: "Group Anagrams",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Group strings that are anagrams of each other.",
    approach: "Use the sorted string or character-frequency representation as the hash map key.",
    complexity: "Time: O(n × k log k), Space: O(n × k)",
    interview: "All anagrams produce the same canonical representation, allowing them to be grouped together."
},

{
    id: "hash05",
    question: "Majority Element",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Find the element that appears more than n/2 times.",
    approach: "Store frequencies in a hash map and return the element whose count exceeds n/2.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Hashing provides a straightforward frequency-counting solution."
},

{
    id: "hash06",
    question: "First Unique Character in a String",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Find the index of the first character that appears exactly once.",
    approach: "First count character frequencies, then scan the string again to find the first character with frequency one.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "Two passes separate frequency calculation from finding the first unique character."
},

{
    id: "hash07",
    question: "Intersection of Two Arrays",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Return the unique intersection of two integer arrays.",
    approach: "Store elements of one array in a Set and check which elements from the second array exist in it.",
    complexity: "Time: O(n+m), Space: O(n)",
    interview: "A Set provides constant average-time membership checking."
},

{
    id: "hash08",
    question: "Intersection of Two Arrays II",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Return the intersection of two arrays while preserving duplicate occurrences.",
    approach: "Store frequencies of one array in a hash map and decrease the frequency when a matching element is found.",
    complexity: "Time: O(n+m), Space: O(n)",
    interview: "Frequency counting handles duplicates correctly."
},

{
    id: "hash09",
    question: "Subarray Sum Equals K",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Count the number of continuous subarrays whose sum equals k.",
    approach: "Maintain prefix sums and store their frequencies. If currentSum - k exists, those previous prefixes form valid subarrays.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Prefix-sum hashing converts the problem into a constant-time lookup for each position."
},

{
    id: "hash10",
    question: "Longest Consecutive Sequence",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Find the length of the longest consecutive sequence in an unsorted array.",
    approach: "Store all values in a Set. Start a sequence only when num - 1 does not exist.",
    complexity: "Time: O(n) average, Space: O(n)",
    interview: "The Set allows checking whether consecutive values exist in O(1) average time."
},

{
    id: "hash11",
    question: "Happy Number",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Determine whether repeatedly replacing a number by the sum of squares of its digits eventually reaches 1.",
    approach: "Use a Set to detect previously seen numbers. A repeated value indicates a cycle.",
    complexity: "Time: O(log n), Space: O(log n)",
    interview: "Hashing detects cycles in the sequence of generated numbers."
},

{
    id: "hash12",
    question: "Isomorphic Strings",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Determine whether two strings follow the same character mapping pattern.",
    approach: "Maintain mappings in both directions to ensure that each character maps uniquely.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "Two-way mapping prevents two different characters from mapping to the same character."
},

{
    id: "hash13",
    question: "Word Pattern",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Determine whether a string follows a given character pattern.",
    approach: "Map pattern characters to words and maintain a reverse mapping from words to characters.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Bidirectional mapping guarantees a one-to-one relationship."
},

{
    id: "hash14",
    question: "Top K Frequent Elements",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Return the k most frequent elements in an array.",
    approach: "Count frequencies using a hash map and use buckets or a heap to retrieve the most frequent elements.",
    complexity: "Time: O(n) with bucket sort, Space: O(n)",
    interview: "The hash map provides frequencies, while bucket sorting can achieve linear time."
},

{
    id: "hash15",
    question: "Longest Substring with At Most K Distinct Characters",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Find the longest substring containing at most k distinct characters.",
    approach: "Use a sliding window and hash map to maintain character frequencies.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "The hash map tracks how many distinct characters are currently inside the window."
},

{
    id: "hash16",
    question: "Longest Subarray with Equal Number of 0 and 1",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Find the longest subarray containing an equal number of zeroes and ones.",
    approach: "Treat 0 as -1 and 1 as +1. Store the first index of each prefix sum.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "If the same prefix sum occurs twice, the elements between those positions have a sum of zero."
},

{
    id: "hash17",
    question: "Longest Subarray with Sum Zero",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Find the length of the longest subarray whose sum is zero.",
    approach: "Maintain a running prefix sum and store the first occurrence of every sum.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Repeated prefix sums indicate that the elements between them have total sum zero."
},

{
    id: "hash18",
    question: "Count Distinct Elements in Every Window",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Find the number of distinct elements in every window of size k.",
    approach: "Use a frequency map for the current window. Add the incoming element and remove the outgoing element.",
    complexity: "Time: O(n), Space: O(k)",
    interview: "The frequency map lets us update the distinct count while sliding the window."
},

{
    id: "hash19",
    question: "Find All Pairs With a Given Sum",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Find pairs of elements whose sum equals a given target.",
    approach: "Store previously seen values in a hash map and look for target - current value.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Hashing avoids checking every possible pair."
},

{
    id: "hash20",
    question: "Find Itinerary from Tickets",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Reconstruct an itinerary from source-destination ticket pairs.",
    approach: "Create a hash map from source to destination and find the starting city that never appears as a destination.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The starting point is the city that has no incoming ticket."
},

{
    id: "hash21",
    question: "Count Pairs With Given Difference",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "GeeksforGeeks",
    problem: "Count pairs whose absolute difference equals a given value.",
    approach: "Store elements in a Set or frequency map and check for current + difference and current - difference.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Hashing allows constant average-time lookup for the required complementary value."
},

{
    id: "hash22",
    question: "Find Duplicate Subtrees",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Find all duplicate subtrees in a binary tree.",
    approach: "Serialize each subtree and store its frequency in a hash map. A subtree appearing for the second time is duplicate.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Hashing subtree representations lets us identify structurally identical subtrees."
},

{
    id: "hash23",
    question: "Design HashMap",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Design a basic hash map supporting put, get, and remove operations.",
    approach: "Use an array of buckets with a hash function. Handle collisions using chaining or another collision-resolution technique.",
    complexity: "Average Time: O(1), Space: O(n)",
    interview: "A hash function maps keys to buckets and collision handling allows multiple keys to share a bucket."
},

{
    id: "hash24",
    question: "Design HashSet",
    difficulty: "Easy",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Design a basic hash set supporting add, remove, and contains operations.",
    approach: "Use buckets and a hash function to determine where each value should be stored.",
    complexity: "Average Time: O(1), Space: O(n)",
    interview: "A hash set stores unique keys and provides fast average-time membership operations."
},

{
    id: "hash25",
    question: "LRU Cache",
    difficulty: "Medium",
    topic: "Hashing",
    platform: "LeetCode",
    problem: "Design a cache that removes the least recently used item when capacity is exceeded.",
    approach: "Combine a hash map for O(1) lookup with a doubly linked list for maintaining usage order.",
    complexity: "Time: O(1) average per operation, Space: O(capacity)",
    interview: "The hash map provides fast access while the doubly linked list maintains the least-recently-used order."
},

// ==================== LINKED LIST ====================

{
    id: "ll01",
    question: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Reverse a singly linked list.",
    approach: "Maintain previous, current, and next pointers. Reverse the current node's next pointer and move all pointers forward.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The iterative approach reverses links one by one using three pointers."
},

{
    id: "ll02",
    question: "Middle of the Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Find the middle node of a singly linked list.",
    approach: "Use a slow pointer moving one step and a fast pointer moving two steps.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "When the fast pointer reaches the end, the slow pointer is at the middle."
},

{
    id: "ll03",
    question: "Linked List Cycle",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Determine whether a linked list contains a cycle.",
    approach: "Use Floyd's slow and fast pointer algorithm. If they meet, a cycle exists.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The fast pointer eventually catches the slow pointer if a cycle exists."
},

{
    id: "ll04",
    question: "Linked List Cycle II",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Find the node where a cycle begins in a linked list.",
    approach: "First detect the cycle using slow and fast pointers. Then reset one pointer to the head and move both one step at a time.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "After the first meeting, moving both pointers at equal speed causes them to meet at the cycle entry."
},

{
    id: "ll05",
    question: "Merge Two Sorted Lists",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Merge two sorted linked lists into one sorted linked list.",
    approach: "Use a dummy node and compare the current nodes of both lists, attaching the smaller node each time.",
    complexity: "Time: O(n+m), Space: O(1)",
    interview: "The dummy node simplifies handling the head of the resulting list."
},

{
    id: "ll06",
    question: "Remove Linked List Elements",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Remove all nodes whose value equals a given value.",
    approach: "Use a dummy node and traverse the list, skipping nodes with the target value.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "A dummy node handles deletion of the original head uniformly."
},

{
    id: "ll07",
    question: "Remove Duplicates from Sorted List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Remove duplicate nodes from a sorted linked list.",
    approach: "Compare each node with the next node. If values are equal, skip the next node.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Because the list is sorted, duplicate values occur consecutively."
},

{
    id: "ll08",
    question: "Remove Nth Node From End of List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Remove the nth node from the end of a linked list.",
    approach: "Use two pointers with a gap of n nodes. Move both until the fast pointer reaches the end.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The fixed gap allows us to locate the node before the target in one traversal."
},

{
    id: "ll09",
    question: "Palindrome Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Determine whether a linked list is a palindrome.",
    approach: "Find the middle, reverse the second half, and compare both halves.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Reversing the second half allows palindrome comparison without using extra storage."
},

{
    id: "ll10",
    question: "Intersection of Two Linked Lists",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Find the node where two singly linked lists intersect.",
    approach: "Use two pointers. When one reaches the end, redirect it to the other list's head.",
    complexity: "Time: O(n+m), Space: O(1)",
    interview: "Switching heads makes both pointers travel the same total distance."
},

{
    id: "ll11",
    question: "Add Two Numbers",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Add two numbers represented by linked lists in reverse digit order.",
    approach: "Traverse both lists while maintaining a carry and create result nodes for each digit.",
    complexity: "Time: O(max(n,m)), Space: O(max(n,m)) for output",
    interview: "The linked-list representation allows digit-by-digit addition just like normal arithmetic."
},

{
    id: "ll12",
    question: "Swap Nodes in Pairs",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Swap every two adjacent nodes in a linked list.",
    approach: "Use a dummy node and rearrange pointers for each pair of nodes.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Only pointers are changed; node values do not need to be modified."
},

{
    id: "ll13",
    question: "Reverse Linked List II",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Reverse a linked list between positions left and right.",
    approach: "Move to the left position and reverse only the required portion using pointer manipulation.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Only the links inside the specified range are reversed."
},

{
    id: "ll14",
    question: "Rotate List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Rotate a linked list to the right by k positions.",
    approach: "Find the length, connect the tail to the head to form a cycle, then break the cycle at the correct position.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Making the list circular simplifies the rotation operation."
},

{
    id: "ll15",
    question: "Partition List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Rearrange a linked list so nodes smaller than x come before nodes greater than or equal to x.",
    approach: "Maintain two separate lists for smaller and larger nodes, then connect them.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Two temporary linked lists preserve the original relative order within each partition."
},

{
    id: "ll16",
    question: "Odd Even Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Group nodes at odd positions followed by nodes at even positions.",
    approach: "Maintain odd and even pointers and rearrange links while traversing the list.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The list is rearranged by modifying links instead of creating new nodes."
},

{
    id: "ll17",
    question: "Reorder List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Reorder a list as L0 → Ln → L1 → Ln-1 and so on.",
    approach: "Find the middle, reverse the second half, then merge the two halves alternately.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The problem combines three common linked-list techniques: middle finding, reversal, and merging."
},

{
    id: "ll18",
    question: "Sort List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Sort a linked list in ascending order.",
    approach: "Use merge sort by splitting the list into halves, recursively sorting them, and merging them.",
    complexity: "Time: O(n log n), Space: O(log n) recursion",
    interview: "Merge sort is suitable for linked lists because merging can be done by changing pointers."
},

{
    id: "ll19",
    question: "Merge k Sorted Lists",
    difficulty: "Hard",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Merge k sorted linked lists into one sorted linked list.",
    approach: "Use a min-heap containing the current node from each list, or merge lists pairwise.",
    complexity: "Time: O(n log k), Space: O(k)",
    interview: "A min-heap efficiently identifies the smallest current node among k lists."
},

{
    id: "ll20",
    question: "Copy List with Random Pointer",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Create a deep copy of a linked list where each node has a random pointer.",
    approach: "Use a hash map to map original nodes to copied nodes, then connect next and random pointers.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The map preserves the relationship between original and copied nodes."
},

{
    id: "ll21",
    question: "Design Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Design a linked list supporting insertion, deletion, and access operations.",
    approach: "Maintain node pointers and list size. Use traversal to reach the required position.",
    complexity: "Access: O(n), Insert/Delete: O(n) generally, Space: O(n)",
    interview: "The implementation demonstrates how linked-list nodes and pointer manipulation work internally."
},

{
    id: "ll22",
    question: "Flatten a Multilevel Doubly Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Flatten a multilevel doubly linked list into a single-level list.",
    approach: "Traverse the list and connect child lists between the current node and its next node.",
    complexity: "Time: O(n), Space: O(n) with recursion",
    interview: "Child lists are inserted directly into the main doubly linked list by updating pointers."
},

{
    id: "ll23",
    question: "Reverse Nodes in k-Group",
    difficulty: "Hard",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Reverse nodes of a linked list in groups of k.",
    approach: "Check whether k nodes are available, reverse that group, then recursively or iteratively process the remaining list.",
    complexity: "Time: O(n), Space: O(1) iterative",
    interview: "Each complete group is reversed independently while incomplete groups remain unchanged."
},

{
    id: "ll24",
    question: "Remove Duplicates from an Unsorted Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "GeeksforGeeks",
    problem: "Remove duplicate values from an unsorted linked list.",
    approach: "Use a Set to store values already seen and remove nodes whose values already exist.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "A hash set allows duplicate detection without sorting the linked list."
},

{
    id: "ll25",
    question: "Detect and Remove Loop in Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "GeeksforGeeks",
    problem: "Detect a loop in a linked list and remove it.",
    approach: "Detect the loop using slow and fast pointers, find the loop's starting point, then disconnect the final node of the loop.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Floyd's cycle detection algorithm finds the loop without extra memory."
},

{
    id: "ll26",
    question: "Find Length of Loop in Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "GeeksforGeeks",
    problem: "Find the number of nodes present in a cycle.",
    approach: "Detect the cycle using slow and fast pointers. Once they meet, traverse the cycle once to count its nodes.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "After detecting the meeting point, one complete traversal gives the cycle length."
},

{
    id: "ll27",
    question: "Pairwise Swap Elements of a Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "GeeksforGeeks",
    problem: "Swap adjacent nodes of a linked list in pairs.",
    approach: "Use pointer manipulation to swap each pair without changing node values.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The solution modifies links directly and handles odd-length lists naturally."
},

{
    id: "ll28",
    question: "Delete Middle of Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Delete the middle node of a singly linked list.",
    approach: "Use slow and fast pointers while maintaining a previous pointer to the slow node.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "The slow pointer identifies the middle while the previous pointer allows its removal."
},

{
    id: "ll29",
    question: "Maximum Twin Sum of a Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Find the maximum twin sum where the first node is paired with the last, second with second-last, and so on.",
    approach: "Find the middle, reverse the second half, then compare corresponding nodes.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Reversing the second half makes twin nodes align for a simple traversal."
},

{
    id: "ll30",
    question: "Merge In Between Linked Lists",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Replace a portion of one linked list with another linked list.",
    approach: "Find the nodes before and after the replacement range and connect them to the second list.",
    complexity: "Time: O(n+m), Space: O(1)",
    interview: "The operation can be completed by changing only a few next pointers."
},

{
    id: "ll31",
    question: "Add Two Numbers II",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Add two numbers represented by linked lists where digits are stored in forward order.",
    approach: "Use stacks to process digits from right to left and maintain carry while creating the result.",
    complexity: "Time: O(n+m), Space: O(n+m)",
    interview: "Stacks simulate reverse traversal because singly linked lists cannot move backward."
},

{
    id: "ll32",
    question: "Convert Binary Number in a Linked List to Integer",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Convert a binary number represented by a linked list into an integer.",
    approach: "Traverse the list and update the result using result = result * 2 + currentBit.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "Each new binary digit shifts the current result left by one position."
},

{
    id: "ll33",
    question: "Split Linked List in Parts",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Split a linked list into k consecutive parts with sizes as equal as possible.",
    approach: "Calculate the total length, determine base part size and distribute the remaining nodes among the first parts.",
    complexity: "Time: O(n+k), Space: O(k) for output",
    interview: "The difference between part sizes should never exceed one."
},

{
    id: "ll34",
    question: "Next Greater Node in Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "For each node, find the next node with a greater value.",
    approach: "Convert values to an array and use a monotonic decreasing stack to find the next greater element.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The monotonic stack efficiently finds the next greater value for every element."
},

{
    id: "ll35",
    question: "Insertion Sort List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Sort a linked list using insertion sort.",
    approach: "Maintain a sorted portion and insert each new node into its correct position.",
    complexity: "Time: O(n²), Space: O(1)",
    interview: "Insertion sort works naturally with linked lists because inserting a node only requires pointer changes."
},

{
    id: "ll36",
    question: "Delete Node in a Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Delete a given node from a singly linked list when the previous node is not provided.",
    approach: "Copy the next node's value into the current node and skip the next node.",
    complexity: "Time: O(1), Space: O(1)",
    interview: "Because the previous node is unavailable, we copy the next node's data and bypass it."
},

{
    id: "ll37",
    question: "Design Browser History",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Design browser history supporting visit, back, and forward operations.",
    approach: "Maintain previous and next relationships using a doubly linked structure or equivalent pointer representation.",
    complexity: "Visit: O(1), Back/Forward: O(k), Space: O(n)",
    interview: "A doubly linked structure naturally represents backward and forward browser navigation."
},

{
    id: "ll38",
    question: "All O(1) Data Structure",
    difficulty: "Hard",
    topic: "Linked List",
    platform: "LeetCode",
    problem: "Design a data structure supporting increment, decrement, and retrieving minimum or maximum keys in O(1).",
    approach: "Combine a hash map with a doubly linked list of frequency buckets.",
    complexity: "Average Time: O(1), Space: O(n)",
    interview: "The hash map provides direct access while the linked list maintains frequency order."
},

{
    id: "ll39",
    question: "Flatten a Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    platform: "GeeksforGeeks",
    problem: "Flatten a linked list where each node can point to another sorted list.",
    approach: "Recursively merge child lists using the same technique as merging two sorted linked lists.",
    complexity: "Time: O(n log n) depending on structure, Space: O(n) recursion",
    interview: "The core idea is repeatedly merging sorted linked lists into one sorted structure."
},

{
    id: "ll40",
    question: "Reverse a Doubly Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    platform: "GeeksforGeeks",
    problem: "Reverse a doubly linked list.",
    approach: "For every node, swap its next and previous pointers, then update the head.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "A doubly linked list can be reversed by swapping the two pointers of every node."
},

// ==================== STACK ====================

{
    id: "st01",
    question: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Determine whether brackets in a string are correctly matched and properly nested.",
    approach: "Push opening brackets onto a stack. For every closing bracket, check whether it matches the top of the stack.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "A stack follows LIFO, which makes it ideal for matching nested brackets."
},

{
    id: "st02",
    question: "Min Stack",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
    approach: "Maintain an additional stack containing the minimum value at each level.",
    complexity: "Time: O(1) per operation, Space: O(n)",
    interview: "The auxiliary stack keeps track of the current minimum without scanning the main stack."
},

{
    id: "st03",
    question: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Evaluate an arithmetic expression written in Reverse Polish Notation.",
    approach: "Push numbers onto a stack. When an operator appears, pop the required operands, calculate the result, and push it back.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Operands are naturally processed in LIFO order, making a stack suitable for postfix expressions."
},

{
    id: "st04",
    question: "Daily Temperatures",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "For each day, find how many days must pass before a warmer temperature occurs.",
    approach: "Use a monotonic decreasing stack of indices. When a warmer temperature appears, resolve previous indices.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The monotonic stack avoids repeatedly searching forward for the next warmer temperature."
},

{
    id: "st05",
    question: "Next Greater Element I",
    difficulty: "Easy",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Find the next greater element for every value in one array using another array.",
    approach: "Traverse the second array using a monotonic decreasing stack and store next greater values in a hash map.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The monotonic stack efficiently finds the next greater element while the map provides fast lookup."
},

{
    id: "st06",
    question: "Next Greater Element II",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Find the next greater element for every element in a circular array.",
    approach: "Traverse the array twice conceptually using modulo indexing and maintain a monotonic stack.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Traversing twice simulates the circular nature of the array."
},

{
    id: "st07",
    question: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Find the largest rectangular area that can be formed in a histogram.",
    approach: "Use a monotonic increasing stack of indices. When a smaller height appears, calculate areas for bars that can no longer extend.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The stack determines the nearest smaller boundaries for each histogram bar."
},

{
    id: "st08",
    question: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Calculate the amount of rainwater trapped between histogram-like bars.",
    approach: "Use a decreasing stack of indices. When a taller bar appears, calculate trapped water between the boundaries.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The stack stores bars that may act as boundaries for trapped water."
},

{
    id: "st09",
    question: "Remove All Adjacent Duplicates in String",
    difficulty: "Easy",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Repeatedly remove adjacent equal characters until no such pair remains.",
    approach: "Push characters onto a stack. If the current character equals the stack top, pop the top instead.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The stack naturally handles repeated removal because the newly exposed characters are immediately compared."
},

{
    id: "st10",
    question: "Remove All Adjacent Duplicates in String II",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Remove groups of k adjacent equal characters repeatedly.",
    approach: "Store each character with its current consecutive count. Remove the group whenever the count reaches k.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Keeping the frequency alongside each character allows duplicates to be removed efficiently."
},

{
    id: "st11",
    question: "Decode String",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Decode strings containing nested repetition patterns such as 3[a2[c]].",
    approach: "Use stacks for repetition counts and previous strings. When a closing bracket appears, construct the repeated substring.",
    complexity: "Time: O(n) excluding output expansion, Space: O(n)",
    interview: "Nested structures are naturally processed using LIFO behavior."
},

{
    id: "st12",
    question: "Simplify Path",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Simplify an absolute Unix-style file path.",
    approach: "Split the path by '/'. Push valid directory names and pop when '..' appears.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Stack operations correctly represent moving into and out of directories."
},

{
    id: "st13",
    question: "Asteroid Collision",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Simulate collisions between asteroids moving in opposite directions.",
    approach: "Use a stack to store surviving asteroids. Resolve collisions whenever a positive asteroid meets a negative asteroid.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Only the most recent surviving asteroid can collide with the incoming asteroid, matching stack behavior."
},

{
    id: "st14",
    question: "Basic Calculator II",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Evaluate an arithmetic expression containing non-negative integers and +, -, *, / operators.",
    approach: "Use a stack to handle multiplication and division immediately while storing terms for addition and subtraction.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The stack handles operator precedence without needing a full expression tree."
},

{
    id: "st15",
    question: "Basic Calculator",
    difficulty: "Hard",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Evaluate an expression containing integers, plus, minus, parentheses, and spaces.",
    approach: "Use a stack to save the current result and sign whenever an opening parenthesis is encountered.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The stack allows us to temporarily store the calculation state before entering parentheses."
},

{
    id: "st16",
    question: "Online Stock Span",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "For each day's stock price, calculate the number of consecutive previous days with price less than or equal to today's price.",
    approach: "Maintain a monotonic decreasing stack containing prices and their spans.",
    complexity: "Amortized Time: O(1) per operation, Space: O(n)",
    interview: "Each price is pushed and popped at most once, giving amortized constant time."
},

{
    id: "st17",
    question: "132 Pattern",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Determine whether an array contains a subsequence following the 132 pattern.",
    approach: "Traverse from right to left using a decreasing stack while tracking the best candidate for the middle value.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Reverse traversal and a monotonic stack allow the required ordering to be detected efficiently."
},

{
    id: "st18",
    question: "Maximum Frequency Stack",
    difficulty: "Hard",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Design a stack that removes the most frequent element, breaking ties by recency.",
    approach: "Use a frequency map and a map from frequency to stacks of values.",
    complexity: "Time: O(1) average per operation, Space: O(n)",
    interview: "Frequency buckets combined with stacks maintain both frequency and recency."
},

{
    id: "st19",
    question: "Make The String Great",
    difficulty: "Easy",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Remove adjacent pairs of the same letter in different cases until the string becomes valid.",
    approach: "Use a stack and remove the top character when it differs from the current character only by case.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Each removal can expose a new adjacent pair, which is naturally handled by a stack."
},

{
    id: "st20",
    question: "Final Prices With a Special Discount in a Shop",
    difficulty: "Easy",
    topic: "Stack",
    platform: "LeetCode",
    problem: "For each price, subtract the first following price that is less than or equal to it.",
    approach: "Use a monotonic stack to find the next smaller or equal price.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "This is a next smaller element problem that can be solved using a monotonic stack."
},

{
    id: "st21",
    question: "Remove K Digits",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Remove k digits from a number to create the smallest possible number.",
    approach: "Maintain a monotonic increasing stack and remove larger previous digits when a smaller digit appears.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Removing a larger digit before a smaller digit makes the number lexicographically smaller."
},

{
    id: "st22",
    question: "Validate Stack Sequences",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Determine whether a given pushed and popped sequence could represent valid stack operations.",
    approach: "Simulate pushes and pop whenever the stack top matches the next required popped value.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Direct simulation accurately models the LIFO behavior of a stack."
},

{
    id: "st23",
    question: "Min Add to Make Parentheses Valid",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Find the minimum number of parentheses that must be added to make a string valid.",
    approach: "Track unmatched opening parentheses and required opening parentheses for unmatched closing parentheses.",
    complexity: "Time: O(n), Space: O(1)",
    interview: "A balance counter is enough because only unmatched parentheses matter."
},

{
    id: "st24",
    question: "Minimum Remove to Make Valid Parentheses",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Remove the minimum number of parentheses to make a string valid.",
    approach: "Use a stack of indices for unmatched opening parentheses and mark invalid closing parentheses for removal.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Storing indices lets us identify exactly which parentheses must be removed."
},

{
    id: "st25",
    question: "Score of Parentheses",
    difficulty: "Medium",
    topic: "Stack",
    platform: "LeetCode",
    problem: "Calculate the score of a balanced parentheses string.",
    approach: "Use a stack to store scores of nested groups and combine them when closing parentheses are encountered.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Nested parentheses require storing the score of the previous outer level."
},

{
    id: "st26",
    question: "Evaluate Postfix Expression",
    difficulty: "Easy",
    topic: "Stack",
    platform: "GeeksforGeeks",
    problem: "Evaluate an arithmetic expression given in postfix notation.",
    approach: "Push operands onto a stack and apply each operator to the top two operands.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Postfix notation removes the need for parentheses because stack order determines operand evaluation."
},

{
    id: "st27",
    question: "Infix to Postfix",
    difficulty: "Medium",
    topic: "Stack",
    platform: "GeeksforGeeks",
    problem: "Convert an infix arithmetic expression into postfix notation.",
    approach: "Use a stack for operators and output operands directly while respecting operator precedence and parentheses.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The stack temporarily stores operators until they can be safely placed in the postfix expression."
},

{
    id: "st28",
    question: "Infix to Prefix",
    difficulty: "Medium",
    topic: "Stack",
    platform: "GeeksforGeeks",
    problem: "Convert an infix expression into prefix notation.",
    approach: "Reverse the expression, swap parentheses, convert to postfix, and reverse the result.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "Stack-based operator precedence handling makes the conversion systematic."
},

{
    id: "st29",
    question: "Stock Span Problem",
    difficulty: "Medium",
    topic: "Stack",
    platform: "GeeksforGeeks",
    problem: "Find the span of each stock price, defined as the number of consecutive previous days with price less than or equal to today's price.",
    approach: "Maintain a monotonic decreasing stack of indices and remove smaller prices before calculating the span.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The monotonic stack ensures each element is pushed and popped at most once."
},

{
    id: "st30",
    question: "Celebrity Problem",
    difficulty: "Medium",
    topic: "Stack",
    platform: "GeeksforGeeks",
    problem: "Find a person who is known by everyone but knows nobody.",
    approach: "Push all people into a stack and eliminate candidates by checking who knows whom. Verify the final candidate.",
    complexity: "Time: O(n), Space: O(n)",
    interview: "The elimination process reduces the candidates to one possible celebrity, which must then be verified."
},

// ==================== QUEUE / DEQUE ====================

{
    id: "q01",
    question: "Implement Queue using Stacks",
    difficulty: "Easy",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Implement a FIFO queue using only two stacks.",
    approach: "Use two stacks: input and output. Push elements into the input stack. For pop or peek, transfer elements to the output stack when it is empty.",
    complexity: "Amortized O(1) for each operation, O(n) space.",
    interview: "A queue follows FIFO, while a stack follows LIFO. Two stacks can simulate FIFO by reversing the order of elements."
},

{
    id: "q02",
    question: "Design Circular Queue",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Design a circular queue with fixed capacity supporting enqueue, dequeue, front and rear operations.",
    approach: "Use an array with front, rear and size variables. Use modulo arithmetic to wrap the rear and front positions.",
    complexity: "O(1) per operation and O(k) space.",
    interview: "A circular queue reuses empty spaces by connecting the last position back to the first position."
},

{
    id: "q03",
    question: "Number of Recent Calls",
    difficulty: "Easy",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Count the number of requests received in the last 3000 milliseconds.",
    approach: "Store request timestamps in a queue. Add the current timestamp and remove all timestamps smaller than t - 3000.",
    complexity: "Amortized O(1) per request and O(n) space.",
    interview: "This is a classic sliding-window problem where a queue efficiently removes expired timestamps from the front."
},

{
    id: "q04",
    question: "Dota2 Senate",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Determine which party will eventually win based on senators banning other senators.",
    approach: "Maintain two queues containing the indices of senators from each party. Compare the front indices and reinsert the senator that gets another turn later.",
    complexity: "O(n) time and O(n) space.",
    interview: "Queues are useful because senators act in their original cyclic order."
},

{
    id: "q05",
    question: "Time Needed to Buy Tickets",
    difficulty: "Easy",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Calculate how much time is required for a specific person to buy all their tickets.",
    approach: "Simulate the queue by processing people one ticket at a time until the target person receives all required tickets.",
    complexity: "O(n × k) in the direct simulation and O(n) extra space.",
    interview: "The problem follows FIFO behavior because people receive tickets in circular queue order."
},

{
    id: "q06",
    question: "Rotting Oranges",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Find the minimum time required for all fresh oranges to become rotten.",
    approach: "Use multi-source BFS. Put all rotten oranges into a queue initially and process neighboring fresh oranges level by level.",
    complexity: "O(m × n) time and O(m × n) space.",
    interview: "Multi-source BFS is ideal because all initially rotten oranges spread simultaneously."
},

{
    id: "q07",
    question: "Number of Islands",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Count the number of connected islands in a binary grid.",
    approach: "Whenever an unvisited land cell is found, start BFS using a queue and mark all connected land cells as visited.",
    complexity: "O(m × n) time and O(m × n) space.",
    interview: "BFS explores all cells belonging to one connected component before moving to another island."
},

{
    id: "q08",
    question: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Return the nodes of a binary tree level by level.",
    approach: "Use a queue. Add the root, then repeatedly remove nodes and add their left and right children.",
    complexity: "O(n) time and O(n) space.",
    interview: "Level order traversal is a direct application of BFS using a queue."
},

{
    id: "q09",
    question: "Binary Tree Zigzag Level Order Traversal",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Traverse a binary tree level by level while alternating the direction of each level.",
    approach: "Use BFS with a queue and reverse the values of every alternate level.",
    complexity: "O(n) time and O(n) space.",
    interview: "The queue maintains BFS order while an additional direction flag handles alternating traversal."
},

{
    id: "q10",
    question: "Perfect Squares",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Find the least number of perfect square numbers that sum to n.",
    approach: "Treat every number as a graph node and use BFS. From a number, move to values obtained by subtracting perfect squares.",
    complexity: "Approximately O(n√n) time and O(n) space.",
    interview: "BFS finds the shortest path, so the first time we reach zero gives the minimum number of squares."
},

{
    id: "q11",
    question: "Open the Lock",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Find the minimum number of wheel rotations required to reach a target combination.",
    approach: "Use BFS starting from 0000. Each state has up to eight neighboring combinations obtained by rotating one digit.",
    complexity: "O(10^4) time and O(10^4) space.",
    interview: "Every lock combination is treated as a graph state, and BFS guarantees the minimum number of moves."
},

{
    id: "q12",
    question: "Sliding Window Maximum",
    difficulty: "Hard",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Find the maximum value in every window of size k.",
    approach: "Use a monotonic deque storing indices in decreasing order of their values. Remove indices outside the current window.",
    complexity: "O(n) time and O(k) space.",
    interview: "A monotonic deque allows the maximum element of every sliding window to be accessed in O(1)."
},

{
    id: "q13",
    question: "First Negative Integer in Every Window",
    difficulty: "Medium",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Find the first negative number in every window of size k.",
    approach: "Maintain a queue containing indices of negative elements. Remove indices that leave the current window.",
    complexity: "O(n) time and O(k) space.",
    interview: "The queue stores only relevant negative elements, allowing the first negative number to be found efficiently."
},

{
    id: "q14",
    question: "Generate Binary Numbers from 1 to N",
    difficulty: "Easy",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Generate binary representations of numbers from 1 to N using a queue.",
    approach: "Start with '1'. Remove the front string and append '0' and '1' to generate the next binary numbers.",
    complexity: "O(n) time and O(n) space.",
    interview: "A queue naturally generates binary numbers level by level."
},

{
    id: "q15",
    question: "Circular Tour",
    difficulty: "Medium",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Find the starting petrol pump from which a truck can complete a circular tour.",
    approach: "Track current petrol and total petrol. If current petrol becomes negative, move the starting position forward.",
    complexity: "O(n) time and O(1) space.",
    interview: "The key idea is that if a starting point fails, every point before the failure cannot be a valid starting point."
},

{
    id: "q16",
    question: "Interleave First Half of Queue with Second Half",
    difficulty: "Medium",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Interleave the first half of a queue with the second half.",
    approach: "Move the first half into a temporary queue and then alternately insert elements from both halves.",
    complexity: "O(n) time and O(n) space.",
    interview: "A temporary queue helps preserve the order of the first half while elements are interleaved."
},

{
    id: "q17",
    question: "Reverse First K Elements of Queue",
    difficulty: "Medium",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Reverse the first k elements of a queue while keeping the remaining elements unchanged.",
    approach: "Remove the first k elements and push them into a stack. Add them back from the stack and rotate the remaining elements.",
    complexity: "O(n) time and O(k) space.",
    interview: "A stack reverses the first k elements because it follows LIFO order."
},

{
    id: "q18",
    question: "Queue Using Linked List",
    difficulty: "Easy",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Implement a queue using a linked list.",
    approach: "Maintain front and rear pointers. Insert new nodes at the rear and remove nodes from the front.",
    complexity: "O(1) enqueue and O(1) dequeue with O(n) total space.",
    interview: "A linked list avoids fixed-size limitations of arrays and supports constant-time insertion and deletion with front and rear pointers."
},

{
    id: "q19",
    question: "Implement Stack Using Queues",
    difficulty: "Easy",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Implement a LIFO stack using one or more FIFO queues.",
    approach: "Use a queue and rearrange elements after every push so that the newest element remains at the front.",
    complexity: "O(n) push and O(1) pop, with O(n) space.",
    interview: "The queue's FIFO behavior can be transformed into LIFO behavior by rotating the existing elements."
},

{
    id: "q20",
    question: "Breadth First Search of a Graph",
    difficulty: "Easy",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Traverse a graph using Breadth First Search.",
    approach: "Start from a source vertex, mark it visited, insert it into a queue and process its unvisited neighbors.",
    complexity: "O(V + E) time and O(V) space.",
    interview: "BFS uses a queue to visit vertices in increasing distance from the source."
},

{
    id: "q21",
    question: "Walls and Gates",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Fill every empty room with the distance to its nearest gate.",
    approach: "Place all gates in the queue initially and perform multi-source BFS to calculate minimum distances.",
    complexity: "O(m × n) time and O(m × n) space.",
    interview: "Starting BFS from all gates simultaneously ensures that the first distance assigned to a room is its shortest distance to any gate."
},

{
    id: "q22",
    question: "01 Matrix",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Find the distance of each cell to the nearest zero.",
    approach: "Add all zero cells to a queue and perform multi-source BFS to update neighboring one cells.",
    complexity: "O(m × n) time and O(m × n) space.",
    interview: "Multi-source BFS efficiently calculates the shortest distance from every cell to the nearest zero."
},

{
    id: "q23",
    question: "Shortest Path in Binary Matrix",
    difficulty: "Medium",
    topic: "Queue",
    platform: "LeetCode",
    problem: "Find the shortest clear path from the top-left cell to the bottom-right cell.",
    approach: "Use BFS because every movement has equal cost. Add valid neighboring cells to the queue and store their distances.",
    complexity: "O(n²) time and O(n²) space.",
    interview: "BFS guarantees the shortest path in an unweighted grid because every edge has equal cost."
},

{
    id: "q24",
    question: "Snake and Ladder Problem",
    difficulty: "Medium",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "Find the minimum number of dice throws required to reach the final cell.",
    approach: "Treat board positions as graph nodes. Use BFS where each dice throw represents edges to up to six positions.",
    complexity: "O(n) time and O(n) space.",
    interview: "BFS finds the minimum number of dice throws because every throw has equal cost."
},

{
    id: "q25",
    question: "First Non-Repeating Character in a Stream",
    difficulty: "Medium",
    topic: "Queue",
    platform: "GeeksforGeeks",
    problem: "For every character in a stream, find the first character that has appeared only once so far.",
    approach: "Use a frequency array or map and a queue. Add each character to the queue and remove characters from the front while their frequency becomes greater than one.",
    complexity: "O(n) time and O(n) space.",
    interview: "The queue preserves the order of characters while the frequency map determines whether each character is still non-repeating."
},

// ==================== RECURSION & BACKTRACKING ====================

{
    id: "rec01", question: "Fibonacci Number", difficulty: "Easy", topic: "Recursion", platform: "LeetCode",
    problem: "Find the nth Fibonacci number using recursion.",
    approach: "Use the recurrence F(n)=F(n-1)+F(n-2), with base cases 0 and 1.",
    complexity: "O(2^n) time and O(n) recursion space.",
    interview: "Recursion breaks the problem into two smaller Fibonacci subproblems."
},
{
    id: "rec02", question: "Factorial Using Recursion", difficulty: "Easy", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Calculate factorial of a number recursively.",
    approach: "Return 1 for 0 or 1; otherwise return n multiplied by factorial(n-1).",
    complexity: "O(n) time and O(n) space.",
    interview: "Each recursive call reduces n by one until reaching the base case."
},
{
    id: "rec03", question: "Power of a Number", difficulty: "Easy", topic: "Recursion", platform: "LeetCode",
    problem: "Calculate x raised to the power n.",
    approach: "Use recursive exponentiation by squaring to reduce the number of multiplications.",
    complexity: "O(log n) time and O(log n) space.",
    interview: "Exponentiation by squaring divides the exponent by two at every step."
},
{
    id: "rec04", question: "Sum of Natural Numbers", difficulty: "Easy", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Find the sum of first n natural numbers recursively.",
    approach: "Return n + sum(n-1), with zero as the base case.",
    complexity: "O(n) time and O(n) space.",
    interview: "The problem reduces n until reaching zero."
},
{
    id: "rec05", question: "Reverse a String Recursively", difficulty: "Easy", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Reverse a string using recursion.",
    approach: "Recursively process the substring after the first character and append the first character at the end.",
    complexity: "O(n²) with string copying, O(n) recursion space.",
    interview: "Recursion processes the smaller substring and rebuilds the reversed result."
},
{
    id: "rec06", question: "Palindrome Check Using Recursion", difficulty: "Easy", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Check whether a string is a palindrome recursively.",
    approach: "Compare characters at both ends and recursively check the inner substring.",
    complexity: "O(n) time and O(n) space.",
    interview: "If the outer characters match, the same condition is checked for the inner portion."
},
{
    id: "rec07", question: "Tower of Hanoi", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Move n disks from one rod to another using an auxiliary rod.",
    approach: "Move n-1 disks to auxiliary, move the largest disk, then move n-1 disks to destination.",
    complexity: "O(2^n) time and O(n) recursion space.",
    interview: "The solution naturally follows a recursive divide-and-conquer structure."
},
{
    id: "rec08", question: "Generate Parentheses", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all valid combinations of n pairs of parentheses.",
    approach: "Backtrack while tracking the number of open and close parentheses used.",
    complexity: "O(4^n / √n) time approximately and O(n) recursion space excluding output.",
    interview: "Only add ')' when close count is smaller than open count to maintain validity."
},
{
    id: "rec09", question: "Subsets", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all subsets of an array.",
    approach: "For each element, recursively choose either to include it or exclude it.",
    complexity: "O(2^n) time and O(n) recursion space excluding output.",
    interview: "Every element creates two choices: include or exclude."
},
{
    id: "rec10", question: "Subsets II", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all unique subsets when the array contains duplicates.",
    approach: "Sort the array and skip duplicate elements at the same recursion level.",
    complexity: "O(2^n) time and O(n) recursion space excluding output.",
    interview: "Sorting allows duplicate branches to be skipped."
},
{
    id: "rec11", question: "Permutations", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all permutations of an array.",
    approach: "Choose an unused element at each recursion level and backtrack after completing a permutation.",
    complexity: "O(n × n!) time and O(n) recursion space excluding output.",
    interview: "Backtracking explores every possible ordering."
},
{
    id: "rec12", question: "Permutations II", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate unique permutations when duplicate elements exist.",
    approach: "Sort the array and skip duplicate choices when the previous identical element has not been used.",
    complexity: "O(n × n!) worst-case time and O(n) space.",
    interview: "Sorting plus duplicate skipping prevents repeated permutations."
},
{
    id: "rec13", question: "Combination Sum", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Find combinations of numbers that add up to a target.",
    approach: "Use backtracking and allow the same candidate to be selected multiple times.",
    complexity: "Exponential time in the worst case.",
    interview: "The recursion explores take and skip choices while tracking the remaining target."
},
{
    id: "rec14", question: "Combination Sum II", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Find unique combinations that sum to target, with each number used once.",
    approach: "Sort candidates and skip duplicates at the same recursion level.",
    complexity: "O(2^n) worst-case time.",
    interview: "Sorting helps avoid duplicate combinations."
},
{
    id: "rec15", question: "Combinations", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all combinations of k numbers from 1 to n.",
    approach: "Backtrack by selecting increasing numbers until k elements are chosen.",
    complexity: "O(C(n,k) × k) time.",
    interview: "Increasing indices ensure that each combination is generated only once."
},
{
    id: "rec16", question: "Letter Combinations of a Phone Number", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all possible letter combinations represented by digits on a phone keypad.",
    approach: "Recursively select one letter for each digit.",
    complexity: "O(4^n × n) time and O(n) recursion space.",
    interview: "Each digit creates multiple branching choices."
},
{
    id: "rec17", question: "Palindrome Partitioning", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Partition a string so every substring is a palindrome.",
    approach: "Try every possible substring starting at the current index and recursively process the remaining string.",
    complexity: "Exponential time.",
    interview: "Backtracking explores every possible partition."
},
{
    id: "rec18", question: "Word Search", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Determine whether a word exists in a character grid.",
    approach: "Run DFS from matching cells and mark cells as visited during the current path.",
    complexity: "O(m × n × 4^L) time and O(L) recursion space.",
    interview: "DFS with backtracking explores all possible paths."
},
{
    id: "rec19", question: "N-Queens", difficulty: "Hard", topic: "Recursion", platform: "LeetCode",
    problem: "Place n queens on an n×n chessboard so no two queens attack each other.",
    approach: "Place one queen per row and backtrack whenever a column or diagonal is already occupied.",
    complexity: "O(n!) approximately.",
    interview: "Backtracking eliminates invalid board configurations as early as possible."
},
{
    id: "rec20", question: "N-Queens II", difficulty: "Hard", topic: "Recursion", platform: "LeetCode",
    problem: "Count the number of valid N-Queens arrangements.",
    approach: "Use the same backtracking strategy as N-Queens but count valid configurations.",
    complexity: "O(n!) approximately.",
    interview: "The algorithm explores possible queen placements row by row."
},
{
    id: "rec21", question: "Sudoku Solver", difficulty: "Hard", topic: "Recursion", platform: "LeetCode",
    problem: "Solve a partially filled 9×9 Sudoku board.",
    approach: "Try valid digits in empty cells and backtrack when a choice leads to an invalid configuration.",
    complexity: "Exponential worst-case time and O(81) recursion space.",
    interview: "Constraint checking combined with backtracking solves the puzzle."
},
{
    id: "rec22", question: "Rat in a Maze", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Find paths for a rat to travel from source to destination in a maze.",
    approach: "Use DFS and backtrack after exploring each valid direction.",
    complexity: "Exponential time in the worst case.",
    interview: "Each cell creates multiple possible paths, making backtracking suitable."
},
{
    id: "rec23", question: "M-Coloring Problem", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Determine whether a graph can be colored using at most m colors.",
    approach: "Assign colors recursively and reject a color if an adjacent vertex already has it.",
    complexity: "O(m^V) worst-case time.",
    interview: "Backtracking tries colors and immediately rejects invalid assignments."
},
{
    id: "rec24", question: "Graph Coloring", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Color graph vertices so adjacent vertices have different colors.",
    approach: "Use recursive assignment with validity checks against already colored neighbors.",
    complexity: "O(m^V) worst-case.",
    interview: "The problem is a classic constraint satisfaction problem."
},
{
    id: "rec25", question: "Kth Symbol in Grammar", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Find the kth symbol in the nth row of a recursively generated grammar.",
    approach: "Map k to its parent position in the previous row and determine whether the current half flips the value.",
    complexity: "O(log k) time and O(log k) space.",
    interview: "Each level reduces the problem size by half."
},
{
    id: "rec26", question: "Different Ways to Add Parentheses", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Return all possible results from computing an arithmetic expression using different parentheses.",
    approach: "Split the expression around every operator and recursively calculate left and right results.",
    complexity: "Exponential time.",
    interview: "Each operator can divide the expression into independent subexpressions."
},
{
    id: "rec27", question: "Beautiful Arrangement", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Count permutations where every position satisfies a divisibility condition.",
    approach: "Backtrack through unused numbers and check the validity condition at each position.",
    complexity: "O(n!) worst-case.",
    interview: "Invalid choices are rejected before completing the permutation."
},
{
    id: "rec28", question: "Letter Tile Possibilities", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Count all possible non-empty sequences that can be made from letter tiles.",
    approach: "Use frequency counting and recursively choose every available character.",
    complexity: "Exponential time.",
    interview: "Frequency counting avoids generating identical sequences."
},
{
    id: "rec29", question: "Combination Sum III", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Find combinations of k distinct numbers from 1 to 9 whose sum equals n.",
    approach: "Backtrack using increasing numbers while tracking count and remaining sum.",
    complexity: "O(2^9) time.",
    interview: "The small fixed search space makes backtracking effective."
},
{
    id: "rec30", question: "Restore IP Addresses", difficulty: "Medium", topic: "Recursion", platform: "LeetCode",
    problem: "Generate all valid IP addresses from a digit string.",
    approach: "Choose one to three digits for each of four segments and validate each segment.",
    complexity: "O(3^4) bounded search.",
    interview: "Backtracking explores possible segment lengths while validating constraints."
},
{
    id: "rec31", question: "Generate Binary Strings", difficulty: "Easy", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Generate all binary strings of length n.",
    approach: "At each position choose either 0 or 1 recursively.",
    complexity: "O(2^n) time.",
    interview: "Every position has two independent choices."
},
{
    id: "rec32", question: "Tower of Hanoi Iterative vs Recursive", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Understand recursive and iterative approaches to Tower of Hanoi.",
    approach: "Recursive solution divides the problem into two n-1 disk problems around one largest-disk move.",
    complexity: "O(2^n) time.",
    interview: "The recursive formulation directly follows the mathematical structure of the problem."
},
{
    id: "rec33", question: "Josephus Problem", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Find the survivor when every kth person is eliminated in a circle.",
    approach: "Use the recurrence J(n,k) = (J(n-1,k)+k)%n.",
    complexity: "O(n) time and O(n) recursion space.",
    interview: "Removing one person transforms the problem into a smaller Josephus problem."
},
{
    id: "rec34", question: "Recursive Binary Search", difficulty: "Easy", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Search an element in a sorted array recursively.",
    approach: "Compare the middle element and recursively search the appropriate half.",
    complexity: "O(log n) time and O(log n) space.",
    interview: "Each recursive call halves the search space."
},
{
    id: "rec35", question: "Recursive Merge Sort", difficulty: "Medium", topic: "Recursion", platform: "GeeksforGeeks",
    problem: "Sort an array using recursive merge sort.",
    approach: "Divide the array into halves, recursively sort both halves and merge them.",
    complexity: "O(n log n) time and O(n) auxiliary space.",
    interview: "Merge sort is a divide-and-conquer algorithm."
},

// ==================== TREES ====================

{
    id: "tree01", question: "Binary Tree Preorder Traversal", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Return nodes of a binary tree in preorder.",
    approach: "Visit root, left subtree, then right subtree using recursion or a stack.",
    complexity: "O(n) time and O(h) space.",
    interview: "Preorder follows Root-Left-Right."
},
{
    id: "tree02", question: "Binary Tree Inorder Traversal", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Return nodes of a binary tree in inorder.",
    approach: "Visit left subtree, root, then right subtree.",
    complexity: "O(n) time and O(h) space.",
    interview: "Inorder traversal of a BST produces sorted order."
},
{
    id: "tree03", question: "Binary Tree Postorder Traversal", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Return nodes in postorder.",
    approach: "Visit left subtree, right subtree, then root.",
    complexity: "O(n) time and O(h) space.",
    interview: "Postorder follows Left-Right-Root."
},
{
    id: "tree04", question: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Find the maximum depth of a binary tree.",
    approach: "Recursively calculate left and right subtree heights and return 1 plus the maximum.",
    complexity: "O(n) time and O(h) space.",
    interview: "Tree height is one plus the maximum height of its children."
},
{
    id: "tree05", question: "Same Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Check whether two binary trees are identical.",
    approach: "Recursively compare corresponding nodes and their subtrees.",
    complexity: "O(n) time and O(h) space.",
    interview: "Two trees are equal when corresponding values and structures match."
},
{
    id: "tree06", question: "Symmetric Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Check whether a binary tree is symmetric around its center.",
    approach: "Compare left subtree with the mirror image of the right subtree.",
    complexity: "O(n) time and O(h) space.",
    interview: "Mirror comparison checks opposite children recursively."
},
{
    id: "tree07", question: "Invert Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Invert a binary tree.",
    approach: "Swap left and right children recursively for every node.",
    complexity: "O(n) time and O(h) space.",
    interview: "Every node's children are exchanged to create the mirror tree."
},
{
    id: "tree08", question: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Return nodes level by level.",
    approach: "Use BFS with a queue.",
    complexity: "O(n) time and O(n) space.",
    interview: "Level order traversal is BFS."
},
{
    id: "tree09", question: "Binary Tree Right Side View", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Return nodes visible from the right side of the tree.",
    approach: "Perform BFS and record the last node of every level.",
    complexity: "O(n) time and O(n) space.",
    interview: "The last node processed at each level is the visible rightmost node."
},
{
    id: "tree10", question: "Diameter of Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Find the longest path between any two nodes.",
    approach: "Calculate subtree heights and update diameter using left height + right height.",
    complexity: "O(n) time and O(h) space.",
    interview: "At every node, a possible diameter passes through that node."
},
{
    id: "tree11", question: "Balanced Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Check whether height difference between left and right subtrees is at most one.",
    approach: "Calculate heights bottom-up and return failure immediately when imbalance is detected.",
    complexity: "O(n) time and O(h) space.",
    interview: "Bottom-up checking avoids repeatedly calculating subtree heights."
},
{
    id: "tree12", question: "Path Sum", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Determine whether a root-to-leaf path has a given sum.",
    approach: "Subtract each node's value from the target and check leaf nodes.",
    complexity: "O(n) time and O(h) space.",
    interview: "The target sum is reduced while traversing the path."
},
{
    id: "tree13", question: "Path Sum II", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Find all root-to-leaf paths with a target sum.",
    approach: "Use DFS with a current path and backtrack after visiting each child.",
    complexity: "O(n) time excluding output.",
    interview: "Backtracking maintains the current root-to-leaf path."
},
{
    id: "tree14", question: "Lowest Common Ancestor of Binary Tree", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Find the lowest node that is an ancestor of two given nodes.",
    approach: "Recursively search both subtrees and return the node where both targets are found in different branches.",
    complexity: "O(n) time and O(h) space.",
    interview: "The first node whose left and right sides contain the targets is the LCA."
},
{
    id: "tree15", question: "Count Complete Tree Nodes", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Count nodes in a complete binary tree efficiently.",
    approach: "Compare leftmost and rightmost heights; if equal, the subtree is perfect.",
    complexity: "O(log² n) time.",
    interview: "Complete-tree structure allows entire perfect subtrees to be counted directly."
},
{
    id: "tree16", question: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: "Trees", platform: "LeetCode",
    problem: "Convert a binary tree to a string and reconstruct it.",
    approach: "Use preorder traversal with null markers during serialization and consume the values recursively during deserialization.",
    complexity: "O(n) time and O(n) space.",
    interview: "Null markers preserve the exact tree structure."
},
{
    id: "tree17", question: "Construct Binary Tree from Preorder and Inorder", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Build a binary tree from preorder and inorder traversals.",
    approach: "The first preorder element is root; use inorder positions to divide left and right subtrees.",
    complexity: "O(n) time and O(n) space.",
    interview: "Preorder identifies roots while inorder identifies subtree boundaries."
},
{
    id: "tree18", question: "Construct Binary Tree from Inorder and Postorder", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Construct a binary tree using inorder and postorder arrays.",
    approach: "The last postorder element is root; split inorder around that root.",
    complexity: "O(n) time and O(n) space.",
    interview: "Postorder identifies the root from the end."
},
{
    id: "tree19", question: "Flatten Binary Tree to Linked List", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Flatten a binary tree into a preorder linked-list structure.",
    approach: "Use preorder traversal or modify pointers so left subtree becomes right subtree.",
    complexity: "O(n) time and O(h) space.",
    interview: "The final right-pointer chain follows preorder traversal."
},
{
    id: "tree20", question: "Populating Next Right Pointers", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Connect every node with the next node on the same level.",
    approach: "Use level-order traversal or exploit perfect-tree structure to connect neighboring nodes.",
    complexity: "O(n) time.",
    interview: "Nodes on the same level can be connected using BFS."
},
{
    id: "tree21", question: "Maximum Path Sum", difficulty: "Hard", topic: "Trees", platform: "LeetCode",
    problem: "Find the maximum sum path between any two nodes.",
    approach: "Calculate maximum downward contribution from each node and update the global answer using both children.",
    complexity: "O(n) time and O(h) space.",
    interview: "A path through a node can use both its left and right contributions."
},
{
    id: "tree22", question: "Minimum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Find the minimum root-to-leaf depth.",
    approach: "Use BFS and return the depth when the first leaf is reached.",
    complexity: "O(n) time and O(n) space.",
    interview: "BFS finds the nearest leaf first."
},
{
    id: "tree23", question: "Sum Root to Leaf Numbers", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Treat each root-to-leaf path as a number and return their sum.",
    approach: "Build the current number while traversing and add it at leaf nodes.",
    complexity: "O(n) time and O(h) space.",
    interview: "Each child extends the current number by one digit."
},
{
    id: "tree24", question: "Binary Tree Paths", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Return all root-to-leaf paths.",
    approach: "DFS while maintaining the current path string.",
    complexity: "O(n) time excluding output.",
    interview: "DFS naturally follows one root-to-leaf path at a time."
},
{
    id: "tree25", question: "Average of Levels in Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Calculate the average value of nodes at each level.",
    approach: "Use BFS and calculate sum divided by number of nodes at each level.",
    complexity: "O(n) time and O(n) space.",
    interview: "Queue-based level traversal gives direct access to each level."
},
{
    id: "tree26", question: "Zigzag Level Order Traversal", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Traverse tree levels alternately from left-to-right and right-to-left.",
    approach: "Use BFS and reverse every alternate level.",
    complexity: "O(n) time and O(n) space.",
    interview: "BFS handles levels while a direction flag controls ordering."
},
{
    id: "tree27", question: "Boundary Traversal of Binary Tree", difficulty: "Medium", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Print the boundary nodes of a binary tree.",
    approach: "Collect left boundary, leaves and reversed right boundary.",
    complexity: "O(n) time and O(h) space.",
    interview: "Separating the boundary into three parts avoids duplicate nodes."
},
{
    id: "tree28", question: "Vertical Order Traversal", difficulty: "Hard", topic: "Trees", platform: "LeetCode",
    problem: "Group tree nodes according to their vertical positions.",
    approach: "Assign row and column coordinates and sort nodes by column, row and value.",
    complexity: "O(n log n) time and O(n) space.",
    interview: "Coordinates transform the tree into sortable vertical groups."
},
{
    id: "tree29", question: "Top View of Binary Tree", difficulty: "Medium", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Print nodes visible from the top of a binary tree.",
    approach: "Use BFS with horizontal distance and store the first node seen at each distance.",
    complexity: "O(n) time and O(n) space.",
    interview: "BFS ensures the first node encountered at a horizontal distance is the topmost one."
},
{
    id: "tree30", question: "Bottom View of Binary Tree", difficulty: "Medium", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Print nodes visible from the bottom.",
    approach: "Use BFS and overwrite the node stored for each horizontal distance.",
    complexity: "O(n) time and O(n) space.",
    interview: "The last node encountered at each horizontal distance becomes the bottom view."
},
{
    id: "tree31", question: "Left View of Binary Tree", difficulty: "Easy", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Print the first visible node from every level.",
    approach: "Use BFS and record the first node at each level.",
    complexity: "O(n) time and O(n) space.",
    interview: "The first node processed at each BFS level represents the left view."
},
{
    id: "tree32", question: "Children Sum Property", difficulty: "Medium", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Check whether every non-leaf node equals the sum of its children.",
    approach: "Recursively verify the property for every node.",
    complexity: "O(n) time and O(h) space.",
    interview: "Each node can be checked independently after validating its children."
},
{
    id: "tree33", question: "Check for Children Sum Property", difficulty: "Medium", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Determine whether a binary tree satisfies the children sum condition.",
    approach: "For every non-leaf node compare its value with left plus right child values.",
    complexity: "O(n) time and O(h) space.",
    interview: "It is a direct recursive tree validation problem."
},
{
    id: "tree34", question: "Morris Inorder Traversal", difficulty: "Hard", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Perform inorder traversal without recursion or an explicit stack.",
    approach: "Create temporary threaded links from predecessor nodes to the current node.",
    complexity: "O(n) time and O(1) extra space.",
    interview: "Morris traversal uses tree structure itself instead of auxiliary stack space."
},
{
    id: "tree35", question: "Morris Preorder Traversal", difficulty: "Hard", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Perform preorder traversal using O(1) extra space.",
    approach: "Use temporary predecessor links while visiting each node before moving to its left subtree.",
    complexity: "O(n) time and O(1) extra space.",
    interview: "Temporary threaded links allow traversal without recursion."
},
{
    id: "tree36", question: "Burning Tree", difficulty: "Hard", topic: "Trees", platform: "GeeksforGeeks",
    problem: "Find the minimum time required to burn the entire tree from a target node.",
    approach: "Build parent relationships and perform BFS from the target node.",
    complexity: "O(n) time and O(n) space.",
    interview: "Once parent links are available, the tree becomes an undirected graph."
},
{
    id: "tree37", question: "Nodes at Distance K", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Find all nodes exactly distance k from a target node.",
    approach: "Store parent pointers and run BFS from the target.",
    complexity: "O(n) time and O(n) space.",
    interview: "Parent links allow movement in all three directions."
},
{
    id: "tree38", question: "Cousins in Binary Tree", difficulty: "Easy", topic: "Trees", platform: "LeetCode",
    problem: "Determine whether two nodes are at the same depth but have different parents.",
    approach: "Use BFS while tracking parent and depth.",
    complexity: "O(n) time and O(n) space.",
    interview: "Level-order traversal naturally provides depth information."
},
{
    id: "tree39", question: "Find Duplicate Subtrees", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Find all duplicate subtrees.",
    approach: "Serialize each subtree and use a hash map to count identical serializations.",
    complexity: "O(n) average time and O(n) space.",
    interview: "Identical subtree structures produce identical serialization keys."
},
{
    id: "tree40", question: "House Robber III", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Maximize robbed money without robbing directly connected tree nodes.",
    approach: "For each node calculate two values: rob it or skip it.",
    complexity: "O(n) time and O(h) space.",
    interview: "Tree DP stores the best result for both states of each node."
},
{
    id: "tree41", question: "All Nodes Distance K", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Return all nodes at distance k from a target.",
    approach: "Convert tree to an implicit undirected graph using parent pointers and BFS.",
    complexity: "O(n) time and O(n) space.",
    interview: "Parent mapping lets BFS move upward as well as downward."
},
{
    id: "tree42", question: "Binary Tree Cameras", difficulty: "Hard", topic: "Trees", platform: "LeetCode",
    problem: "Place minimum cameras so every tree node is monitored.",
    approach: "Use greedy postorder states representing covered, needs camera, or has camera.",
    complexity: "O(n) time and O(h) space.",
    interview: "Postorder lets a parent decide based on the states of its children."
},
{
    id: "tree43", question: "Longest ZigZag Path in a Binary Tree", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Find the longest path alternating between left and right child directions.",
    approach: "Use DFS while tracking the previous direction and current ZigZag length.",
    complexity: "O(n) time and O(h) space.",
    interview: "The direction must alternate at every edge."
},
{
    id: "tree44", question: "Find Leaves of Binary Tree", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Group tree leaves removed layer by layer.",
    approach: "Compute each node's height from the bottom and group nodes by height.",
    complexity: "O(n) time and O(n) space.",
    interview: "Nodes with the same bottom-up height are removed together."
},
{
    id: "tree45", question: "Maximum Width of Binary Tree", difficulty: "Medium", topic: "Trees", platform: "LeetCode",
    problem: "Find the maximum width between the leftmost and rightmost non-null nodes.",
    approach: "Use BFS with conceptual indices assigned like a heap.",
    complexity: "O(n) time and O(n) space.",
    interview: "Node indices allow the width including gaps to be calculated."

// ==================== BST ====================

},
{
    id: "bst01", question: "Search in a Binary Search Tree", difficulty: "Easy", topic: "BST", platform: "LeetCode",
    problem: "Find a node with a given value in a BST.",
    approach: "Compare target with current value and move left if smaller or right if larger.",
    complexity: "O(h) time and O(h) recursive space.",
    interview: "BST ordering eliminates half of the remaining search space at each level."
},
{
    id: "bst02", question: "Insert into a Binary Search Tree", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Insert a value while maintaining BST ordering.",
    approach: "Traverse left or right according to comparison until an empty position is found.",
    complexity: "O(h) time and O(h) space recursively.",
    interview: "Every inserted value must follow the BST ordering property."
},
{
    id: "bst03", question: "Delete Node in a BST", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Delete a node while maintaining BST properties.",
    approach: "Handle zero, one or two-child cases. For two children replace with inorder successor.",
    complexity: "O(h) time and O(h) space.",
    interview: "The inorder successor is the smallest value in the right subtree."
},
{
    id: "bst04", question: "Validate Binary Search Tree", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Determine whether a binary tree satisfies BST ordering.",
    approach: "Maintain valid minimum and maximum bounds while traversing.",
    complexity: "O(n) time and O(h) space.",
    interview: "Every node must lie within the valid range inherited from its ancestors."
},
{
    id: "bst05", question: "Kth Smallest Element in a BST", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Find the kth smallest value in a BST.",
    approach: "Perform inorder traversal and count visited nodes.",
    complexity: "O(h+k) time and O(h) space.",
    interview: "Inorder traversal of a BST produces values in sorted order."
},
{
    id: "bst06", question: "Kth Largest Element in a BST", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Find kth largest element in a BST.",
    approach: "Perform reverse inorder traversal and count nodes.",
    complexity: "O(h+k) time and O(h) space.",
    interview: "Reverse inorder gives values from largest to smallest."
},
{
    id: "bst07", question: "Lowest Common Ancestor of BST", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Find the lowest common ancestor of two nodes in a BST.",
    approach: "If both targets are smaller move left; if both are larger move right; otherwise current node is LCA.",
    complexity: "O(h) time and O(1) iterative space.",
    interview: "BST ordering makes LCA search simpler than in a normal binary tree."
},
{
    id: "bst08", question: "Convert Sorted Array to BST", difficulty: "Easy", topic: "BST", platform: "LeetCode",
    problem: "Create a height-balanced BST from a sorted array.",
    approach: "Choose the middle element as root and recursively build both halves.",
    complexity: "O(n) time and O(log n) space.",
    interview: "Choosing the middle maintains balance."
},
{
    id: "bst09", question: "Convert Sorted List to BST", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Convert a sorted linked list into a balanced BST.",
    approach: "Find the middle node and recursively build left and right subtrees.",
    complexity: "O(n log n) typical time.",
    interview: "The middle element acts as root to maintain balance."
},
{
    id: "bst10", question: "Trim a Binary Search Tree", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Remove BST nodes whose values lie outside a given range.",
    approach: "Use BST ordering to recursively discard invalid subtrees.",
    complexity: "O(n) time and O(h) space.",
    interview: "Entire left or right subtrees can be discarded based on value bounds."
},
{
    id: "bst11", question: "Range Sum of BST", difficulty: "Easy", topic: "BST", platform: "LeetCode",
    problem: "Find sum of all BST nodes within a range.",
    approach: "Traverse only branches that can contain values within the range.",
    complexity: "O(n) worst-case and O(h) space.",
    interview: "BST properties allow pruning unnecessary branches."
},
{
    id: "bst12", question: "Minimum Absolute Difference in BST", difficulty: "Easy", topic: "BST", platform: "LeetCode",
    problem: "Find minimum absolute difference between any two BST values.",
    approach: "Use inorder traversal and compare every value with the previous value.",
    complexity: "O(n) time and O(h) space.",
    interview: "Inorder gives sorted values, so the minimum difference is between adjacent values."
},
{
    id: "bst13", question: "Two Sum IV - Input is a BST", difficulty: "Easy", topic: "BST", platform: "LeetCode",
    problem: "Determine whether two BST nodes sum to a target.",
    approach: "Use a hash set while traversing the tree.",
    complexity: "O(n) time and O(n) space.",
    interview: "For each value x, check whether target-x has already been seen."
},
{
    id: "bst14", question: "Recover Binary Search Tree", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Recover a BST where two nodes were accidentally swapped.",
    approach: "Use inorder traversal to detect inversions and swap the misplaced values.",
    complexity: "O(n) time and O(h) space.",
    interview: "A valid BST inorder sequence must be sorted."
},
{
    id: "bst15", question: "Balance a Binary Search Tree", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Convert an unbalanced BST into a balanced BST.",
    approach: "Get sorted values using inorder traversal and recursively choose middle values.",
    complexity: "O(n) time and O(n) space.",
    interview: "Inorder converts BST into sorted order, which can then be rebuilt balanced."
},
{
    id: "bst16", question: "BST Iterator", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Implement an iterator that returns BST values in sorted order.",
    approach: "Maintain a stack containing the left path and process nodes lazily.",
    complexity: "O(1) amortized next() and O(h) space.",
    interview: "The stack simulates iterative inorder traversal."
},
{
    id: "bst17", question: "Find Floor in BST", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Find the largest BST value less than or equal to a key.",
    approach: "Move right when current value is smaller and record it; move left when larger.",
    complexity: "O(h) time and O(1) space.",
    interview: "BST ordering lets us search floor without traversing every node."
},
{
    id: "bst18", question: "Find Ceil in BST", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Find the smallest BST value greater than or equal to a key.",
    approach: "Move left when current value is larger and record it; otherwise move right.",
    complexity: "O(h) time and O(1) space.",
    interview: "Ceil search follows the BST ordering property."
},
{
    id: "bst19", question: "Predecessor and Successor in BST", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Find inorder predecessor and successor of a key.",
    approach: "Track possible predecessor and successor while traversing according to comparisons.",
    complexity: "O(h) time and O(1) space.",
    interview: "Predecessor is the largest smaller value and successor is the smallest larger value."
},
{
    id: "bst20", question: "Merge Two BSTs", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Merge values from two BSTs into sorted order.",
    approach: "Perform inorder traversal on both trees and merge the resulting sorted arrays.",
    complexity: "O(n+m) time and O(n+m) space.",
    interview: "Inorder traversal converts each BST into sorted data."
},
{
    id: "bst21", question: "Largest BST in Binary Tree", difficulty: "Hard", topic: "BST", platform: "GeeksforGeeks",
    problem: "Find the size of the largest BST subtree inside a binary tree.",
    approach: "Use postorder information containing min, max, size and whether subtree is BST.",
    complexity: "O(n) time and O(h) space.",
    interview: "Postorder allows a parent to determine BST validity using child information."
},
{
    id: "bst22", question: "Construct BST from Preorder", difficulty: "Medium", topic: "BST", platform: "LeetCode",
    problem: "Construct a BST from preorder traversal.",
    approach: "Use recursive bounds or a stack to determine where each value belongs.",
    complexity: "O(n) time and O(n) space.",
    interview: "BST bounds determine whether a value belongs in the left or right subtree."
},
{
    id: "bst23", question: "Preorder Successor in BST", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Find the preorder successor of a given BST node.",
    approach: "Use BST relationships and traversal order to determine the next node.",
    complexity: "O(h) to O(n) depending on implementation.",
    interview: "Preorder processes root before its children."
},
{
    id: "bst24", question: "Dead End in BST", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Determine whether a BST contains a leaf where no new integer can be inserted.",
    approach: "Track allowed minimum and maximum values during DFS.",
    complexity: "O(n) time and O(h) space.",
    interview: "A dead end occurs when a leaf has no valid integer within its allowed range."
},
{
    id: "bst25", question: "Count BST Nodes in Given Range", difficulty: "Medium", topic: "BST", platform: "GeeksforGeeks",
    problem: "Count nodes whose values lie between low and high.",
    approach: "Use BST pruning to avoid exploring irrelevant subtrees.",
    complexity: "O(n) worst-case and O(h) space.",
    interview: "BST ordering allows efficient range pruning."
},

// ==================== HEAP / PRIORITY QUEUE ====================

{
    id: "heap01", question: "Kth Largest Element in an Array", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Find kth largest element.",
    approach: "Maintain a min-heap of size k.",
    complexity: "O(n log k) time and O(k) space.",
    interview: "The heap stores the k largest values seen so far."
},
{
    id: "heap02", question: "Kth Smallest Element in an Array", difficulty: "Medium", topic: "Heap", platform: "GeeksforGeeks",
    problem: "Find kth smallest element.",
    approach: "Maintain a max-heap of size k.",
    complexity: "O(n log k) time and O(k) space.",
    interview: "The heap root represents the kth smallest candidate."
},
{
    id: "heap03", question: "Top K Frequent Elements", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Return k most frequent elements.",
    approach: "Count frequencies and maintain a min-heap of size k.",
    complexity: "O(n log k) time and O(n) space.",
    interview: "Heap efficiently keeps only the top k frequencies."
},
{
    id: "heap04", question: "K Closest Points to Origin", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Find k points closest to the origin.",
    approach: "Use a max-heap of size k based on squared distance.",
    complexity: "O(n log k) time and O(k) space.",
    interview: "Squared distance avoids unnecessary square-root calculations."
},
{
    id: "heap05", question: "Merge K Sorted Lists", difficulty: "Hard", topic: "Heap", platform: "LeetCode",
    problem: "Merge k sorted linked lists.",
    approach: "Put the first node of every list into a min-heap and repeatedly extract the smallest.",
    complexity: "O(n log k) time and O(k) space.",
    interview: "The heap always gives the smallest current node among all lists."
},
{
    id: "heap06", question: "Find Median from Data Stream", difficulty: "Hard", topic: "Heap", platform: "LeetCode",
    problem: "Continuously find median while numbers are inserted.",
    approach: "Use a max-heap for lower half and min-heap for upper half.",
    complexity: "O(log n) insertion and O(1) median.",
    interview: "Two balanced heaps divide the data around the median."
},
{
    id: "heap07", question: "Last Stone Weight", difficulty: "Easy", topic: "Heap", platform: "LeetCode",
    problem: "Repeatedly smash the two heaviest stones and return the final weight.",
    approach: "Use a max-heap to always extract the two largest stones.",
    complexity: "O(n log n) time.",
    interview: "A priority queue directly models repeated selection of the largest elements."
},
{
    id: "heap08", question: "Task Scheduler", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Schedule tasks with a cooldown period.",
    approach: "Use a max-heap for task frequencies and process the most frequent task first.",
    complexity: "O(n log n) time.",
    interview: "Prioritizing the most frequent tasks minimizes idle time."
},
{
    id: "heap09", question: "Reorganize String", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Rearrange characters so adjacent characters are different.",
    approach: "Use a max-heap of character frequencies and alternate the most frequent characters.",
    complexity: "O(n log 26) time.",
    interview: "The heap ensures the most frequent remaining character is chosen."
},
{
    id: "heap10", question: "Smallest Range Covering Elements from K Lists", difficulty: "Hard", topic: "Heap", platform: "LeetCode",
    problem: "Find the smallest range containing at least one element from each sorted list.",
    approach: "Use a min-heap for current minimum and track current maximum.",
    complexity: "O(n log k) time.",
    interview: "The heap efficiently identifies which list should advance."
},
{
    id: "heap11", question: "Ugly Number II", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Find the nth ugly number.",
    approach: "Use a min-heap and set to generate multiples while avoiding duplicates.",
    complexity: "O(n log n) approximately.",
    interview: "Priority queue generates ugly numbers in increasing order."
},
{
    id: "heap12", question: "Super Ugly Number", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Find nth number whose prime factors belong to a given list.",
    approach: "Generate candidates using a min-heap and remove duplicates.",
    complexity: "O(n log n) approximately.",
    interview: "Heap maintains the smallest candidate at every step."
},
{
    id: "heap13", question: "Maximum Performance of a Team", difficulty: "Hard", topic: "Heap", platform: "LeetCode",
    problem: "Select workers to maximize performance based on speed sum and minimum efficiency.",
    approach: "Sort workers by efficiency and maintain selected speeds in a min-heap.",
    complexity: "O(n log k) time.",
    interview: "The minimum efficiency becomes fixed while the heap maintains the best speed combination."
},
{
    id: "heap14", question: "IPO", difficulty: "Hard", topic: "Heap", platform: "LeetCode",
    problem: "Maximize capital by selecting profitable projects under capital constraints.",
    approach: "Sort projects by required capital and use a max-heap for currently affordable profits.",
    complexity: "O(n log n) time.",
    interview: "The heap always chooses the most profitable currently available project."
},
{
    id: "heap15", question: "Kth Smallest Element in a Sorted Matrix", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Find kth smallest matrix element where rows and columns are sorted.",
    approach: "Push the first element from each row into a min-heap.",
    complexity: "O(k log n) time.",
    interview: "The heap merges sorted rows similarly to merging sorted lists."
},
{
    id: "heap16", question: "Find K Pairs with Smallest Sums", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Find k pairs with the smallest sums from two sorted arrays.",
    approach: "Use a min-heap containing promising pairs.",
    complexity: "O(k log k) approximately.",
    interview: "Sorted arrays allow us to generate only promising next pairs."
},
{
    id: "heap17", question: "Sliding Window Median", difficulty: "Hard", topic: "Heap", platform: "LeetCode",
    problem: "Find median of every sliding window.",
    approach: "Maintain two heaps and remove expired elements using lazy deletion.",
    complexity: "O(n log k) time.",
    interview: "Two heaps generalize the median-stream technique to a moving window."
},
{
    id: "heap18", question: "Connect N Ropes with Minimum Cost", difficulty: "Medium", topic: "Heap", platform: "GeeksforGeeks",
    problem: "Connect ropes with minimum total cost.",
    approach: "Always combine the two smallest ropes using a min-heap.",
    complexity: "O(n log n) time.",
    interview: "Combining the smallest ropes first minimizes repeated cost."
},
{
    id: "heap19", question: "Nearly Sorted Array", difficulty: "Medium", topic: "Heap", platform: "GeeksforGeeks",
    problem: "Sort an array where every element is at most k positions away from its sorted position.",
    approach: "Maintain a min-heap of size k+1.",
    complexity: "O(n log k) time.",
    interview: "The smallest element among the next k+1 values must be the next sorted element."
},
{
    id: "heap20", question: "Merge K Sorted Arrays", difficulty: "Medium", topic: "Heap", platform: "GeeksforGeeks",
    problem: "Merge multiple sorted arrays.",
    approach: "Insert the first element from each array into a min-heap and repeatedly extract the minimum.",
    complexity: "O(n log k) time.",
    interview: "The heap performs a k-way merge."
},
{
    id: "heap21", question: "Frequency Sort", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Sort characters by decreasing frequency.",
    approach: "Count characters and use a max-heap ordered by frequency.",
    complexity: "O(n log n) time.",
    interview: "Heap retrieves the highest-frequency character first."
},
{
    id: "heap22", question: "Sort Characters by Frequency", difficulty: "Medium", topic: "Heap", platform: "LeetCode",
    problem: "Return a string sorted by character frequency.",
    approach: "Use frequency map and max-heap.",
    complexity: "O(n log n) time.",
    interview: "Priority queue orders characters according to frequency."
},
{
    id: "heap23", question: "Maximum Product of Two Elements", difficulty: "Easy", topic: "Heap", platform: "LeetCode",
    problem: "Find maximum product after subtracting one from each of two elements.",
    approach: "Find the two largest values using a heap or linear scan.",
    complexity: "O(n) with a linear scan.",
    interview: "Only the two largest elements can maximize the product."
},
{
    id: "heap24", question: "Third Maximum Number", difficulty: "Easy", topic: "Heap", platform: "LeetCode",
    problem: "Find the third distinct maximum number.",
    approach: "Maintain a min-heap of three distinct values.",
    complexity: "O(n log 3), effectively O(n).",
    interview: "A fixed-size heap keeps only the top three distinct values."
},
{
    id: "heap25", question: "Kth Largest Element in a Stream", difficulty: "Easy", topic: "Heap", platform: "LeetCode",
    problem: "Return kth largest value after each insertion into a stream.",
    approach: "Maintain a min-heap of size k.",
    complexity: "O(log k) per insertion.",
    interview: "The root of the size-k min-heap is always the kth largest value."
},

// ==================== GREEDY ====================

{
    id: "gr01", question: "Assign Cookies", difficulty: "Easy", topic: "Greedy", platform: "LeetCode",
    problem: "Maximize satisfied children using cookies of different sizes.",
    approach: "Sort both arrays and assign the smallest sufficient cookie to each child.",
    complexity: "O(n log n) time.",
    interview: "Greedy matching avoids wasting large cookies on children with small requirements."
},
{
    id: "gr02", question: "Jump Game", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Determine whether the last index can be reached.",
    approach: "Track the farthest reachable index while scanning.",
    complexity: "O(n) time and O(1) space.",
    interview: "Only the farthest reachable position matters."
},
{
    id: "gr03", question: "Jump Game II", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Find minimum jumps to reach the last index.",
    approach: "Track current jump range and farthest position reachable from that range.",
    complexity: "O(n) time and O(1) space.",
    interview: "Each jump expands the reachable range as far as possible."
},
{
    id: "gr04", question: "Gas Station", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Find a starting gas station that allows completing the circular route.",
    approach: "Track total balance and current balance; reset start when current balance becomes negative.",
    complexity: "O(n) time and O(1) space.",
    interview: "If a segment causes negative balance, no station within that segment can be the start."
},
{
    id: "gr05", question: "Candy", difficulty: "Hard", topic: "Greedy", platform: "LeetCode",
    problem: "Give children candies based on ratings while minimizing total candies.",
    approach: "Use left-to-right and right-to-left passes to satisfy both neighboring constraints.",
    complexity: "O(n) time and O(n) space.",
    interview: "Two directional passes handle both increasing and decreasing rating sequences."
},
{
    id: "gr06", question: "Non-overlapping Intervals", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Remove minimum intervals so remaining intervals do not overlap.",
    approach: "Sort by end time and greedily keep intervals that finish earliest.",
    complexity: "O(n log n) time.",
    interview: "An earlier ending interval leaves more room for future intervals."
},
{
    id: "gr07", question: "Minimum Number of Arrows to Burst Balloons", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Find minimum arrows needed to burst all overlapping balloons.",
    approach: "Sort intervals by ending coordinate and shoot at the current end.",
    complexity: "O(n log n) time.",
    interview: "Shooting at the earliest ending point maximizes future overlap."
},
{
    id: "gr08", question: "Partition Labels", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Partition a string so each character appears in at most one partition.",
    approach: "Track last occurrence of each character and extend the current partition until all characters end.",
    complexity: "O(n) time and O(26) space.",
    interview: "The partition must extend to the last occurrence of every character inside it."
},
{
    id: "gr09", question: "Queue Reconstruction by Height", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Reconstruct people based on height and number of taller people before them.",
    approach: "Sort by descending height and insert each person at their required index.",
    complexity: "O(n²) time.",
    interview: "Taller people are fixed first, making insertion positions reliable."
},
{
    id: "gr10", question: "Boats to Save People", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Use minimum boats when each boat holds at most two people.",
    approach: "Sort weights and pair the lightest person with the heaviest whenever possible.",
    complexity: "O(n log n) time.",
    interview: "If the heaviest cannot pair with the lightest, they cannot pair with anyone."
},
{
    id: "gr11", question: "Activity Selection", difficulty: "Easy", topic: "Greedy", platform: "GeeksforGeeks",
    problem: "Select maximum number of non-overlapping activities.",
    approach: "Sort activities by finishing time and always select the earliest finishing compatible activity.",
    complexity: "O(n log n) time.",
    interview: "Earliest finish leaves maximum time for remaining activities."
},
{
    id: "gr12", question: "Fractional Knapsack", difficulty: "Medium", topic: "Greedy", platform: "GeeksforGeeks",
    problem: "Maximize value when fractions of items can be taken.",
    approach: "Sort items by value-to-weight ratio and take the highest ratios first.",
    complexity: "O(n log n) time.",
    interview: "Taking the highest value density first is optimal when fractions are allowed."
},
{
    id: "gr13", question: "Minimum Platforms", difficulty: "Medium", topic: "Greedy", platform: "GeeksforGeeks",
    problem: "Find minimum railway platforms required for all trains.",
    approach: "Sort arrival and departure times and sweep through both arrays.",
    complexity: "O(n log n) time.",
    interview: "The maximum number of overlapping trains determines required platforms."
},
{
    id: "gr14", question: "Job Sequencing Problem", difficulty: "Medium", topic: "Greedy", platform: "GeeksforGeeks",
    problem: "Maximize profit by scheduling jobs before deadlines.",
    approach: "Sort jobs by descending profit and place each job in the latest available slot.",
    complexity: "O(n²) basic implementation.",
    interview: "Scheduling profitable jobs as late as possible preserves earlier slots."
},
{
    id: "gr15", question: "Minimum Coins", difficulty: "Easy", topic: "Greedy", platform: "GeeksforGeeks",
    problem: "Find minimum number of coins for a value using standard denominations.",
    approach: "Repeatedly choose the largest denomination not exceeding the remaining amount.",
    complexity: "O(number of denominations).",
    interview: "Greedy works for standard coin systems but not for every arbitrary denomination system."
},
{
    id: "gr16", question: "Lemonade Change", difficulty: "Easy", topic: "Greedy", platform: "LeetCode",
    problem: "Determine whether correct change can be given to every customer.",
    approach: "Maintain counts of $5 and $10 bills and always preserve smaller bills when possible.",
    complexity: "O(n) time and O(1) space.",
    interview: "When giving change, use larger bills first while preserving $5 bills for future customers."
},
{
    id: "gr17", question: "Valid Parenthesis String", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Check validity when '*' can represent '(', ')' or empty.",
    approach: "Track minimum and maximum possible open-parenthesis counts.",
    complexity: "O(n) time and O(1) space.",
    interview: "The range of possible open counts handles the flexibility of '*'."
},
{
    id: "gr18", question: "Maximum Units on a Truck", difficulty: "Easy", topic: "Greedy", platform: "LeetCode",
    problem: "Maximize units loaded onto a truck with limited capacity.",
    approach: "Sort box types by units per box descending and take the most valuable boxes first.",
    complexity: "O(n log n) time.",
    interview: "Highest value density should be selected first."
},
{
    id: "gr19", question: "Hand of Straights", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Determine whether cards can be rearranged into groups of consecutive values.",
    approach: "Use sorted values and frequencies, always starting groups from the smallest available card.",
    complexity: "O(n log n) time.",
    interview: "The smallest unused card must begin a valid consecutive group."
},
{
    id: "gr20", question: "Minimum Cost to Connect Sticks", difficulty: "Medium", topic: "Greedy", platform: "LeetCode",
    problem: "Connect sticks with minimum total cost.",
    approach: "Always combine the two shortest sticks using a min-heap.",
    complexity: "O(n log n) time.",
    interview: "This is the same greedy principle used in optimal merge patterns."
},

// ==================== GRAPHS ====================

{
    id: "graph01", question: "BFS of Graph", difficulty: "Easy", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Traverse a graph using Breadth First Search.",
    approach: "Use a queue and visited array.",
    complexity: "O(V+E) time and O(V) space.",
    interview: "BFS explores vertices level by level."
},
{
    id: "graph02", question: "DFS of Graph", difficulty: "Easy", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Traverse a graph using Depth First Search.",
    approach: "Use recursion or an explicit stack.",
    complexity: "O(V+E) time and O(V) space.",
    interview: "DFS explores as deep as possible before backtracking."
},
{
    id: "graph03", question: "Number of Islands", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Count connected land components in a grid.",
    approach: "Run DFS/BFS from every unvisited land cell.",
    complexity: "O(mn) time and O(mn) space.",
    interview: "Each DFS marks one complete connected component."
},
{
    id: "graph04", question: "Clone Graph", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Create a deep copy of an undirected graph.",
    approach: "Use BFS/DFS and a map from original nodes to cloned nodes.",
    complexity: "O(V+E) time and O(V) space.",
    interview: "The map prevents duplicate clones and handles cycles."
},
{
    id: "graph05", question: "Course Schedule", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Determine whether all courses can be completed given prerequisites.",
    approach: "Detect cycles using topological sorting or DFS.",
    complexity: "O(V+E) time.",
    interview: "A directed cycle means prerequisites can never be completed."
},
{
    id: "graph06", question: "Course Schedule II", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Return a valid order to complete all courses.",
    approach: "Use Kahn's algorithm with indegrees.",
    complexity: "O(V+E) time and O(V) space.",
    interview: "Topological sorting produces an ordering respecting prerequisites."
},
{
    id: "graph07", question: "Detect Cycle in Undirected Graph", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Determine whether an undirected graph contains a cycle.",
    approach: "Use DFS with parent tracking or DSU.",
    complexity: "O(V+E) time.",
    interview: "An already visited neighbor that is not the parent indicates a cycle."
},
{
    id: "graph08", question: "Detect Cycle in Directed Graph", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Detect a cycle in a directed graph.",
    approach: "Use DFS with a recursion-stack state or Kahn's algorithm.",
    complexity: "O(V+E) time.",
    interview: "A back edge to a currently active DFS node indicates a directed cycle."
},
{
    id: "graph09", question: "Topological Sort", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Find a linear ordering of vertices in a DAG.",
    approach: "Use DFS postorder or Kahn's indegree algorithm.",
    complexity: "O(V+E) time.",
    interview: "Topological sorting is possible only for directed acyclic graphs."
},
{
    id: "graph10", question: "Number of Provinces", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Count connected components in an adjacency matrix.",
    approach: "Run DFS/BFS from every unvisited city.",
    complexity: "O(n²) time and O(n) space.",
    interview: "Each traversal identifies one connected province."
},
{
    id: "graph11", question: "Rotting Oranges", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find time for rotten oranges to infect all fresh oranges.",
    approach: "Use multi-source BFS.",
    complexity: "O(mn) time.",
    interview: "All rotten oranges spread simultaneously, making multi-source BFS ideal."
},
{
    id: "graph12", question: "01 Matrix", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find distance from every cell to the nearest zero.",
    approach: "Start BFS from all zero cells.",
    complexity: "O(mn) time.",
    interview: "Multi-source BFS gives shortest distance to any source."
},
{
    id: "graph13", question: "Word Ladder", difficulty: "Hard", topic: "Graphs", platform: "LeetCode",
    problem: "Find shortest transformation sequence between words.",
    approach: "Build implicit graph by changing one character and use BFS.",
    complexity: "O(N × L²) approximately.",
    interview: "Each valid word is a graph node and BFS finds minimum transformations."
},
{
    id: "graph14", question: "Network Delay Time", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find time for a signal to reach all nodes.",
    approach: "Use Dijkstra's shortest path algorithm.",
    complexity: "O((V+E) log V).",
    interview: "Dijkstra works because edge weights are non-negative."
},
{
    id: "graph15", question: "Dijkstra Shortest Path", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Find shortest paths from a source in a weighted graph.",
    approach: "Use a min-priority queue and relax edges.",
    complexity: "O((V+E) log V).",
    interview: "The closest unprocessed vertex gets its final shortest distance."
},
{
    id: "graph16", question: "Bellman-Ford Algorithm", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Find shortest paths when negative edge weights may exist.",
    approach: "Relax all edges V-1 times and perform one extra pass for negative-cycle detection.",
    complexity: "O(VE) time.",
    interview: "Bellman-Ford can handle negative edges unlike standard Dijkstra."
},
{
    id: "graph17", question: "Floyd Warshall Algorithm", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Find shortest paths between every pair of vertices.",
    approach: "Use DP where each vertex is considered as an intermediate point.",
    complexity: "O(V³) time and O(V²) space.",
    interview: "Floyd-Warshall is an all-pairs shortest path algorithm."
},
{
    id: "graph18", question: "Minimum Spanning Tree - Prim", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Find an MST using Prim's algorithm.",
    approach: "Grow the MST by repeatedly selecting the minimum-weight edge connecting a new vertex.",
    complexity: "O(E log V) using a heap.",
    interview: "Prim grows one connected tree greedily."
},
{
    id: "graph19", question: "Kruskal Minimum Spanning Tree", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Find MST using sorted edges.",
    approach: "Sort edges and use DSU to add edges that do not form cycles.",
    complexity: "O(E log E).",
    interview: "Kruskal selects globally smallest safe edges."
},
{
    id: "graph20", question: "Disjoint Set Union", difficulty: "Medium", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Implement union-find for dynamic connectivity.",
    approach: "Use path compression and union by rank/size.",
    complexity: "Nearly O(1) amortized per operation.",
    interview: "DSU efficiently tracks connected components."
},
{
    id: "graph21", question: "Redundant Connection", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find an edge that creates a cycle in an almost-tree graph.",
    approach: "Use DSU and return an edge whose endpoints are already connected.",
    complexity: "O(n α(n)).",
    interview: "An edge connecting vertices already in the same component creates a cycle."
},
{
    id: "graph22", question: "Accounts Merge", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Merge accounts sharing common email addresses.",
    approach: "Connect emails belonging to the same account and find connected components.",
    complexity: "O(N log N) approximately.",
    interview: "Shared emails create graph connectivity between accounts."
},
{
    id: "graph23", question: "Surrounded Regions", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Capture surrounded regions in a board.",
    approach: "Start DFS/BFS from boundary-connected O cells and mark them safe.",
    complexity: "O(mn) time.",
    interview: "Only regions connected to the boundary cannot be captured."
},
{
    id: "graph24", question: "Pacific Atlantic Water Flow", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find cells from which water can reach both oceans.",
    approach: "Run reverse DFS/BFS from both ocean boundaries.",
    complexity: "O(mn) time.",
    interview: "Reverse traversal avoids starting a search from every cell."
},
{
    id: "graph25", question: "Graph Valid Tree", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Determine whether edges form a valid tree.",
    approach: "A tree must be connected and contain no cycle; use DFS or DSU.",
    complexity: "O(V+E) time.",
    interview: "For n vertices a tree must have n-1 edges and be connected."
},
{
    id: "graph26", question: "Is Graph Bipartite?", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Determine whether a graph can be divided into two sets with no internal edges.",
    approach: "Color vertices alternately using BFS/DFS.",
    complexity: "O(V+E) time.",
    interview: "A graph is bipartite if no edge connects vertices of the same color."
},
{
    id: "graph27", question: "Possible Bipartition", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Determine whether people can be divided based on dislike relationships.",
    approach: "Model dislikes as edges and test bipartiteness.",
    complexity: "O(V+E) time.",
    interview: "The problem is equivalent to checking whether the graph is bipartite."
},
{
    id: "graph28", question: "All Paths From Source to Target", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find every path from source to target in a DAG.",
    approach: "Use DFS and backtracking to construct paths.",
    complexity: "O(number of paths × path length).",
    interview: "Because the graph is acyclic, DFS can safely enumerate all paths."
},
{
    id: "graph29", question: "Keys and Rooms", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Determine whether all rooms can be visited.",
    approach: "Treat rooms as graph nodes and keys as directed edges; use DFS/BFS.",
    complexity: "O(V+E) time.",
    interview: "The problem asks whether every node is reachable from node zero."
},
{
    id: "graph30", question: "Minimum Height Trees", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find all roots producing minimum-height trees.",
    approach: "Repeatedly remove leaf nodes until one or two centers remain.",
    complexity: "O(n) time.",
    interview: "Tree centers are found efficiently by peeling leaves layer by layer."
},
{
    id: "graph31", question: "Evaluate Division", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Evaluate division equations represented as relationships between variables.",
    approach: "Build a weighted graph and use DFS to multiply edge weights along paths.",
    complexity: "O(Q × V) worst-case.",
    interview: "Each equation becomes a weighted directed edge."
},
{
    id: "graph32", question: "Cheapest Flights Within K Stops", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find cheapest route with at most k stops.",
    approach: "Use modified Bellman-Ford or BFS with cost and stop tracking.",
    complexity: "O(K × E).",
    interview: "The stop constraint means normal unrestricted shortest path is insufficient."
},
{
    id: "graph33", question: "Reconstruct Itinerary", difficulty: "Hard", topic: "Graphs", platform: "LeetCode",
    problem: "Construct lexical smallest itinerary using all tickets.",
    approach: "Use Hierholzer's algorithm with sorted adjacency lists.",
    complexity: "O(E log E).",
    interview: "Every ticket must be used exactly once, making this an Eulerian path problem."
},
{
    id: "graph34", question: "Critical Connections in a Network", difficulty: "Hard", topic: "Graphs", platform: "LeetCode",
    problem: "Find edges whose removal disconnects the network.",
    approach: "Use Tarjan's algorithm with discovery and low-link times.",
    complexity: "O(V+E).",
    interview: "A bridge is an edge where the child's low-link value is greater than the parent's discovery time."
},
{
    id: "graph35", question: "Number of Connected Components", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Count connected components in an undirected graph.",
    approach: "Use DFS/BFS or DSU.",
    complexity: "O(V+E).",
    interview: "Each traversal or DSU component represents one connected component."
},
{
    id: "graph36", question: "Clone Graph Using BFS", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Clone an undirected graph using BFS.",
    approach: "Use a queue and mapping from original nodes to cloned nodes.",
    complexity: "O(V+E).",
    interview: "The map prevents repeatedly cloning the same node."
},
{
    id: "graph37", question: "Rotting Oranges Using BFS", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Spread infection through a grid and calculate required time.",
    approach: "Start BFS with all infected cells simultaneously.",
    complexity: "O(mn).",
    interview: "Each BFS level represents one unit of time."
},
{
    id: "graph38", question: "Shortest Path in Binary Matrix", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Find shortest path through an unweighted binary matrix.",
    approach: "Use BFS over eight possible directions.",
    complexity: "O(n²).",
    interview: "BFS gives shortest distance in an unweighted graph."
},
{
    id: "graph39", question: "Word Search", difficulty: "Medium", topic: "Graphs", platform: "LeetCode",
    problem: "Search for a word in a character grid.",
    approach: "Use DFS with visited marking and backtracking.",
    complexity: "O(mn × 4^L).",
    interview: "Each cell can branch into up to four neighboring paths."
},
{
    id: "graph40", question: "Alien Dictionary", difficulty: "Hard", topic: "Graphs", platform: "GeeksforGeeks",
    problem: "Determine character ordering from a sorted alien language dictionary.",
    approach: "Build precedence edges from adjacent words and perform topological sorting.",
    complexity: "O(V+E).",
    interview: "The first differing character between adjacent words gives an ordering constraint."
},

// ==================== DYNAMIC PROGRAMMING ====================

{
    id: "dp01", question: "Climbing Stairs", difficulty: "Easy", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count ways to reach the nth stair using steps of 1 or 2.",
    approach: "dp[i] = dp[i-1] + dp[i-2].",
    complexity: "O(n) time and O(1) space with two variables.",
    interview: "The last step is either one step or two steps from the previous position."
},
{
    id: "dp02", question: "House Robber", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Maximize money robbed without robbing adjacent houses.",
    approach: "For each house choose maximum of robbing it plus dp[i-2] or skipping it.",
    complexity: "O(n) time and O(1) space.",
    interview: "Each house has two choices: rob or skip."
},
{
    id: "dp03", question: "House Robber II", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Rob houses arranged in a circle without robbing adjacent houses.",
    approach: "Solve two linear cases: exclude first house or exclude last house.",
    complexity: "O(n) time and O(1) space.",
    interview: "The circular dependency is broken by considering two cases."
},
{
    id: "dp04", question: "Maximum Subarray", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find maximum sum contiguous subarray.",
    approach: "Use Kadane's algorithm to decide whether to extend or restart the current subarray.",
    complexity: "O(n) time and O(1) space.",
    interview: "At every position keep the best subarray ending there."
},
{
    id: "dp05", question: "Maximum Product Subarray", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find contiguous subarray with maximum product.",
    approach: "Track both maximum and minimum products because multiplying by a negative can swap them.",
    complexity: "O(n) time and O(1) space.",
    interview: "Negative values make the minimum product important."
},
{
    id: "dp06", question: "Coin Change", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum coins required to make an amount.",
    approach: "dp[x] = minimum coins needed for amount x.",
    complexity: "O(amount × coins) time.",
    interview: "Every amount is built from smaller amounts."
},
{
    id: "dp07", question: "Coin Change II", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count combinations that make a target amount.",
    approach: "Use 1D DP and process coins outermost to avoid counting permutations.",
    complexity: "O(amount × coins).",
    interview: "Coin-first iteration ensures combinations rather than different orders."
},
{
    id: "dp08", question: "0/1 Knapsack", difficulty: "Medium", topic: "Dynamic Programming", platform: "GeeksforGeeks",
    problem: "Maximize value without exceeding capacity, with each item used once.",
    approach: "For each item choose take or skip.",
    complexity: "O(nW) time and O(W) optimized space.",
    interview: "The state represents the best value for a capacity."
},
{
    id: "dp09", question: "Unbounded Knapsack", difficulty: "Medium", topic: "Dynamic Programming", platform: "GeeksforGeeks",
    problem: "Maximize value when items can be used multiple times.",
    approach: "Use 1D DP and allow the same item to contribute repeatedly.",
    complexity: "O(nW).",
    interview: "Unlike 0/1 knapsack, an item can be selected multiple times."
},
{
    id: "dp10", question: "Subset Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "GeeksforGeeks",
    problem: "Determine whether a subset has a given sum.",
    approach: "dp[sum] indicates whether the sum can be formed.",
    complexity: "O(n × target).",
    interview: "Each element creates take and skip choices."
},
{
    id: "dp11", question: "Partition Equal Subset Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Determine whether an array can be divided into two equal-sum subsets.",
    approach: "Check whether subset sum equal to total/2 is possible.",
    complexity: "O(n × sum).",
    interview: "The problem reduces to a subset-sum problem."
},
{
    id: "dp12", question: "Target Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Assign plus/minus signs to reach a target.",
    approach: "Use DP over possible sums or transform into subset sum.",
    complexity: "O(n × sum).",
    interview: "The sign choices can be modeled as a state-transition problem."
},
{
    id: "dp13", question: "Longest Increasing Subsequence", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find length of the longest strictly increasing subsequence.",
    approach: "Use DP or binary search with a tails array.",
    complexity: "O(n log n) using binary search.",
    interview: "The tails array stores the smallest possible tail for each subsequence length."
},
{
    id: "dp14", question: "Longest Common Subsequence", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find longest subsequence common to two strings.",
    approach: "If characters match, add one; otherwise take maximum from skipping either character.",
    complexity: "O(mn) time and O(n) optimized space.",
    interview: "The state represents the best LCS for prefixes of both strings."
},
{
    id: "dp15", question: "Longest Common Substring", difficulty: "Medium", topic: "Dynamic Programming", platform: "GeeksforGeeks",
    problem: "Find longest contiguous substring common to two strings.",
    approach: "If characters match, dp[i][j] = dp[i-1][j-1]+1; otherwise reset to zero.",
    complexity: "O(mn) time.",
    interview: "Unlike subsequence, a mismatch breaks the contiguous substring."
},
{
    id: "dp16", question: "Edit Distance", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum insertions, deletions and replacements to transform one string into another.",
    approach: "Use DP over prefixes and consider insert, delete and replace.",
    complexity: "O(mn) time and O(n) optimized space.",
    interview: "Every cell represents minimum operations between two prefixes."
},
{
    id: "dp17", question: "Word Break", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Determine whether a string can be segmented into dictionary words.",
    approach: "dp[i] indicates whether prefix ending at i can be formed.",
    complexity: "O(n²) approximately.",
    interview: "The string is divided into smaller prefixes ending at valid dictionary words."
},
{
    id: "dp18", question: "Decode Ways", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count ways to decode a digit string into letters.",
    approach: "At each position consider one-digit and valid two-digit decoding.",
    complexity: "O(n) time and O(1) space.",
    interview: "The recurrence depends on valid one- and two-digit choices."
},
{
    id: "dp19", question: "Unique Paths", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count paths from top-left to bottom-right moving only right or down.",
    approach: "dp[i][j] = dp[i-1][j] + dp[i][j-1].",
    complexity: "O(mn) time.",
    interview: "Every cell can be reached from the cell above or left."
},
{
    id: "dp20", question: "Unique Paths II", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count grid paths when obstacles exist.",
    approach: "Set obstacle cells to zero and use the same path recurrence.",
    complexity: "O(mn) time.",
    interview: "An obstacle contributes zero possible paths."
},
{
    id: "dp21", question: "Minimum Path Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum cost path through a grid.",
    approach: "For each cell take minimum of top and left path plus current value.",
    complexity: "O(mn) time.",
    interview: "The optimal path to a cell must come from its optimal top or left predecessor."
},
{
    id: "dp22", question: "Triangle", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum path sum from top to bottom of a triangle.",
    approach: "Use bottom-up DP and choose the smaller child at each position.",
    complexity: "O(n²) time and O(n) space.",
    interview: "Bottom-up processing avoids storing unnecessary rows."
},
{
    id: "dp23", question: "Climbing Stairs with Cost", difficulty: "Easy", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum cost to reach the top when each stair has a cost.",
    approach: "dp[i] = cost[i] + min(dp[i-1], dp[i-2]).",
    complexity: "O(n) time and O(1) space.",
    interview: "The final stair can be reached from either of the previous two positions."
},
{
    id: "dp24", question: "House Painting", difficulty: "Medium", topic: "Dynamic Programming", platform: "GeeksforGeeks",
    problem: "Paint houses with different colors without adjacent houses having the same color.",
    approach: "Track minimum cost for each color while choosing a different previous color.",
    complexity: "O(nk) time.",
    interview: "The state records minimum cost ending with each color."
},
{
    id: "dp25", question: "Matrix Chain Multiplication", difficulty: "Hard", topic: "Dynamic Programming", platform: "GeeksforGeeks",
    problem: "Find minimum scalar multiplications needed to multiply matrices.",
    approach: "Try every possible split and choose minimum multiplication cost.",
    complexity: "O(n³) time and O(n²) space.",
    interview: "Different parenthesizations have different multiplication costs."
},
{
    id: "dp26", question: "Palindrome Partitioning II", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum cuts needed to partition a string into palindromes.",
    approach: "Precompute palindrome substrings and use DP for minimum cuts.",
    complexity: "O(n²) time and O(n²) space.",
    interview: "Palindrome precomputation allows efficient partition decisions."
},
{
    id: "dp27", question: "Burst Balloons", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Maximize coins obtained by bursting balloons in an optimal order.",
    approach: "Use interval DP and choose the last balloon burst in each interval.",
    complexity: "O(n³) time and O(n²) space.",
    interview: "Choosing the last balloon removes dependency on the order of earlier bursts."
},
{
    id: "dp28", question: "Distinct Subsequences", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count how many subsequences of one string equal another string.",
    approach: "If characters match, count both use and skip cases; otherwise skip source character.",
    complexity: "O(mn) time.",
    interview: "The DP state counts ways to form a target prefix from a source prefix."
},
{
    id: "dp29", question: "Interleaving String", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Determine whether a string is formed by interleaving two strings.",
    approach: "Use DP to track how many characters have been consumed from each string.",
    complexity: "O(mn).",
    interview: "Each target character must come from one of the two source strings."
},
{
    id: "dp30", question: "Regular Expression Matching", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Match a string against a pattern containing '.' and '*'.",
    approach: "Use DP with transitions for direct match and repeated '*' patterns.",
    complexity: "O(mn).",
    interview: "DP handles whether each prefix pair can be matched."
},
{
    id: "dp31", question: "Wildcard Matching", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Match a string against a pattern containing '?' and '*'.",
    approach: "Use DP where '*' can represent empty or multiple characters.",
    complexity: "O(mn).",
    interview: "The '*' transition considers both consuming a character and matching empty."
},
{
    id: "dp32", question: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Maximize profit with one transaction.",
    approach: "Track minimum price so far and maximum profit.",
    complexity: "O(n) time and O(1) space.",
    interview: "For every selling day, buy at the lowest previous price."
},
{
    id: "dp33", question: "Best Time to Buy and Sell Stock II", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Maximize profit with unlimited transactions.",
    approach: "Add every positive price difference between consecutive days.",
    complexity: "O(n) time and O(1) space.",
    interview: "Every profitable upward movement can be captured."
},
{
    id: "dp34", question: "Best Time to Buy and Sell Stock III", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Maximize profit with at most two transactions.",
    approach: "Use DP states for first buy, first sell, second buy and second sell.",
    complexity: "O(n) time and O(1) space.",
    interview: "Each state represents the best profit after a specific transaction stage."
},
{
    id: "dp35", question: "Best Time to Buy and Sell Stock IV", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Maximize profit with at most k transactions.",
    approach: "Use transaction-state DP.",
    complexity: "O(nk) time.",
    interview: "Each transaction adds buy and sell states."
},
{
    id: "dp36", question: "Longest Palindromic Subsequence", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find longest subsequence that is a palindrome.",
    approach: "Use interval DP; matching ends add two, otherwise skip one end.",
    complexity: "O(n²) time and O(n²) space.",
    interview: "The problem depends on matching characters at both ends."
},
{
    id: "dp37", question: "Minimum Insertions to Form Palindrome", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum insertions needed to make a string palindrome.",
    approach: "Answer equals n minus the longest palindromic subsequence length.",
    complexity: "O(n²) time.",
    interview: "Characters already belonging to the longest palindromic subsequence need no insertion."
},
{
    id: "dp38", question: "Partition Array for Maximum Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Partition an array into groups of size at most k to maximize sum.",
    approach: "Try every partition length ending at each index and use maximum element of the group.",
    complexity: "O(nk) time.",
    interview: "Each DP state considers all valid final partition sizes."
},
{
    id: "dp39", question: "Integer Break", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Break integer n into at least two positive integers maximizing product.",
    approach: "For every number consider every possible first split.",
    complexity: "O(n²) time.",
    interview: "DP compares products from all possible partitions."
},
{
    id: "dp40", question: "Perfect Squares", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum number of perfect squares summing to n.",
    approach: "dp[i] = minimum squares required to form i.",
    complexity: "O(n√n) time.",
    interview: "Each value is built by adding one perfect square to a smaller value."
},
{
    id: "dp41", question: "Decode Ways II", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count decodings when '*' can represent digits.",
    approach: "Track decoding possibilities for one and two-character combinations.",
    complexity: "O(n) time and O(1) space.",
    interview: "The wildcard creates multiple valid decoding choices."
},
{
    id: "dp42", question: "Maximal Square", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find the largest square containing only ones.",
    approach: "dp[i][j] stores largest square ending at the current cell.",
    complexity: "O(mn) time and O(n) space.",
    interview: "A square can extend only when top, left and diagonal neighbors also form squares."
},
{
    id: "dp43", question: "Maximal Rectangle", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find largest rectangle containing only ones.",
    approach: "Convert each row into histogram heights and apply largest rectangle in histogram.",
    complexity: "O(mn) time.",
    interview: "The 2D problem is reduced to repeated histogram problems."
},
{
    id: "dp44", question: "Dungeon Game", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum initial health needed to reach the destination.",
    approach: "Use bottom-up DP storing minimum health required from each cell.",
    complexity: "O(mn) time.",
    interview: "Working backwards determines the health required before entering each cell."
},
{
    id: "dp45", question: "Minimum Falling Path Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum sum of a falling path through a matrix.",
    approach: "For each cell choose minimum of three possible cells from previous row.",
    complexity: "O(n²) time.",
    interview: "Each position depends only on three neighboring positions above."
},
{
    id: "dp46", question: "Triangle Minimum Path Sum", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum path from top to bottom of a triangle.",
    approach: "Use bottom-up DP.",
    complexity: "O(n²) time and O(n) space.",
    interview: "Bottom-up recurrence chooses the cheaper child."
},
{
    id: "dp47", question: "Longest Arithmetic Subsequence", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find longest subsequence having constant difference.",
    approach: "Use a map for each index storing best length for each difference.",
    complexity: "O(n²) time and O(n²) space.",
    interview: "The DP state is based on the previous element and common difference."
},
{
    id: "dp48", question: "Number of Longest Increasing Subsequences", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Count how many LIS sequences have maximum length.",
    approach: "Maintain both LIS length and number of ways for every index.",
    complexity: "O(n²) time.",
    interview: "Two DP arrays track length and count."
},
{
    id: "dp49", question: "Russian Doll Envelopes", difficulty: "Hard", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find maximum number of envelopes that can be nested.",
    approach: "Sort widths ascending and heights descending for equal widths, then find LIS on heights.",
    complexity: "O(n log n) time.",
    interview: "Sorting reduces the 2D nesting problem to a 1D LIS problem."
},
{
    id: "dp50", question: "Minimum Cost For Tickets", difficulty: "Medium", topic: "Dynamic Programming", platform: "LeetCode",
    problem: "Find minimum cost for travel passes covering given travel days.",
    approach: "For each travel day choose between 1-day, 7-day and 30-day passes.",
    complexity: "O(n) or O(365) depending on implementation.",
    interview: "Each travel day has a small fixed set of pass choices."
},

// ==================== BIT MANIPULATION ====================

{
    id: "bit01", question: "Single Number", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Find the element appearing once when every other element appears twice.",
    approach: "XOR all elements because x^x=0 and x^0=x.",
    complexity: "O(n) time and O(1) space.",
    interview: "XOR cancels equal pairs."
},
{
    id: "bit02", question: "Number of 1 Bits", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Count set bits in an integer.",
    approach: "Repeatedly use n & (n-1) to remove the lowest set bit.",
    complexity: "O(number of set bits).",
    interview: "n & (n-1) clears the rightmost set bit."
},
{
    id: "bit03", question: "Counting Bits", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Return number of set bits for every number from 0 to n.",
    approach: "Use dp[i] = dp[i >> 1] + (i & 1).",
    complexity: "O(n) time and O(n) space.",
    interview: "Right shifting removes the last bit."
},
{
    id: "bit04", question: "Reverse Bits", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Reverse the bits of a 32-bit integer.",
    approach: "Process each bit and build the reversed result using shifts.",
    complexity: "O(32), effectively O(1).",
    interview: "Extract the lowest bit and place it at the corresponding reversed position."
},
{
    id: "bit05", question: "Missing Number", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Find missing number from 0 to n.",
    approach: "XOR all indices and array values.",
    complexity: "O(n) time and O(1) space.",
    interview: "Every present number cancels with its matching index."
},
{
    id: "bit06", question: "Power of Two", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Check whether a number is a power of two.",
    approach: "A positive power of two has exactly one set bit, so n & (n-1) must be zero.",
    complexity: "O(1) time.",
    interview: "Powers of two contain exactly one set bit."
},
{
    id: "bit07", question: "Power of Four", difficulty: "Easy", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Check whether a number is a power of four.",
    approach: "Check power-of-two property and ensure the set bit is at an even position.",
    complexity: "O(1) time.",
    interview: "Every power of four is a power of two with a specific bit position."
},
{
    id: "bit08", question: "Reverse Integer Bits", difficulty: "Easy", topic: "Bit Manipulation", platform: "GeeksforGeeks",
    problem: "Reverse the binary representation of an integer.",
    approach: "Extract bits one by one and append them in reverse order.",
    complexity: "O(log n) time.",
    interview: "Bit shifting allows direct manipulation of binary digits."
},
{
    id: "bit09", question: "Find Two Non-Repeating Numbers", difficulty: "Medium", topic: "Bit Manipulation", platform: "GeeksforGeeks",
    problem: "Find two numbers appearing once while all others appear twice.",
    approach: "XOR all numbers, isolate a set bit and divide numbers into two groups.",
    complexity: "O(n) time and O(1) space.",
    interview: "The differing bit separates the two unique numbers."
},
{
    id: "bit10", question: "Maximum XOR of Two Numbers", difficulty: "Medium", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Find maximum XOR among any pair of numbers.",
    approach: "Build a binary trie or greedily test bits using prefixes.",
    complexity: "O(n log M) time.",
    interview: "To maximize XOR, prioritize making higher bits different."
},
{
    id: "bit11", question: "Sum of Two Integers", difficulty: "Medium", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Add two integers without using + or -.",
    approach: "Use XOR for sum without carry and AND shifted left for carry.",
    complexity: "O(1) for fixed-width integers.",
    interview: "XOR calculates addition without carry; AND identifies carry bits."
},
{
    id: "bit12", question: "Bitwise AND of Numbers Range", difficulty: "Medium", topic: "Bit Manipulation", platform: "LeetCode",
    problem: "Find bitwise AND of every number in a range.",
    approach: "Remove differing lower bits by repeatedly shifting both boundaries right.",
    complexity: "O(log n).",
    interview: "Only the common binary prefix remains after ANDing the entire range."
},
{
    id: "bit13", question: "Subsets Using Bitmask", difficulty: "Medium", topic: "Bit Manipulation", platform: "GeeksforGeeks",
    problem: "Generate all subsets using binary masks.",
    approach: "Use each number from 0 to 2^n-1 as a subset mask.",
    complexity: "O(n × 2^n).",
    interview: "Each bit indicates whether an element is selected."
},
{
    id: "bit14", question: "Check Kth Bit", difficulty: "Easy", topic: "Bit Manipulation", platform: "GeeksforGeeks",
    problem: "Check whether kth bit of a number is set.",
    approach: "Use (n & (1 << k)) and check whether result is non-zero.",
    complexity: "O(1) time.",
    interview: "A mask with only the kth bit set isolates that bit."
},
{
    id: "bit15", question: "Set Kth Bit", difficulty: "Easy", topic: "Bit Manipulation", platform: "GeeksforGeeks",
    problem: "Set the kth bit of a number to 1.",
    approach: "Use bitwise OR with (1 << k).",
    complexity: "O(1) time.",
    interview: "OR with a mask forces the selected bit to one."
}

];


function displayDsaQuestions(questionsToDisplay = dsaQuestions) {
    dsaQuestionList.innerHTML = "";

    if (questionsToDisplay.length === 0) {
        dsaQuestionList.innerHTML = "<p>No DSA questions found.</p>";
        return;
    }

    questionsToDisplay.forEach(function (item) {
        const card = document.createElement("div");
        card.className = "dsa-question-card";

        card.innerHTML = `
            <h3>${item.question}</h3>

            <div class="dsa-meta">
                <span>${item.topic}</span>
                <span>${item.difficulty}</span>
                <span>${item.platform}</span>
            </div>

            <details class="dsa-solution">
                <summary>📖 View Problem & Solution</summary>

                <div class="dsa-solution-content">

                    <h4>Problem</h4>
                    <p>${item.problem}</p>

                    <h4>Approach</h4>
                    <p>${item.approach}</p>

                    <h4>Complexity</h4>
                    <p>${item.complexity}</p>

                    <h4>Interview Explanation</h4>
                    <p>${item.interview}</p>

                </div>
            </details>
        `;

        dsaQuestionList.appendChild(card);
    });
}


function filterDsaQuestions() {

    const searchText =
        searchDsa.value.toLowerCase().trim();

    const selectedTopic =
        dsaTopicFilter.value;

    const selectedDifficulty =
        dsaDifficultyFilter.value;

    const selectedPlatform =
        dsaPlatformFilter.value;


    const filteredQuestions =
        dsaQuestions.filter(function (item) {

            const matchesSearch =

                item.question
                    .toLowerCase()
                    .includes(searchText)

                ||

                item.problem
                    .toLowerCase()
                    .includes(searchText);


            const matchesTopic =

                selectedTopic === "All" ||
                item.topic === selectedTopic;


            const matchesDifficulty =

                selectedDifficulty === "All" ||
                item.difficulty === selectedDifficulty;


            const matchesPlatform =

                selectedPlatform === "All" ||
                item.platform === selectedPlatform;


            return (
                matchesSearch &&
                matchesTopic &&
                matchesDifficulty &&
                matchesPlatform
            );

        });


    displayDsaQuestions(filteredQuestions);

}


if (searchDsa) {
    searchDsa.addEventListener(
        "input",
        filterDsaQuestions
    );
}


if (dsaTopicFilter) {
    dsaTopicFilter.addEventListener(
        "change",
        filterDsaQuestions
    );
}


if (dsaDifficultyFilter) {
    dsaDifficultyFilter.addEventListener(
        "change",
        filterDsaQuestions
    );
}


if (dsaPlatformFilter) {
    dsaPlatformFilter.addEventListener(
        "change",
        filterDsaQuestions
    );
}


displayDsaQuestions();
// ==================== RESUME BUILDER ====================

// ==================== RESUME BUILDER ====================

const generateResumeButton = document.getElementById("generate-resume");
const resumeOutput = document.getElementById("resume-output");

function formatResumeContent(text) {

    if (!text) {
        return "Not provided";
    }

    return text
        .split("\n")
        .map(function (line) {

            line = line.trim();

            if (line.startsWith("-")) {
                return "• " + line.substring(1).trim();
            }

            return line;

        })
        .join("<br>");
}


function saveResumeData() {

    const resumeData = {

        name: document.getElementById("resume-name").value,
        email: document.getElementById("resume-email").value,
        phone: document.getElementById("resume-phone").value,
        github: document.getElementById("resume-github").value,
        linkedin: document.getElementById("resume-linkedin").value,
        education: document.getElementById("resume-education").value,
        skills: document.getElementById("resume-skills").value,
        projects: document.getElementById("resume-projects").value,
        experience: document.getElementById("resume-experience").value

    };

    localStorage.setItem(
        "resumeData",
        JSON.stringify(resumeData)
    );
}


function generateResume() {

    const name =
        document.getElementById("resume-name").value.trim();

    const email =
        document.getElementById("resume-email").value.trim();

    const phone =
        document.getElementById("resume-phone").value.trim();

    const github =
        document.getElementById("resume-github").value.trim();

    const linkedin =
        document.getElementById("resume-linkedin").value.trim();

    const education =
        document.getElementById("resume-education").value.trim();

    const skills =
        document.getElementById("resume-skills").value.trim();

    const projects =
        document.getElementById("resume-projects").value.trim();

    const experience =
        document.getElementById("resume-experience").value.trim();


    if (!name || !email || !phone) {

        alert("Please enter your name, email and phone number.");

        return false;
    }


    saveResumeData();


    resumeOutput.innerHTML = `

        <div class="resume-document">

            <h1>${name}</h1>

            <p>
                ${email} | ${phone}
            </p>

            <p>
                ${github ? "GitHub: " + github : ""}
                ${github && linkedin ? " | " : ""}
                ${linkedin ? "LinkedIn: " + linkedin : ""}
            </p>

            <hr>

            <h2>Education</h2>

            <div class="resume-content">
                ${formatResumeContent(education)}
            </div>


            <h2>Skills</h2>

            <div class="resume-content">
                ${formatResumeContent(skills)}
            </div>


            <h2>Projects</h2>

            <div class="resume-content">
                ${formatResumeContent(projects)}
            </div>


            <h2>Experience / Achievements</h2>

            <div class="resume-content">
                ${formatResumeContent(experience)}
            </div>

        </div>

    `;

    return true;
}

// ==================== PRINT RESUME ====================

const printResumeButton = document.getElementById("print-resume");

if (printResumeButton) {

    printResumeButton.addEventListener("click", function () {

        const resumeContent =
            document.getElementById("resume-output").innerHTML;

        if (!resumeContent.trim()) {
            alert("Please generate your resume first.");
            return;
        }

        const printWindow = window.open("", "_blank");

        printWindow.document.write(`
            <html>
            <head>
                <title>Resume</title>

                <style>

                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #111;
                    }

                    .resume-document {
                        max-width: 800px;
                        margin: auto;
                    }

                    .resume-document h1 {
                        text-align: center;
                        margin-bottom: 10px;
                    }

                    .resume-document > p {
                        text-align: center;
                        margin: 6px 0;
                    }

                    .resume-document hr {
                        margin: 20px 0;
                    }

                    .resume-document h2 {
                        font-size: 19px;
                        margin-top: 20px;
                        margin-bottom: 8px;
                    }

                    .resume-content {
                        line-height: 1.6;
                        margin-bottom: 15px;
                    }

                </style>

            </head>

            <body>

                ${resumeContent}

            </body>
            </html>
        `);

        printWindow.document.close();

        printWindow.focus();

        printWindow.print();

    });

}

if (generateResumeButton) {

    generateResumeButton.addEventListener(
        "click",
        generateResume
    );

}


// ==================== LOAD SAVED RESUME ====================

const savedResume =
    localStorage.getItem("resumeData");


if (savedResume) {

    const resumeData =
        JSON.parse(savedResume);


    document.getElementById("resume-name").value =
        resumeData.name || "";

    document.getElementById("resume-email").value =
        resumeData.email || "";

    document.getElementById("resume-phone").value =
        resumeData.phone || "";

    document.getElementById("resume-github").value =
        resumeData.github || "";

    document.getElementById("resume-linkedin").value =
        resumeData.linkedin || "";

    document.getElementById("resume-education").value =
        resumeData.education || "";

    document.getElementById("resume-skills").value =
        resumeData.skills || "";

    document.getElementById("resume-projects").value =
        resumeData.projects || "";

    document.getElementById("resume-experience").value =
        resumeData.experience || "";


    // Refresh ke baad preview bhi generate hoga
    generateResume();

}

// ==================== HERO BUTTONS ====================

const getStartedButton = document.querySelector(".primary-btn");
const learnMoreButton = document.querySelector(".secondary-btn");

if (getStartedButton) {
    getStartedButton.addEventListener("click", function () {
        document.getElementById("dsa").scrollIntoView({
            behavior: "smooth"
        });
    });
}

if (learnMoreButton) {
    learnMoreButton.addEventListener("click", function () {
        document.getElementById("features").scrollIntoView({
            behavior: "smooth"
        });
    });
}

// ==================== STATS CARD NAVIGATION ====================

const statDsa = document.querySelector(".stat-dsa");
const statInterview = document.querySelector(".stat-interview");
const statNotes = document.querySelector(".stat-notes");

if (statDsa) {
    statDsa.addEventListener("click", function () {
        document.getElementById("dsa").scrollIntoView({
            behavior: "smooth"
        });
    });
}

if (statInterview) {
    statInterview.addEventListener("click", function () {
        document.getElementById("interview").scrollIntoView({
            behavior: "smooth"
        });
    });
}

if (statNotes) {
    statNotes.addEventListener("click", function () {
        document.getElementById("notes").scrollIntoView({
            behavior: "smooth"
        });
    });
}
// 500+ DSA Questions card → DSA Question Bank
document.getElementById("dsa-stats-card").addEventListener("click", function () {
    document.getElementById("dsa-bank").scrollIntoView({
        behavior: "smooth"
    });
});
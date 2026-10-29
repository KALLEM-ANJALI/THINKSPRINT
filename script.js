

const views = document.querySelectorAll(".page-view");

let profile = {
    username: "",
    email: "",
    avatar: "🐱"
};

let selectedAvatar = "🐱";
let questions = [];
let currentQuestion = 0;
let score = 0;
let timer = 15;
let timerInterval;
let answered = false;

// Load the previous highest score
let bestScore =
    Number(localStorage.getItem("thinkSprintBestScore")) || 0;


// NAVIGATION
function goToView(viewId) {
    clearInterval(timerInterval);

    views.forEach(view => {
        view.classList.remove("active-view");
    });

    const selectedView = document.getElementById(viewId);

    if (selectedView) {
        selectedView.classList.add("active-view");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// PROFILE
function openProfile() {
    document.getElementById("profileModal").classList.add("show");

    document.getElementById("username").value = profile.username;
    document.getElementById("email").value = profile.email;

    selectedAvatar = profile.avatar || "🐱";

    updateAvatarSelection();
    updateBestScoreDisplay();
}

function closeProfile() {
    document.getElementById("profileModal").classList.remove("show");
}

function updateAvatarSelection() {
    document.querySelectorAll(".avatar").forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.avatar === selectedAvatar
        );
    });
}

document.querySelectorAll(".avatar").forEach(button => {
    button.addEventListener("click", () => {
        selectedAvatar = button.dataset.avatar;
        updateAvatarSelection();
    });
});

document.getElementById("profileForm").addEventListener("submit", function(event) {
    event.preventDefault();

    profile.username = document.getElementById("username").value.trim();
    profile.email = document.getElementById("email").value.trim();
    profile.avatar = selectedAvatar;

    if (!profile.username) {
        alert("Please enter a username.");
        return;
    }

    localStorage.setItem("thinkSprintProfile", JSON.stringify(profile));

    updateProfileButton();
    closeProfile();
});

function updateProfileButton() {
    const button = document.getElementById("profileButton");

    button.textContent = profile.username
        ? `${profile.avatar} ${profile.username}`
        : "🐱 Profile";
}

function loadProfile() {
    const savedProfile = localStorage.getItem("thinkSprintProfile");

    if (savedProfile) {
        try {
            profile = { ...profile, ...JSON.parse(savedProfile) };
            selectedAvatar = profile.avatar || "🐱";
            updateProfileButton();
        } catch (error) {
            console.log("Could not load saved profile.");
        }
    } else {
        openProfile();
    }
}


// HIGHEST SCORE
function updateBestScoreDisplay() {
    const scoreElement = document.getElementById("profileBestScore");

    if (scoreElement) {
        scoreElement.textContent = bestScore > 0
            ? `${bestScore} / 10 correct answers`
            : "No quiz played yet";
    }
}

function saveBestScore() {
    const previousBest =
        Number(localStorage.getItem("thinkSprintBestScore")) || 0;

    if (score > previousBest) {
        bestScore = score;

        localStorage.setItem(
            "thinkSprintBestScore",
            bestScore
        );
    } else {
        bestScore = previousBest;
    }

    updateBestScoreDisplay();
}


// START QUIZ
async function startQuiz(categoryId) {
    goToView("quiz");

    document.getElementById("question").textContent = "Loading questions...";
    document.getElementById("answers").innerHTML = "";
    document.getElementById("feedback").textContent = "";

    try {
        const response = await fetch(
            `https://opentdb.com/api.php?amount=10&category=${categoryId}&type=multiple`
        );

        const data = await response.json();

        if (data.response_code !== 0 || data.results.length === 0) {
            document.getElementById("question").textContent =
                "No questions available. Please try another category.";
            return;
        }

        questions = data.results;
        currentQuestion = 0;
        score = 0;

        showQuestion();

    } catch (error) {
        document.getElementById("question").textContent =
            "Could not load questions. Check your internet connection and try again.";
    }
}


// DECODE HTML CHARACTERS
function decodeHTML(text) {
    const element = document.createElement("textarea");
    element.innerHTML = text;
    return element.value;
}


// DISPLAY QUESTION
function showQuestion() {
    clearInterval(timerInterval);

    answered = false;
    timer = 15;

    const question = questions[currentQuestion];

    document.getElementById("questionNumber").textContent =
        `Question ${currentQuestion + 1} / ${questions.length}`;

    document.getElementById("question").textContent =
        decodeHTML(question.question);

    document.getElementById("score").textContent = score;
    document.getElementById("timer").textContent = timer;
    document.getElementById("feedback").textContent = "";

    const answers = [
        ...question.incorrect_answers,
        question.correct_answer
    ].sort(() => Math.random() - 0.5);

    const answersContainer = document.getElementById("answers");
    answersContainer.innerHTML = "";

    answers.forEach(answer => {
        const button = document.createElement("button");

        button.className = "answer-button";
        button.textContent = decodeHTML(answer);

        button.addEventListener("click", () => {
            checkAnswer(button, answer, question.correct_answer);
        });

        answersContainer.appendChild(button);
    });

    document.getElementById("nextButton").disabled = true;

    timerInterval = setInterval(() => {
        timer--;

        document.getElementById("timer").textContent = timer;

        if (timer <= 0) {
            clearInterval(timerInterval);
            revealAnswer(question.correct_answer, true);
        }
    }, 1000);
}


// CHECK ANSWER
function checkAnswer(button, selectedAnswer, correctAnswer) {
    if (answered) return;

    answered = true;
    clearInterval(timerInterval);

    if (selectedAnswer === correctAnswer) {
        score++;

        button.classList.add("correct");

        document.getElementById("feedback").textContent =
            "Correct answer! 🎉";
    } else {
        button.classList.add("incorrect");

        document.getElementById("feedback").textContent =
            "Incorrect. The correct answer is " + decodeHTML(correctAnswer);
    }

    document.getElementById("score").textContent = score;

    revealAnswer(correctAnswer, false);
}


// SHOW CORRECT ANSWER
function revealAnswer(correctAnswer, timedOut) {
    answered = true;

    clearInterval(timerInterval);

    document.querySelectorAll(".answer-button").forEach(button => {
        button.disabled = true;

        if (button.textContent === decodeHTML(correctAnswer)) {
            button.classList.add("correct");
        }
    });

    if (timedOut) {
        document.getElementById("feedback").textContent =
            "Time is up! The correct answer is " + decodeHTML(correctAnswer);
    }

    document.getElementById("nextButton").disabled = false;
}


// NEXT QUESTION
function nextQuestion() {
    if (!answered) return;

    currentQuestion++;

    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}


// QUIZ RESULTS AND HIGHEST SCORE
function showResults() {
    clearInterval(timerInterval);

    // Save the highest score before displaying results
    saveBestScore();

    document.getElementById("finalScore").textContent =
        `Your score: ${score} / ${questions.length}`;

    const percentage = (score / questions.length) * 100;

    let message = "Good effort! Keep practising.";

    if (percentage === 100) {
        message = "Perfect score! You're a quiz champion! 🏆";
    } else if (percentage >= 70) {
        message = "Excellent work! 🌟";
    } else if (percentage >= 40) {
        message = "Good job! Keep learning. 💪";
    }

    document.getElementById("resultMessage").textContent = message;

    goToView("result");
}


// CONTACT FORM
document.getElementById("contactForm").addEventListener("submit", function(event) {
    event.preventDefault();

    alert("Thank you for your feedback!");

    this.reset();
});


// INITIALIZE APP
loadProfile();
updateBestScoreDisplay();

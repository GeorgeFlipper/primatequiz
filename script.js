document.addEventListener("DOMContentLoaded", () => {
  let questions = [],
    score = 0,
    totalScore = 0,
    startTime,
    timerInterval,
    userId;
  let questionOrder = [],
    currentIndex = 0;
  const startSound = new Audio("https://dl.sndup.net/hnkr4/Nicole.mp3");
  const radioStream = new Audio("https://stream.srg-ssr.ch/m/rsc_de/aacp_96");
  const askedQuestions =
    JSON.parse(localStorage.getItem("askedQuestions")) || [];

  const container = document.getElementById("container");
  const questionElement = document.getElementById("question");
  const timerElement = document.getElementById("timer");
  const totalScoreElement = document.getElementById("total-score");
  const totalScoreContainer = document.getElementById("total-score-container");
  const knlgSpan = document.getElementById("knlg-span");
  const buttons = document.querySelectorAll(".btn");
  const startButton = document.getElementById("start-button");
  const radioIcon = document.getElementById("radio-icon");
  const stopButton = document.getElementById("stop-button");
  const withdrawButton = document.getElementById("withdraw-button");
  const brainImage = document.getElementById("brain-image");
  let countdownElement = null;
  let isGamePaused = false;
  let isStopButtonActive = true;

  if (knlgSpan) knlgSpan.style.display = "none";
  if (totalScoreContainer) totalScoreContainer.style.display = "none";
  if (radioIcon) radioIcon.style.display = "none";
  if (stopButton) stopButton.style.display = "none";
  if (withdrawButton) withdrawButton.style.display = "none";

  if (timerElement) timerElement.textContent = "± " + timerElement.textContent;

  userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user-" + Date.now();
    localStorage.setItem("userId", userId);
  }

  fetch("questions.csv")
    .then((response) => response.text())
    .then((text) => {
      text.split("\n").forEach((line, index) => {
        const [q, c, w1, w2, w3] = line.split("\t");
        if (q && c && w1 && w2 && w3) {
          questions.push({ q, c, answers: [c, w1, w2, w3], index });
        }
      });
      initializeQuestionOrder();
      score = +localStorage.getItem("score") || 0;
      totalScore = +localStorage.getItem("totalScore") || 0;
      totalScoreElement.textContent = formatNumber(totalScore);
      checkWithdrawAvailability();
    });

  setTimeout(() => {
    if (startButton) startButton.style.opacity = "1";
    if (startButton) startButton.style.pointerEvents = "auto";
    if (brainImage) brainImage.style.opacity = "1";
  }, 2000);

  if (startButton) {
    startButton.addEventListener("click", () => {
      startSound.play();
      startButton.style.transition = "opacity 3s";
      brainImage.style.transition = "opacity 3s";
      startButton.style.opacity = "0";
      brainImage.style.opacity = "0";
      setTimeout(() => {
        startButton.style.display = "none";
        brainImage.style.display = "none";
        startButton.style.pointerEvents = "none";
        if (knlgSpan) knlgSpan.style.display = "inline";
        if (totalScoreContainer) totalScoreContainer.style.display = "flex";
        createCountdownElement();
        if (countdownElement) {
          countdownElement.style.display = "block";
          countdownElement.style.opacity = "1";
        }
        startCountdown();
      }, 3000);
    });
  }

  if (radioIcon) {
    radioIcon.addEventListener("click", () => {
      if (radioStream.paused) {
        radioStream.play();
      } else {
        radioStream.pause();
      }
    });
  }

  if (stopButton) {
    stopButton.addEventListener("click", () => {
      if (!isStopButtonActive) return;

      if (isGamePaused) {
        stopButton.src = "stop.svg";
        resumeGame();
      } else {
        stopButton.src = "play.svg";
        pauseGame();
      }
      isGamePaused = !isGamePaused;

      isStopButtonActive = false;
      setTimeout(() => {
        isStopButtonActive = true;
      }, 3000);
    });
  }

  function pauseGame() {
    clearInterval(timerInterval);
    if (questionElement) questionElement.textContent = "";
    buttons.forEach((btn) => {
      btn.textContent = "";
      btn.style.backgroundColor = "";
      btn.disabled = true;
    });
    if (timerElement) timerElement.textContent = "± 0.000";
    if (container) container.style.pointerEvents = "none";
  }

  function resumeGame() {
    if (!isGamePaused) return;
    setTimeout(() => {
      displayQuestion();
      if (timerElement) {
        timerElement.style.opacity = "1";
        timerElement.style.pointerEvents = "auto";
      }
      if (totalScoreContainer) totalScoreContainer.style.opacity = "1";
      buttons.forEach((btn) => {
        btn.style.pointerEvents = "auto";
        btn.disabled = false;
      });
      if (container) container.style.pointerEvents = "auto";
    }, 500);
  }

  function enableElements() {
    if (radioIcon) {
      radioIcon.style.opacity = "1";
      radioIcon.style.pointerEvents = "auto";
      radioIcon.style.display = "inline";
    }
    if (stopButton) {
      stopButton.style.opacity = "1";
      stopButton.style.pointerEvents = "auto";
      stopButton.style.display = "inline";
    }
    if (withdrawButton) {
      withdrawButton.style.opacity = "1";
      withdrawButton.style.pointerEvents = "auto";
      withdrawButton.style.display = "inline";
    }
    if (container) {
      container.style.opacity = "1";
      container.style.pointerEvents = "auto";
      container.style.display = "block";
    }
    if (timerElement) {
      timerElement.style.opacity = "1";
      timerElement.style.display = "block";
    }
    if (totalScoreContainer) {
      totalScoreContainer.style.opacity = "1";
    }
    document.getElementById("line").style.opacity = "1";
    document.getElementById("line-below-withdraw").style.opacity = "1";
    document.getElementById("line-below-withdraw").style.marginBottom = "20px";
  }

  function createCountdownElement() {
    countdownElement = document.createElement("div");
    countdownElement.id = "countdown";
    countdownElement.style.fontSize = "3em";
    countdownElement.style.fontWeight = "lighter";
    countdownElement.style.letterSpacing = "0.2em";
    countdownElement.style.opacity = "0";
    countdownElement.style.position = "absolute";
    countdownElement.style.top = "17%";
    countdownElement.style.left = "50%";
    countdownElement.style.transform = "translate(-50%, -50%)";
    countdownElement.style.transition = "opacity 1s";
    countdownElement.style.userSelect = "none";
    countdownElement.style.fontFamily = "Roboto, sans-serif";
    document.body.appendChild(countdownElement);
  }

  function initializeQuestionOrder() {
    const unaskedQuestions = questions.filter(
      (q) => !askedQuestions.includes(q.index)
    );
    const askedQuestionsList = questions.filter((q) =>
      askedQuestions.includes(q.index)
    );
    questionOrder = [
      ...unaskedQuestions.map((q) => q.index),
      ...askedQuestionsList.map((q) => q.index),
    ];
    for (let i = 0; i < 5; i++) {
      questionOrder = shuffleArray(questionOrder);
    }
    currentIndex = 0;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startCountdown() {
    let count = 3;
    if (countdownElement) countdownElement.textContent = count;
    if (countdownElement) countdownElement.style.opacity = "1";
    const countdownInterval = setInterval(() => {
      count--;
      if (countdownElement) countdownElement.textContent = count;
      if (count === 0) {
        clearInterval(countdownInterval);
        if (countdownElement) countdownElement.style.opacity = "0";
        setTimeout(() => {
          if (countdownElement) countdownElement.style.display = "none";
          startGame();
        }, 500);
      }
    }, 1000);
  }

  function startGame() {
    isGamePaused = false;
    displayQuestion();
    setTimeout(enableElements, 500);
  }

  function displayQuestion() {
    if (isGamePaused) return;

    if (container) container.style.opacity = "0";
    buttons.forEach((btn) => {
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
    });

    setTimeout(() => {
      const q = questions[questionOrder[currentIndex]];
      if (!q) return;

      if (questionElement) {
        questionElement.textContent = q.q;
      }

      q.answers.sort(() => Math.random() - 0.5);

      buttons.forEach((btn, i) => {
        btn.textContent = q.answers[i];
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.disabled = false;
        btn.style.backgroundColor = "";
      });

      startTime = new Date();
      currentIndex = (currentIndex + 1) % questionOrder.length;

      if (container) {
        container.style.transition = "opacity 0.5s";
        container.style.opacity = "1";
        container.style.pointerEvents = "auto";
      }
      setTimeout(startTimer, 1000);
    }, 500);
  }

  function startTimer() {
    clearInterval(timerInterval);
    if (timerElement) timerElement.style.color = "black";
    startTime = new Date();
    timerInterval = setInterval(() => {
      const elapsed = ((new Date() - startTime) / 1000).toFixed(3);
      const remaining = (60 - elapsed).toFixed(3);
      if (timerElement)
        timerElement.textContent = "± " + (remaining > 0 ? remaining : "0.000");
      if (remaining <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 10);
  }

  function handleTimeout() {
    if (isGamePaused) return;
    buttons.forEach((btn) => {
      btn.style.backgroundColor = "red";
      btn.style.animation = "flash 1s 2";
      btn.disabled = true;
    });
    let points = score < 10000 ? -score : -10000;
    score += points;
    animateTotalScore(points, false);
    totalScore += points;
    if (score < 0) score = 0;
    if (totalScore < 0) totalScore = 0;
    localStorage.setItem("score", score);
    localStorage.setItem("totalScore", totalScore);
    displayPoints(points, false);
    totalScoreElement.textContent = formatNumber(totalScore);
    checkWithdrawAvailability();
    logPlayerData();
    setTimeout(displayQuestion, 3000);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", function() {
      if (
        this.disabled ||
        isGamePaused ||
        this.classList.contains("claim-button")
      )
        return;
      clearInterval(timerInterval);
      const questionIndex = questionOrder[currentIndex - 1];
      const isCorrect = this.textContent === questions[questionIndex].c;
      this.style.backgroundColor = isCorrect ? "green" : "red";
      let points = 0;
      if (isCorrect) {
        const remaining = parseFloat(
          timerElement.textContent.replace("± ", "")
        );
        points = Math.round(remaining * 1000);
        animateTotalScore(points, true);
        score += points;
        totalScore += points;
        localStorage.setItem("score", score);
        localStorage.setItem("totalScore", totalScore);
        displayPoints(points, true);
        if (!askedQuestions.includes(questionIndex)) {
          askedQuestions.push(questionIndex);
          localStorage.setItem(
            "askedQuestions",
            JSON.stringify(askedQuestions)
          );
        }
      } else {
        const remaining = parseFloat(
          timerElement.textContent.replace("± ", "")
        );
        points = Math.round(remaining * 1000);
        points = Math.max(10000, points);
        if (score >= points) {
          animateTotalScore(-points, false);
          score -= points;
          totalScore -= points;
          localStorage.setItem("score", score);
          localStorage.setItem("totalScore", totalScore);
          displayPoints(-points, false);
        } else {
          points = score;
          animateTotalScore(-points, false);
          score = 0;
          totalScore -= points;
          localStorage.setItem("score", score);
          localStorage.setItem("totalScore", totalScore);
          displayPoints(-points, false);
        }
      }
      buttons.forEach((button) => (button.disabled = true));
      totalScoreElement.textContent = formatNumber(totalScore);
      checkWithdrawAvailability();
      logPlayerData(questionIndex);
      if (!isGamePaused) {
        setTimeout(displayQuestion, 3000);
      }
    });
  });

  function animateTotalScore(points, _isCorrect) {
    const duration = 1000;
    const start = totalScore;
    const end = totalScore + points;
    const startTime = new Date().getTime();

    function update() {
      const now = new Date().getTime();
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      totalScoreElement.textContent = formatNumber(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        totalScoreElement.textContent = formatNumber(end);
      }
    }

    requestAnimationFrame(update);
  }

  function displayPoints(points, isCorrect) {
    const pointsElement = document.createElement("div");
    pointsElement.textContent = (points > 0 ? "+" : "") + points;
    pointsElement.style.position = "absolute";
    pointsElement.style.color = isCorrect ? "green" : "red";
    pointsElement.style.fontSize = "1em";
    pointsElement.style.opacity = "1";
    pointsElement.style.transition = "all 2s ease-in-out";
    pointsElement.style.userSelect = "none";
    pointsElement.style.fontFamily = "Roboto, sans-serif";
    document.body.appendChild(pointsElement);

    const totalScoreRect = totalScoreContainer.getBoundingClientRect();
    const timerRect = timerElement.getBoundingClientRect();
    const midY = (totalScoreRect.top + timerRect.bottom) / 2;

    if (isCorrect) {
      pointsElement.style.left = "0";
      pointsElement.style.top = midY + "px";
      setTimeout(() => {
        pointsElement.style.left = totalScoreRect.right + "px";
        pointsElement.style.opacity = "0";
      }, 50);
    } else {
      pointsElement.style.right = "0";
      pointsElement.style.top = midY + "px";
      setTimeout(() => {
        pointsElement.style.right = totalScoreRect.right + "px";
        pointsElement.style.opacity = "0";
      }, 50);
    }

    setTimeout(() => {
      document.body.removeChild(pointsElement);
    }, 2050);
  }

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function logPlayerData(questionIndex) {
    const playerData = {
      userId,
      score,
      totalScore,
      timeSpent: (Date.now() - startTime) / 1000,
      timestamp: new Date().toISOString(),
    };
    fetch("log_player_data.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playerData),
    });

    fetch("update_questions.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIndex, userId, totalScore }),
    });
  }

  window.addEventListener("blur", () => {
    pauseGame();
    const remaining = parseFloat(timerElement.textContent.replace("± ", ""));
    let points = Math.round(remaining * 1000);
    points = Math.max(10000, points);
    if (score >= points) {
      animateTotalScore(-points, false);
      score -= points;
      totalScore -= points;
      localStorage.setItem("score", score);
      localStorage.setItem("totalScore", totalScore);
      displayPoints(-points, false);
    } else {
      points = score;
      animateTotalScore(-points, false);
      score = 0;
      totalScore -= points;
      localStorage.setItem("score", score);
      localStorage.setItem("totalScore", totalScore);
      displayPoints(-points, false);
    }
    totalScoreElement.textContent = formatNumber(totalScore);
    checkWithdrawAvailability();
    logPlayerData();
  });

  //Made a change here
  function checkWithdrawAvailability() {
    const withdrawLimit = 250000;
    if (totalScore >= withdrawLimit) {
      withdrawButton.classList.remove("disabled");
      withdrawButton.classList.add("connectButton");
      withdrawButton.innerText = `Withdraw ${formatWithdrawText(
        totalScore
      )} $HARRIS`;
      // withdrawButton.onclick = () => {
      //   pauseGame();
      //   stopButton.src = "play.svg";
      //   showPopup(totalScore);
      // };
    } else {
      withdrawButton.classList.add("disabled");
      withdrawButton.innerText = "Withdraw $HARRIS";
      withdrawButton.onclick = null;
    }
  }

  function formatWithdrawText(score) {
    if (score >= 1000000) {
      return (score / 1000000).toFixed(2) + "M";
    } else {
      return Math.floor(score / 1000) + "K";
    }
  }

  function showPopup(totalScore) {
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.style.backdropFilter = "blur(5px)";

    const congratsText = document.createElement("div");
    congratsText.textContent =
      "Congratulations, you have available for withdrawal:";
    congratsText.style.color = "white";
    congratsText.style.fontSize = "1.5em";
    congratsText.style.fontWeight = "lighter";
    congratsText.style.letterSpacing = "0.2em";
    congratsText.style.textAlign = "center";
    congratsText.style.marginBottom = "10px";

    const totalScoreDisplay = document.createElement("div");
    totalScoreDisplay.textContent = totalScore.toLocaleString();
    totalScoreDisplay.style.color = "white";
    totalScoreDisplay.style.fontSize = "2em";
    totalScoreDisplay.style.fontWeight = "lighter";
    totalScoreDisplay.style.letterSpacing = "0.2em";
    totalScoreDisplay.style.textAlign = "center";
    totalScoreDisplay.style.marginBottom = "10px";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.alignItems = "center";

    const createButton = (text, className) => {
      const button = document.createElement("button");
      button.textContent = text;
      button.classList.add(className)
      return button;
    };

    const knlgInfo = document.createElement("div");
    knlgInfo.textContent = "🧠 $HARRIS";
    knlgInfo.style.color = "white";
    knlgInfo.style.fontSize = "1.2em";
    knlgInfo.style.fontWeight = "lighter";
    knlgInfo.style.letterSpacing = "0.2em";
    knlgInfo.style.textAlign = "center";
    knlgInfo.style.marginBottom = "10px";

    buttonContainer.appendChild(
      createButton("Withdraw $KNLG (ETH)", "connectButton")
    );

    const disclaimer = document.createElement("div");
    disclaimer.textContent =
      "Tokens $HARRIS are equivalent across all three blockchain networks.";
    disclaimer.style.color = "white";
    disclaimer.style.fontSize = "0.7em";
    disclaimer.style.textAlign = "center";
    disclaimer.style.marginTop = "10px";

    overlay.appendChild(congratsText);
    overlay.appendChild(totalScoreDisplay);
    overlay.appendChild(knlgInfo);
    overlay.appendChild(buttonContainer);
    overlay.appendChild(disclaimer);

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resumeGame();
      }
    });
  }
});

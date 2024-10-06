document.addEventListener("DOMContentLoaded", () => {
  Telegram.WebApp.ready();

  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.style.position = "absolute";
    startButton.style.bottom = "5px";
    startButton.style.left = "50%";
    startButton.style.transform = "translateX(-50%)";
  }
});

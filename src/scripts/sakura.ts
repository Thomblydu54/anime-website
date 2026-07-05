document.addEventListener("DOMContentLoaded", () => {

  const MAX_PETALS = 40;

  function createPetal() {

    const petal = document.createElement("img");

    petal.src = "/petal.svg";

    petal.className = "petal";

    const size = 14 + Math.random() * 22;

    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;

    petal.style.left = `${Math.random() * 100}vw`;

    petal.style.animationDuration =
      `${8 + Math.random() * 6}s`;

    petal.style.opacity =
      `${0.3 + Math.random() * 0.7}`;

    petal.style.setProperty(
      "--drift",
      `${Math.random() * 300 - 150}px`
    );

    petal.style.setProperty(
      "--rotate",
      `${Math.random() * 720}deg`
    );

    document.body.appendChild(petal);

    petal.addEventListener("animationend", () => {

      petal.remove();

    });

  }

  setInterval(() => {

    if (document.querySelectorAll(".petal").length < MAX_PETALS) {

      createPetal();

    }

  }, 250);

});
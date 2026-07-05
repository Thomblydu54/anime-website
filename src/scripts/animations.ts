document.addEventListener("DOMContentLoaded", () => {

  const container = document.body;

  function createPetal(): void {

    const petal = document.createElement("div");

    petal.className = "petal";

    petal.style.left = `${Math.random() * window.innerWidth}px`;

    petal.style.animationDuration = `${8 + Math.random() * 8}s`;

    petal.style.animationDelay = `${Math.random() * 2}s`;

    petal.style.opacity = `${0.4 + Math.random() * 0.6}`;

    petal.style.transform = `scale(${0.5 + Math.random()})`;

    container.appendChild(petal);

    petal.addEventListener("animationend", () => {
      petal.remove();
    });

  }

  window.setInterval(createPetal, 400);

});
(function () {
  var orbit = document.getElementById("orbit");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  if (!orbit || cards.length === 0) return;

  var count = cards.length;
  var paused = false;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var angle = 0;
  var last = performance.now();

  function place(index, nextAngle, width, isReduced) {
    var theta = isReduced
      ? -62 + (index * 124) / (count - 1)
      : nextAngle + index * (360 / count);
    var rad = (theta * Math.PI) / 180;
    var depth = (Math.cos(rad) + 1) / 2;
    var rx = Math.min(228, width * 0.32);

    return {
      x: Math.sin(rad) * rx,
      y: (1 - depth) * 28,
      scale: 0.76 + depth * 0.24,
      yaw: Math.sin(rad) * -14,
      z: Math.round(depth * 100),
      width: Math.min(168, Math.max(128, width * 0.24)),
      shadow: 0.08 + depth * 0.14,
    };
  }

  function layout(nextAngle) {
    var width = orbit.clientWidth || 720;
    var isReduced = reduced.matches;
    cards.forEach(function (card, index) {
      var spot = place(index, nextAngle, width, isReduced);
      card.style.width = spot.width + "px";
      card.style.zIndex = String(spot.z);
      card.style.transform =
        "translate(-50%, -50%) translate3d(" +
        spot.x +
        "px, " +
        spot.y +
        "px, 0) rotateY(" +
        spot.yaw +
        "deg) scale(" +
        spot.scale +
        ")";
      card.style.boxShadow =
        "0 " +
        (10 + spot.shadow * 40) +
        "px " +
        (28 + spot.shadow * 30) +
        "px -18px rgba(0, 0, 0, " +
        spot.shadow +
        ")";
    });
  }

  function tick(now) {
    var delta = now - last;
    last = now;
    if (!reduced.matches && !paused && document.visibilityState === "visible") {
      angle = (angle + delta * 0.008) % 360;
    }
    layout(angle);
    window.requestAnimationFrame(tick);
  }

  orbit.addEventListener("pointerenter", function () {
    paused = true;
  });
  orbit.addEventListener("pointerleave", function () {
    paused = false;
  });
  reduced.addEventListener("change", function () {
    layout(angle);
  });

  layout(0);
  window.requestAnimationFrame(tick);
})();

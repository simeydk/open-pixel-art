const canvas = document.getElementById('pixel-canvas');
const rects = Array.from(
  document.querySelectorAll('#pixel-canvas .pixel-rect')
);
const images = Array.from(
  document.querySelectorAll('#pixel-canvas .pixel-image')
);
// hide image-pixels on load
images.forEach(image => image.remove());

let showImages = false;

// add additional 'x-start' and 'y-start' and original index attributes
rects.forEach((rect, i) => {
  rect.setAttribute('x-start', rect.getAttribute('x'));
  rect.setAttribute('y-start', rect.getAttribute('y'));
  rect.setAttribute('key', i)
});

document.addEventListener('keydown', onKeyDown);

function onKeyDown(event) {
  // don't interfere with copy/paste/reload
  const isControlAction = event.metaKey || event.ctrlKey;
  if (isControlAction) {
    return;
  }

  const { key } = event;
  const keyMap = {
    Escape: reset,
    r: random,
    o: order,
    t: twist,
    f: flip,
    v: vert,
    w: walk,
    g: gravity,
    l: loop,
    a: toggleImages,
    p: runAll
  };

  const f = keyMap[key];
  if (f) {
    f();
    event.preventDefault();
  }
}

const loopTimeoutPeriod = 750;
let isLooping = false;
let isRunningAll = false;
let latestCommand = null;
let loopingTimeout = null;
let runningAllTimeout = null;
const width = 40;
const height = 40;

function runAll() {
  isLooping = false;
  latestCommand = null;
  clearTimeout(loopingTimeout);

  isRunningAll = true;

  const effects = [order, reset, twist, flip, vert, random, walk, reset];

  runningTimeout = runFirst(effects);
}

function runFirst(effects) {
  if (!isRunningAll) {
    // running all was cancelled
    return;
  }

  const [firstEffect, ...remainingEffects] = effects;

  firstEffect();

  if (remainingEffects.length === 0) {
    // there are no remainig effects to queue
    return;
  }

  return setTimeout(() => {
    runFirst(remainingEffects);
  }, loopTimeoutPeriod);
}

function setTimeEffect(effect, time) {
  setTimeout(() => {
    effect();
  }, time);
}

function reset() {
  latestCommand = null;
  transform(({ xStart, yStart }) => [xStart, yStart]);
}

function random() {
  latestCommand = random;
  const coords = allCells().sort(() => Math.random() - 0.5);
  transform(({ i }) => [coords[i].x, coords[i].y]);
}

function order() {
  latestCommand = order;
  const f = ({ i }) => [(i % width) * 10, Math.floor(i / width) * 10];
  transform(f);
}

function flip() {
  latestCommand = flip;
  transform(({ x, y }) => [390 - x, y]);
}

function vert() {
  latestCommand = vert;
  transform(({ x, y }) => [x, 390 - y]);
}

function twist() {
  latestCommand = twist;
  transform(({ x, y }) => [390 - y, x]);
}

function gravity() {
  // create an array of arrays for every column
  const cols = Array.from({length:width},() => []) 
  rects.forEach(rect => cols[rectToObj(rect).x / 10].push(rect))
  cols.forEach(col => {
    col.sort((b,a) => rectToObj(a).y - rectToObj(b).y)
    col.forEach((rect, i) => {
      const y = (height-i-1) * 10
      const key = rect.getAttribute('key')
      rect.setAttribute('y', y)
      images[key].setAttribute('y', y)
    })
  })
}

function walk() {
  latestCommand = walk;
  transform(w);
}

function loop() {
  isLooping = !isLooping;

  isRunningAll = false;
  clearTimeout(runningAllTimeout);

  loopFunction();
}

function loopFunction() {
  if (!isLooping) {
    return;
  }

  if (latestCommand) {
    latestCommand();
  }

  loopingTimeout = setTimeout(loopFunction, loopTimeoutPeriod);
}

const nudges = [[10, 0], [-10, 0], [0, 10], [0, -10]];
const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];
const between = (min, value, max) => Math.min(Math.max(value, min), max);
const w = ({ x, y }) => {
  const [dx, dy] = randomElement(nudges);
  const newX = between(0, x + dx, 390);
  const newY = between(0, y + dy, 390);
  return [newX, newY];
};

function rectToObj(rect) {
  const [x, y, xStart, yStart] = ['x', 'y', 'x-start', 'y-start'].map(
    key => rect.getAttribute(key)
  );
  return {x, y, xStart, yStart};
}

function transform(transformFunction) {
  rects.forEach((rect, i) => {
    const image = images[i];
    const [x, y, xStart, yStart] = ['x', 'y', 'x-start', 'y-start'].map(j =>
      Number(rect.getAttribute(j))
    );
    const [xNew, yNew] = transformFunction({ x, y, xStart, yStart, i });
    rect.setAttribute('x', xNew);
    rect.setAttribute('y', yNew);
    image.setAttribute('x', xNew);
    image.setAttribute('y', yNew);
  });
}

function toggleImages() {
  showImages = !showImages;
  if (showImages) {
    rects.forEach(rect => rect.remove());
    images.forEach(image => {
      const name = image.getAttribute('name');
      image.classList.remove('hidden');
      image.setAttribute(
        'xlink:href',
        `//avatars.githubusercontent.com/${name}?size=20`
      );
      canvas.appendChild(image);
    });
  } else {
    rects.forEach(rect => canvas.appendChild(rect));
    images.forEach(image => image.remove());
  }
}

function allCells() {
  const all = [];
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      all.push({ x: i * 10, y: j * 10 });
    }
  }
  return all;
}

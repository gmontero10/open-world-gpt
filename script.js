const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const mapCanvas = document.getElementById("map");
const mapCtx = mapCanvas.getContext("2d");
const coordsEl = document.getElementById("coords");
const biomeEl = document.getElementById("biome");
const discoveriesEl = document.getElementById("discoveries");
const journalEl = document.getElementById("journal");
const questsEl = document.getElementById("quests");

const world = {
  width: 3200,
  height: 2200,
  tileSize: 80,
};

const player = {
  x: world.width / 2,
  y: world.height / 2,
  speed: 3,
  sprint: 1.6,
  radius: 14,
};

const keys = new Set();
const landmarks = [];
const discoveries = new Set();
const journal = [];
const quests = [
  "Locate the Starfall Beacon in the Verdant Basin.",
  "Survey three landmarks in the Crystal Ridge.",
  "Reach the Whispering Dunes outpost.",
];

const biomes = [
  {
    name: "Verdant Basin",
    color: "#1f5f3c",
    detail: "#2c8a55",
  },
  {
    name: "Crystal Ridge",
    color: "#2b3a64",
    detail: "#4666b0",
  },
  {
    name: "Whispering Dunes",
    color: "#604a2f",
    detail: "#9b7c4b",
  },
  {
    name: "Aurora Flats",
    color: "#2f4f4f",
    detail: "#5aa6a6",
  },
];

const decorations = [
  { type: "Tree Cluster", hue: "#3da35a" },
  { type: "Solar Ruins", hue: "#d7b76c" },
  { type: "Crystal Spire", hue: "#6fa8ff" },
  { type: "Canyon Arch", hue: "#cc7f4b" },
  { type: "Ancient Totem", hue: "#b16bd6" },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const biomeAt = (x, y) => {
  const index = Math.floor(((x / world.width) * 2 + (y / world.height) * 3) * biomes.length) %
    biomes.length;
  return biomes[index];
};

const generateLandmarks = () => {
  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const seed = i * 133.7;
    const x = seededRandom(seed) * (world.width - 200) + 100;
    const y = seededRandom(seed + 42.1) * (world.height - 200) + 100;
    const deco = decorations[i % decorations.length];
    landmarks.push({
      id: `landmark-${i}`,
      x,
      y,
      name: deco.type,
      hue: deco.hue,
    });
  }
};

generateLandmarks();

const addJournalEntry = (title, description) => {
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  journal.unshift({ title, description, stamp });
  if (journal.length > 14) {
    journal.pop();
  }
  renderJournal();
};

const renderJournal = () => {
  journalEl.innerHTML = "";
  journal.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "log-entry";
    card.innerHTML = `<span>${entry.stamp}</span><strong>${entry.title}</strong><div>${entry.description}</div>`;
    journalEl.appendChild(card);
  });
};

const renderQuests = () => {
  questsEl.innerHTML = "";
  quests.forEach((quest) => {
    const li = document.createElement("li");
    li.textContent = quest;
    questsEl.appendChild(li);
  });
};

const updateHUD = () => {
  coordsEl.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
  biomeEl.textContent = biomeAt(player.x, player.y).name;
  discoveriesEl.textContent = discoveries.size;
};

const handleMovement = () => {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const mag = Math.hypot(dx, dy) || 1;
    const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight") ? player.sprint : 1;
    player.x += (dx / mag) * player.speed * sprint;
    player.y += (dy / mag) * player.speed * sprint;
    player.x = clamp(player.x, 40, world.width - 40);
    player.y = clamp(player.y, 40, world.height - 40);
  }
};

const checkDiscoveries = () => {
  landmarks.forEach((landmark) => {
    const distance = Math.hypot(player.x - landmark.x, player.y - landmark.y);
    if (distance < 60 && !discoveries.has(landmark.id)) {
      discoveries.add(landmark.id);
      addJournalEntry(
        `Discovery: ${landmark.name}`,
        `You charted a ${landmark.name.toLowerCase()} shimmering in ${biomeAt(landmark.x, landmark.y).name}.`
      );
    }
  });
};

const drawWorld = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const offsetX = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
  const offsetY = clamp(player.y - canvas.height / 2, 0, world.height - canvas.height);

  const startX = Math.floor(offsetX / world.tileSize);
  const startY = Math.floor(offsetY / world.tileSize);
  const endX = Math.ceil((offsetX + canvas.width) / world.tileSize);
  const endY = Math.ceil((offsetY + canvas.height) / world.tileSize);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const tileX = x * world.tileSize;
      const tileY = y * world.tileSize;
      const biome = biomeAt(tileX, tileY);
      ctx.fillStyle = biome.color;
      ctx.fillRect(tileX - offsetX, tileY - offsetY, world.tileSize, world.tileSize);

      ctx.strokeStyle = "rgba(15, 20, 30, 0.4)";
      ctx.strokeRect(tileX - offsetX, tileY - offsetY, world.tileSize, world.tileSize);

      ctx.fillStyle = biome.detail;
      const dotCount = 2 + Math.floor(seededRandom(x * 77 + y * 33) * 4);
      for (let i = 0; i < dotCount; i += 1) {
        const dx = seededRandom((x + 1) * (i + 1) * 55) * world.tileSize;
        const dy = seededRandom((y + 2) * (i + 3) * 34) * world.tileSize;
        ctx.beginPath();
        ctx.arc(tileX - offsetX + dx, tileY - offsetY + dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  landmarks.forEach((landmark) => {
    const x = landmark.x - offsetX;
    const y = landmark.y - offsetY;
    if (x < -100 || y < -100 || x > canvas.width + 100 || y > canvas.height + 100) {
      return;
    }
    ctx.fillStyle = landmark.hue;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.stroke();
    ctx.fillStyle = "rgba(240, 248, 255, 0.9)";
    ctx.font = "12px sans-serif";
    ctx.fillText(landmark.name, x + 22, y + 4);
  });

  ctx.fillStyle = "#f6fbff";
  ctx.beginPath();
  ctx.arc(player.x - offsetX, player.y - offsetY, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(58, 102, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();
};

const drawMinimap = () => {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  const scaleX = mapCanvas.width / world.width;
  const scaleY = mapCanvas.height / world.height;

  biomes.forEach((biome, index) => {
    mapCtx.fillStyle = biome.color;
    const sliceWidth = mapCanvas.width / biomes.length;
    const sliceHeight = mapCanvas.height / biomes.length;
    mapCtx.fillRect(sliceWidth * index, 0, sliceWidth, mapCanvas.height);
    mapCtx.fillRect(0, sliceHeight * index, mapCanvas.width, sliceHeight);
  });

  landmarks.forEach((landmark) => {
    mapCtx.fillStyle = landmark.hue;
    mapCtx.fillRect(landmark.x * scaleX - 2, landmark.y * scaleY - 2, 4, 4);
  });

  mapCtx.fillStyle = "#ffffff";
  mapCtx.beginPath();
  mapCtx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
  mapCtx.fill();
};

const gameLoop = () => {
  handleMovement();
  checkDiscoveries();
  updateHUD();
  drawWorld();
  drawMinimap();
  requestAnimationFrame(gameLoop);
};

const handleInteract = () => {
  const nearby = landmarks.find((landmark) => Math.hypot(player.x - landmark.x, player.y - landmark.y) < 80);
  if (nearby) {
    addJournalEntry(
      `Scanned ${nearby.name}`,
      `You collect data from the ${nearby.name.toLowerCase()} and mark it for future research.`
    );
  } else {
    addJournalEntry("Field Note", "The winds are calm. No notable structures nearby.");
  }
};

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    handleInteract();
    return;
  }
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

renderQuests();
addJournalEntry("Expedition Start", "Drop zone secure. Begin mapping the frontier.");
requestAnimationFrame(gameLoop);

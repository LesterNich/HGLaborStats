const itemsPerPage = 20;
let page = 0;
let sort = "kills";

document.addEventListener("DOMContentLoaded", updatePlayerList);

const pageText = document.querySelector(".page");
const sortText = document.querySelector(".sortby-text");
const playerListTable = document.querySelector(".player-list-body");
const modalStatsTable = document.querySelector(".modal-stats-table-body");
const btnNextPage = document.querySelector(".btn-next");
const btnPrevPage = document.querySelector(".btn-prev");
const btnNextPage10 = document.querySelector(".btn-next-10");
const btnPrevPage10 = document.querySelector(".btn-prev-10");
const playerStatsModal = document.querySelector(".player-stats-modal");
const btnCloseModal = document.querySelector(".btn-close-modal");
const modalHeading = document.querySelector(".heading-player");
const modalUUID = document.querySelector(".heading-uuid");
const modalPlayerBodyImg = document.querySelector(".player-body");
const searchInputField = document.querySelector(".header-search-input");
const searchBtn = document.querySelector(".header-search-btn");
const modalPlayerKills = document.querySelector(".player-kills");
const modalPlayerDeaths = document.querySelector(".player-deaths");
const modalPlayerKD = document.querySelector(".player-kd");
const modalPlayerBounty = document.querySelector(".player-bounty");
const modalPlayerXP = document.querySelector(".player-xp");
const modalPlayerKS = document.querySelector(".player-ks");
const modalPlayerHKS = document.querySelector(".player-hks");

// Eventlistener für die Buttons (nicht mehrfach registrieren)
btnNextPage.addEventListener("click", changePage.bind(null, 1));
btnPrevPage.addEventListener("click", changePage.bind(null, -1));
btnNextPage10.addEventListener("click", changePage.bind(null, 10));
btnPrevPage10.addEventListener("click", changePage.bind(null, -10));
btnCloseModal.addEventListener("click", hideModal);
playerStatsModal.addEventListener("click", (e) => {
  if (
    e.target === playerStatsModal ||
    e.target === document.querySelector(".player-stats-modal .container")
  )
    hideModal();
});
searchBtn.addEventListener("click", async () => {
  const searchValue = searchInputField.value;
  let playerId;
  let username;
  await fetch(`https://playerdb.co/api/player/minecraft/${searchValue}`)
    .then((res) => res.json())
    .then((res) => {
      const p = res.data.player;
      playerId = p.id;
      username = p.username;
    })
    .catch((e) => {
      console.error("Player does not exist, Error:" + e);
    });
  if (playerId && username) showModal(playerId, username);
  searchInputField.value = "";
});

async function updatePlayerList() {
  const realpage = Math.floor((itemsPerPage * page) / 100) + 1;

  try {
    const response = await fetch(
      `https://api.hglabor.de/stats/FFA/top?sort=${sort}&page=${realpage}`
    );
    const players = await response.json();

    // Index der Spieler berechnen
    players.forEach((player, i) => {
      player.index = i + (realpage - 1) * 100;
    });

    // Aktuelle Seite aus `players` herausschneiden
    const playersSliced = players.slice(
      itemsPerPage * (page % 5),
      itemsPerPage * ((page % 5) + 1)
    );

    // Spieler-Avatare & Namen parallel abrufen (Performance-Boost)
    const playerDataRequests = playersSliced.map((p) =>
      fetch(`https://playerdb.co/api/player/minecraft/${p.playerId}`)
        .then((res) => res.json())
        .then((data) => ({
          avatar: data.data?.player?.avatar || "",
          username: data.data?.player?.username || "Unknown",
          ...p,
        }))
        .catch(() => ({ avatar: "", username: "Unknown", ...p }))
    );

    const playersWithDetails = await Promise.all(playerDataRequests);

    // Tabelle HTML erstellen
    playerListTable.innerHTML = `
      <tr class="player-list-criteria">
        <th>Place</th>
        <th>Player</th>
        <th class="criterium" data-sort="kills">Kills</th>
        <th class="criterium" data-sort="deaths">Deaths</th>
        <th class="criterium" data-sort="bounty">Bounty</th>
        <th class="criterium" data-sort="highestKillStreak">Highest Kill Streak</th>
        <th class="criterium" data-sort="xp">XP</th>
      </tr>
      ${playersWithDetails
        .map(
          (p) => `
        <tr onclick="showModal('${p.playerId}','${p.username}')">
          <td>${p.index + 1}</td>
          <td><img src="${p.avatar}" class="player-avatar">${p.username}</td>
          <td>${p.kills}</td>
          <td>${p.deaths}</td>
          <td>${p.bounty}</td>
          <td>${p.highestKillStreak}</td>
          <td>${p.xp}</td>
        </tr>
      `
        )
        .join("")}
    `;

    // Aktuelle Seite anzeigen
    pageText.textContent = page + 1;

    // Sortierungsbuttons aktualisieren (keine mehrfachen Eventlistener)
    document.querySelectorAll(".criterium").forEach((el) => {
      el.classList.toggle("active", el.dataset.sort === sort);
      el.onclick = () => {
        if (el.dataset.sort !== sort) {
          sort = el.dataset.sort;
          sortText.textContent = `Top Players (sorted by ${sort})`;
          page = 0;
          updatePlayerList();
        }
      };
    });
  } catch (error) {
    console.error("Failed to load data:", error);
    playerListTable.innerHTML =
      "<tr><td colspan='7'>Failed to load data.</td></tr>";
  }
}

async function updateModalStatsList(playerId) {
  const data = await fetch(`https://api.hglabor.de/stats/FFA/${playerId}`)
    .then((res) => res.json())
    .catch((e) => console.warn("Player does not exist in Database: " + e));
  modalPlayerKills.textContent = data.kills;
  modalPlayerDeaths.textContent = data.deaths;
  modalPlayerKD.textContent =
    Math.round((data.kills / data.deaths) * 100) / 100;
  modalPlayerBounty.textContent = data.bounty;
  modalPlayerXP.textContent = data.xp;
  modalPlayerKS.textContent = data.currentKillStreak;
  modalPlayerHKS.textContent = data.highestKillStreak;
}

// Seitenwechsel-Funktion
function changePage(direction) {
  crtPage = page;
  page = Math.max(page + direction, 0);
  if (crtPage === page) return;
  updatePlayerList();
}

async function showModal(playerId, username) {
  const body = await fetch(
    `https://crafatar.com/renders/body/${playerId}?scale=9&overlay`
  ).then((res) => res.url);
  await updateModalStatsList(playerId);
  modalPlayerBodyImg.src = body;
  modalHeading.textContent = username;
  modalUUID.textContent = playerId;
  playerStatsModal.classList.add("visible");
}

function hideModal() {
  playerStatsModal.classList.remove("visible");
}

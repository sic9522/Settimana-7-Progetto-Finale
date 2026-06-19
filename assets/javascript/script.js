const search = document.querySelector('#search');
const searchBtn = document.querySelector('#searchBtn');
const results = document.querySelector('#results');
const favoritesDiv = document.querySelector('#favorites');
const eventsCard = document.querySelector('#eventsCard');
const searchPlaceholder = document.querySelector('#searchPlaceholder');
const favoritesPlaceholder = document.querySelector('#favoritesPlaceholder');
const clearFavoritesBtn = document.querySelector('#clearFavoritesBtn');
const eventsSection = document.querySelector('#eventsSection');
const leaguesList = document.querySelector('#leaguesList');
const toastContainer = document.querySelector('#toastContainer');
const confirmClearModalEl = document.querySelector('#confirmClearModal');
const confirmClearModal = new bootstrap.Modal(confirmClearModalEl);
const confirmClearBtn = document.querySelector('#confirmClearBtn');
const sportsDb = "https://www.thesportsdb.com/api/v1/json/3";
const placeholderBadge = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cccccc"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/></svg>'
);

//toast

function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast-message');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(function () {
        toast.classList.add('show');
    });
    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 2500);
}

//loading state

function showSpinner(container) {
    container.replaceChildren();
    const wrapper = document.createElement('div');
    wrapper.classList.add('d-flex', 'justify-content-center', 'my-4');
    const spinner = document.createElement('div');
    spinner.classList.add('spinner-border', 'text-primary');
    spinner.setAttribute('role', 'status');
    const srText = document.createElement('span');
    srText.classList.add('visually-hidden');
    srText.textContent = 'Caricamento...';
    spinner.appendChild(srText);
    wrapper.appendChild(spinner);
    container.appendChild(wrapper);
}

function showError(container, message) {
    container.replaceChildren();
    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    container.appendChild(errorMessage);
}

//fetch

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Richiesta fallita con stato ${res.status}`);
    }
    return res.json();
}

async function searchTeams(teamName) {
    const data = await fetchJson(`${sportsDb}/searchteams.php?t=${encodeURIComponent(teamName)}`);
    return data.teams;
}

async function getNextEvents(teamId) {
    const data = await fetchJson(`${sportsDb}/eventsnext.php?id=${teamId}`);
    return data.events;
}

async function getLastEvents(teamId) {
    const data = await fetchJson(`${sportsDb}/eventslast.php?id=${teamId}`);
    return data.results;
}

async function getLeagueTeams(leagueName) {
    const data = await fetchJson(`${sportsDb}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`);
    return data.teams;
}

search.addEventListener('input', function () {
    const value = search.value;
    if (value.length > 0) {
        const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
        if (capitalized !== value) {
            const cursorPosition = search.selectionStart;
            search.value = capitalized;
            search.setSelectionRange(cursorPosition, cursorPosition);
        }
    }
});

//addevent su cerca

async function handleSearch() {
    const newSearch = search.value.trim();
    if (!newSearch) return;
    search.value = '';

    searchPlaceholder.classList.add('d-none');
    eventsSection.classList.add('d-none');
    showSpinner(results);

    let teams;
    try {
        teams = await searchTeams(newSearch);
    } catch (error) {
        console.error('Errore durante la ricerca:', error);
        showError(results, 'Errore durante la ricerca, riprova più tardi.');
        return;
    }

    render(teams);

    if (!teams || teams.length === 0) {
        return;
    }

    eventsSection.classList.remove('d-none');
    showSpinner(eventsCard);
    try {
        const firstTeam = teams[0];
        const nextEvents = await getNextEvents(firstTeam.idTeam);
        const lastEvents = await getLastEvents(firstTeam.idTeam);
        renderEvents(firstTeam, nextEvents, lastEvents);
    } catch (error) {
        console.error('Errore nel caricamento degli eventi:', error);
        showError(eventsCard, 'Errore nel caricamento dei dettagli, riprova più tardi.');
    }
}

searchBtn.addEventListener('click', handleSearch);

search.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

//render teams

function buildTeamCard(team, actionBtn) {
    const card = document.createElement('div');
    card.classList.add('cardGroup');
    if (team.strSport) {
        const sportBadge = document.createElement('span');
        sportBadge.classList.add('sportBadge');
        sportBadge.textContent = team.strSport;
        card.appendChild(sportBadge);
    }
    const imgTeam = document.createElement('img');
    imgTeam.src = team.strBadge || placeholderBadge;
    imgTeam.alt = team.strTeam;
    imgTeam.addEventListener('error', function () {
        imgTeam.src = placeholderBadge;
    });
    const nameTeam = document.createElement('h5');
    nameTeam.textContent = team.strTeam;
    const leagueTeam = document.createElement('p');
    leagueTeam.textContent = team.strLeague;
    const countryTeam = document.createElement('p');
    countryTeam.textContent = team.strCountry;
    card.appendChild(imgTeam);
    card.appendChild(nameTeam);
    card.appendChild(leagueTeam);
    card.appendChild(countryTeam);
    card.appendChild(actionBtn);

    card.addEventListener('click', async function () {
        eventsSection.classList.remove('d-none');
        showSpinner(eventsCard);
        try {
            const nextEvents = await getNextEvents(team.idTeam);
            const lastEvents = await getLastEvents(team.idTeam);
            renderEvents(team, nextEvents, lastEvents);
        } catch (error) {
            console.error('Errore nel caricamento degli eventi:', error);
            showError(eventsCard, 'Errore nel caricamento dei dettagli, riprova più tardi.');
        }
    });

    return card;
}

function render(teams) {
    results.replaceChildren();
    if (!teams) {
        const message = document.createElement('p');
        message.textContent = 'Nessuna squadra trovata !'
        results.appendChild(message);
        return;
    }
    const favoriteTeams = getFavorites();
    teams.forEach(function (team) {
        const isFavorite = favoriteTeams.some(function (fav) {
            return fav.idTeam === team.idTeam;
        });
        const addBtn = document.createElement('button');
        addBtn.classList.add('cardBtn', 'addBtn');
        if (isFavorite) {
            addBtn.textContent = '✅Già tra i preferiti';
            addBtn.disabled = true;
        } else {
            addBtn.textContent = 'Aggiungi ai preferiti';
            addBtn.addEventListener('click', function (event) {
                event.stopPropagation();
                const added = addFavorites(team);
                if (added) {
                    addBtn.textContent = '✅Già tra i preferiti';
                    addBtn.disabled = true;
                }
            });
        }

        results.appendChild(buildTeamCard(team, addBtn));
    });
}

//localstorage
function getFavorites() {
    const data = localStorage.getItem('favorites');
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Dati preferiti corrotti, reset alla lista vuota:', error);
        return [];
    }
}

function saveFavorites(favoriteTeams) {
    localStorage.setItem('favorites', JSON.stringify(favoriteTeams));
}

//addevent addBtn

function addFavorites(team) {
    const favoriteTeams = getFavorites();
    const present = favoriteTeams.some(function (fav) {
        return fav.idTeam === team.idTeam;
    });
    if (present) return false;
    if (favoriteTeams.length >= 4) {
        showToast('Puoi aggiungere al massimo 4 squadre preferite.');
        return false;
    }
    favoriteTeams.push(team);
    saveFavorites(favoriteTeams);
    renderFavorites();
    showToast('Squadra aggiunta!');
    return true;
}

function removeFavorites(team) {
    const favoriteTeams = getFavorites();
    const updatedFavorites = favoriteTeams.filter(function (fav) {
        return fav.idTeam !== team.idTeam;
    });
    saveFavorites(updatedFavorites);
    renderFavorites();
    showToast('Squadra eliminata');
}

clearFavoritesBtn.addEventListener('click', function () {
    confirmClearModal.show();
});

confirmClearBtn.addEventListener('click', function () {
    saveFavorites([]);
    renderFavorites();
    showToast('Tutte le squadre rimosse');
    confirmClearModal.hide();
});

//render favorite

function renderFavorites() {
    favoritesDiv.replaceChildren();
    const favoriteTeams = getFavorites();
    if (favoriteTeams.length === 0) {
        favoritesPlaceholder.classList.remove('d-none');
        clearFavoritesBtn.classList.add('d-none');
    } else {
        favoritesPlaceholder.classList.add('d-none');
        clearFavoritesBtn.classList.remove('d-none');
    }
    const row = document.createElement('div');
    row.classList.add('row', 'justify-content-center');
    favoriteTeams.forEach(function (team, index) {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Elimina dai preferiti'
        removeBtn.classList.add('cardBtn', 'removeBtn');
        removeBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            removeFavorites(team);
        });

        const card = buildTeamCard(team, removeBtn);

        const col = document.createElement('div');
        const isLastMdOrphan = index === favoriteTeams.length - 1 && favoriteTeams.length % 2 !== 0;
        col.classList.add('col-12', 'favoriteCol');
        col.classList.add(isLastMdOrphan ? 'col-md-12' : 'col-md-6');
        col.classList.add('col-lg-3');
        col.appendChild(card);
        row.appendChild(col);
    });
    favoritesDiv.appendChild(row);
}

// funzione eventi
function renderEvents(team, nextEvents, lastEvents) {
    eventsCard.replaceChildren();
    const card = document.createElement('div');
    card.classList.add('cardResults');
    const eventTeam = document.createElement('h3');
    eventTeam.textContent = team.strTeam;
    card.appendChild(eventTeam);
    const row = document.createElement('div');
    row.classList.add('row');
    const nextCol = document.createElement('div');
    nextCol.classList.add('col-12', 'col-lg-6');
    const eventNext = document.createElement('h5');
    eventNext.textContent = 'Prossimi eventi'
    nextCol.appendChild(eventNext);
    if (!nextEvents) {
        const noEvents = document.createElement('p');
        noEvents.classList.add('noEventsMessage');
        noEvents.textContent = 'Nessun evento in programma'
        nextCol.appendChild(noEvents);
    } else {
        const nextEvent = nextEvents[0];
        const dataEvent = document.createElement('p')
        dataEvent.textContent = `${nextEvent.dateEvent}`;
        const yesEvents = document.createElement('h6');
        yesEvents.textContent = `${nextEvent.strEvent}`;
        nextCol.appendChild(dataEvent);
        nextCol.appendChild(yesEvents);
    }

    const lastCol = document.createElement('div');
    lastCol.classList.add('col-12', 'col-lg-6');
    const eventLast = document.createElement('h5');
    eventLast.textContent = 'Ultimi risultati'
    lastCol.appendChild(eventLast);
    if (!lastEvents) {
        const noEvents = document.createElement('p');
        noEvents.classList.add('noEventsMessage');
        noEvents.textContent = 'Nessuna partita trovata'
        lastCol.appendChild(noEvents)
    } else {
        const lastEvent = lastEvents[0];
        const dataEvent = document.createElement('p');
        dataEvent.textContent = `${lastEvent.dateEvent}`;
        lastCol.appendChild(dataEvent);
        const matchRow = document.createElement('div');
        matchRow.classList.add('d-flex', 'align-items-center', 'gap-2');
        const yesEvents = document.createElement('h6');
        yesEvents.textContent = `${lastEvent.strHomeTeam} vs ${lastEvent.strAwayTeam}`;
        matchRow.appendChild(yesEvents);
        const isHome = lastEvent.idHomeTeam === team.idTeam;
        const teamScore = isHome ? Number(lastEvent.intHomeScore) : Number(lastEvent.intAwayScore);
        const opponentScore = isHome ? Number(lastEvent.intAwayScore) : Number(lastEvent.intHomeScore);
        const scoreBadge = document.createElement('span');
        scoreBadge.textContent = `${lastEvent.intHomeScore} - ${lastEvent.intAwayScore}`;
        scoreBadge.classList.add('resultBadge');
        if (teamScore > opponentScore) {
            scoreBadge.classList.add('badgeWin');
        } else if (teamScore < opponentScore) {
            scoreBadge.classList.add('badgeLoss');
        } else {
            scoreBadge.classList.add('badgeDraw');
        }
        matchRow.appendChild(scoreBadge);

        lastCol.appendChild(matchRow);
    }

    const stadiumCol = document.createElement('div');
    stadiumCol.classList.add('col-12', 'col-lg-6');
    const eventStadium = document.createElement('h5');
    eventStadium.textContent = 'Stadio';
    stadiumCol.appendChild(eventStadium);
    if (!team.strStadium) {
        const noStadium = document.createElement('p');
        noStadium.textContent = 'Nessuna informazione sullo stadio';
        stadiumCol.appendChild(noStadium);
    } else {
        const stadiumName = document.createElement('h6');
        stadiumName.classList.add('stadiumName');
        stadiumName.textContent = team.strStadium;
        stadiumCol.appendChild(stadiumName);
        const stadiumLocation = document.createElement('p');
        stadiumLocation.textContent = team.strLocation;
        stadiumCol.appendChild(stadiumLocation);
        if (team.intStadiumCapacity) {
            const stadiumCapacity = document.createElement('p');
            stadiumCapacity.textContent = `Capienza: ${team.intStadiumCapacity}`;
            stadiumCol.appendChild(stadiumCapacity);
        }
    }

    row.appendChild(nextCol);
    row.appendChild(lastCol);
    row.appendChild(stadiumCol);
    card.appendChild(row);
    eventsCard.appendChild(card);
}

//addevent campionati

leaguesList.addEventListener('click', async function (event) {
    const li = event.target.closest('li[data-league]');
    if (!li) return;

    const openList = li.querySelector('.leagueTeams');
    const otherOpenList = leaguesList.querySelector('.leagueTeams');
    if (otherOpenList) {
        otherOpenList.remove();
    }
    if (openList) {
        return;
    }

    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('d-flex', 'justify-content-center', 'my-2');
    const spinner = document.createElement('div');
    spinner.classList.add('spinner-border', 'spinner-border-sm', 'text-primary');
    spinner.setAttribute('role', 'status');
    const srText = document.createElement('span');
    srText.classList.add('visually-hidden');
    srText.textContent = 'Caricamento...';
    spinner.appendChild(srText);
    loadingIndicator.appendChild(spinner);
    li.appendChild(loadingIndicator);

    try {
        const teams = await getLeagueTeams(li.dataset.league);
        loadingIndicator.remove();
        renderLeagueTeams(li, teams);
    } catch (error) {
        console.error('Errore nel caricamento delle squadre del campionato:', error);
        loadingIndicator.remove();
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Errore nel caricamento, riprova più tardi.';
        li.appendChild(errorMessage);
    }
});

document.addEventListener('click', function (event) {
    if (leaguesList.contains(event.target)) return;
    const openList = leaguesList.querySelector('.leagueTeams');
    if (openList) {
        openList.remove();
    }
});

function renderLeagueTeams(li, teams) {
    const teamsList = document.createElement('ul');
    teamsList.classList.add('leagueTeams');
    if (!teams) {
        const message = document.createElement('li');
        message.textContent = 'Nessuna squadra trovata';
        teamsList.appendChild(message);
    } else {
        const favoriteTeams = getFavorites();
        teams.forEach(function (team) {
            const teamItem = document.createElement('li');
            teamItem.classList.add('leagueTeamItem');
            const badge = document.createElement('img');
            badge.src = team.strBadge || placeholderBadge;
            badge.alt = team.strTeam;
            badge.addEventListener('error', function () {
                badge.src = placeholderBadge;
            });
            const name = document.createElement('span');
            name.textContent = team.strTeam;
            teamItem.appendChild(badge);
            teamItem.appendChild(name);

            const isFav = favoriteTeams.some(function (fav) {
                return fav.idTeam === team.idTeam;
            });
            const favStar = document.createElement('button');
            favStar.type = 'button';
            favStar.classList.add('leagueFavBtn');
            favStar.textContent = isFav ? '★' : '☆';
            favStar.setAttribute('aria-label', isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti');
            favStar.addEventListener('click', function (event) {
                event.stopPropagation();
                if (isFav) {
                    removeFavorites(team);
                    teamsList.remove();
                } else if (addFavorites(team)) {
                    teamsList.remove();
                }
            });
            teamItem.appendChild(favStar);

            teamItem.addEventListener('click', async function (event) {
                event.stopPropagation();
                searchPlaceholder.classList.add('d-none');
                render([team]);
                eventsSection.classList.remove('d-none');
                showSpinner(eventsCard);
                try {
                    const nextEvents = await getNextEvents(team.idTeam);
                    const lastEvents = await getLastEvents(team.idTeam);
                    renderEvents(team, nextEvents, lastEvents);
                } catch (error) {
                    console.error('Errore nel caricamento degli eventi:', error);
                    showError(eventsCard, 'Errore nel caricamento dei dettagli, riprova più tardi.');
                }
            });

            teamsList.appendChild(teamItem);
        });
    }
    li.appendChild(teamsList);
}

renderFavorites();
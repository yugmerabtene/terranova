let socket;
let player = { nom: '', prenom: '', x: 0, z: 0 };
const autresJoueurs = {};
let selfElement = null;

function startGame() {
    player.nom = document.getElementById('nom').value;
    player.prenom = document.getElementById('prenom').value;

    if (!player.nom || !player.prenom) {
        alert("Merci de remplir nom et prénom.");
        return;
    }

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-canvas').style.display = 'block';

    socket = new WebSocket("ws://localhost:8765");

    socket.onopen = () => {
        console.log("[WS] Connecté au serveur");
        socket.send(JSON.stringify({
            type: "join",
            nom: player.nom,
            prenom: player.prenom
        }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "state") {
            console.log("[Serveur] " + data.message);
        }

        if (data.type === "world_state") {
            updatePlayers(data.players);
        }
    };

    setupMovement();
    requestAnimationFrame(drawLoop);
}

function setupMovement() {
    document.addEventListener("keydown", (e) => {
        const step = 5;
        if (e.key === "w") player.z -= step;
        if (e.key === "s") player.z += step;
        if (e.key === "a") player.x -= step;
        if (e.key === "d") player.x += step;

        socket.send(JSON.stringify({
            type: "move",
            x: player.x,
            z: player.z
        }));
    });
}

function updatePlayers(players) {
    const moi = `${player.nom}_${player.prenom}`;
    players.forEach(joueur => {
        let el;
        if (joueur.id === moi) {
            if (!selfElement) {
                selfElement = document.createElement("div");
                selfElement.className = "player-dot";
                selfElement.innerText = joueur.id + " (vous)";
                document.body.appendChild(selfElement);
            }
            el = selfElement;
        } else {
            el = autresJoueurs[joueur.id];
            if (!el) {
                el = document.createElement("div");
                el.className = "player-dot";
                el.innerText = joueur.id;
                document.body.appendChild(el);
                autresJoueurs[joueur.id] = el;
            }
        }

        el.style.left = (joueur.x * 5) + "px";
        el.style.top = (joueur.z * 5) + "px";
    });

    const ids = new Set(players.map(p => p.id));
    for (const id in autresJoueurs) {
        if (!ids.has(id)) {
            document.body.removeChild(autresJoueurs[id]);
            delete autresJoueurs[id];
        }
    }
}

function drawLoop() {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0f0";
    ctx.font = "20px sans-serif";
    ctx.fillText("Bienvenue " + player.nom, 20, 30);

    requestAnimationFrame(drawLoop);
}

window.startGame = startGame;

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let games = {}; // gameCode -> gameState

function createGame() {
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();
  games[code] = {
    hostSocketId: null,
    players: {}, // socketId -> { name, alive, answer }
    questions: [
         {
            id: 1,
            text: 'Welke kleur zit NIET in de Nederlandse vlag?',
            options: ['Rood', 'Wit', 'Blauw', 'Groen'],
            correctIndex: 3,
            difficulty: 'Makkelijk',
            used: false
        },
        {
            id: 2,
            text: 'Hoeveel minuten zitten er in een uur?',
            options: ['60', '90', '100', '45'],
            correctIndex: 0,
            difficulty: 'Makkelijk',
            used: false
        },
        {
            id: 3,
            text: 'In welk jaar werd de euro ingevoerd als giraal betaalmiddel?',
            options: ['1999', '2001', '2002', '1995'],
            correctIndex: 0,
            difficulty: 'Moeilijk',
            used: false
        }
  // ...tot je 25 vragen hebt
],
    currentQuestionIndex: -1,
    acceptingAnswers: false
  };
  return code;
}

io.on('connection', (socket) => {
  console.log('Nieuwe verbinding:', socket.id);

  // Host maakt game
    socket.on('host:createGame', () => {
        const code = createGame();
        games[code].hostSocketId = socket.id;
        socket.join(code);
        const game = games[code];
        socket.emit('host:gameCreated', { 
            gameCode: code,
            questions: game.questions.map((q, index) => ({
                index,
                text: q.text,
                difficulty: q.difficulty,
                used: q.used
            }))
        });
    console.log('Game aangemaakt:', code);
  });

  // Host kiest een specifieke vraag (via tegel)
    socket.on('host:selectQuestion', ({ gameCode, questionIndex }) => {
  const game = games[gameCode];
  if (!game) return;

  // Als vraag al gebruikt is, doe dan niks
  if (game.questions[questionIndex].used) {
    socket.emit('host:error', 'Deze vraag is al gebruikt.');
    return;
  }

  game.currentQuestionIndex = questionIndex;
  const question = game.questions[questionIndex];
  game.acceptingAnswers = true;

  // reset antwoorden van spelers
  Object.values(game.players).forEach((p) => (p.answer = null));

  io.to(gameCode).emit('question:new', {
    id: question.id,
    text: question.text,
    options: question.options
  });
});

  // Speler join
  socket.on('player:join', ({ gameCode, name }) => {
    const game = games[gameCode];
    if (!game) {
      socket.emit('player:error', 'Game niet gevonden');
      return;
    }
    game.players[socket.id] = { name, alive: true, answer: null };
    socket.join(gameCode);
    io.to(game.hostSocketId).emit('host:playersUpdate', {
      players: Object.values(game.players)
    });
    socket.emit('player:joined', { name, gameCode });
    console.log(`${name} joined game ${gameCode}`);
  });

  // Host start volgende vraag
  socket.on('host:nextQuestion', ({ gameCode }) => {
    const game = games[gameCode];
    if (!game) return;

    game.currentQuestionIndex++;
    if (game.currentQuestionIndex >= game.questions.length) {
      io.to(gameCode).emit('game:over', { reason: 'Geen vragen meer' });
      return;
    }

    const question = game.questions[game.currentQuestionIndex];
    game.acceptingAnswers = true;
    // reset antwoorden
    Object.values(game.players).forEach((p) => (p.answer = null));

    io.to(gameCode).emit('question:new', {
      id: question.id,
      text: question.text,
      options: question.options
    });
  });

  // Speler stuurt antwoord
  socket.on('player:answer', ({ gameCode, answerIndex }) => {
    const game = games[gameCode];
    if (!game || !game.acceptingAnswers) return;

    const player = game.players[socket.id];
    if (!player || !player.alive) return;

    // 1 antwoord per vraag
    if (player.answer !== null) return;

    player.answer = answerIndex;
  });

  // Host sluit vraag en verwerkt resultaten
  socket.on('host:closeQuestion', ({ gameCode }) => {
    const game = games[gameCode];
    if (!game) return;

    game.acceptingAnswers = false;
    const question = game.questions[game.currentQuestionIndex];

    const results = [];
    let aliveCount = 0;

    Object.entries(game.players).forEach(([id, player]) => {
      if (!player.alive) return;
      const correct = player.answer === question.correctIndex;
      if (!correct) {
        player.alive = false;
      }
      results.push({
        name: player.name,
        correct,
        alive: player.alive
      });
      if (player.alive) aliveCount++;
    });

    io.to(gameCode).emit('question:results', {
      correctIndex: question.correctIndex,
      results,
      aliveCount
    });

    // Bepaal winnaar indien nodig
    let winner = null;
    let winnerType = null; // 'player' of 'host'

    if (aliveCount === 1) {
    // zoek de enige speler die nog alive is
    const aliveEntry = Object.entries(game.players).find(([id, p]) => p.alive);
    if (aliveEntry) {
        winner = aliveEntry[1].name;
        winnerType = 'player';
    }
    } else if (aliveCount === 0) {
    // niemand meer over → de host wint (de "1" in 1-tegen-100)
    winner = 'Host';
    winnerType = 'host';
    }

    if (aliveCount <= 1) { 
    let reason;
    if (winnerType === 'player') {
        reason = `We hebben een winnaar: ${winner}!`;
    } else if (winnerType === 'host') {
        reason = 'Alle spelers zijn uitgeschakeld, de host wint!';
    } else {
        reason = 'Er is een winnaar (of niemand meer over)';
    }

    io.to(gameCode).emit('game:over', { 
        reason,
        winner,
        winnerType
    });
    }

    // Markeer vraag als gebruikt
    if (game.currentQuestionIndex >= 0) {
    game.questions[game.currentQuestionIndex].used = true;
    // update naar host zodat de tegel grijs kan worden
    io.to(game.hostSocketId).emit('host:questionUsed', { 
        index: game.currentQuestionIndex 
    });
    }

  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Verbinding verbroken:', socket.id);
    // Ruim speler op uit game(s)
    for (const [code, game] of Object.entries(games)) {
      if (game.hostSocketId === socket.id) {
        // host weg → game eindigt
        io.to(code).emit('game:over', { reason: 'Host heeft de verbinding verbroken' });
        delete games[code];
        break;
      }
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        io.to(game.hostSocketId).emit('host:playersUpdate', {
          players: Object.values(game.players)
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server luistert op http://localhost:${PORT}`);
});
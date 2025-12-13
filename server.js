require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const basicAuth = require('express-basic-auth');
const OpenAI = require('openai');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

const hostUser = process.env.HOST_USER || 'host';
const hostPassword = process.env.HOST_PASSWORD || 'quiz123';

const hostAuthMiddleware = basicAuth({
  users: { [hostUser]: hostPassword },
  challenge: true,
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/host.html', hostAuthMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

let questionBank = [
  {
    "id": 1,
    "category": "Nijmegen",
    "text": "Welke afstanden kunnen er gelopen worden tijdens de Nijmeegse Vierdaagse?",
    "options": ["10, 20, 30", "20, 30, 40", "30, 40, 50", "40, 50, 60"],
    "correctIndex": 2,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 2,
    "category": "Nijmegen",
    "text": "In welk jaar werd de Vierdaagse voor het eerst gehouden?",
    "options": ["1909", "1916", "1912", "1920"],
    "correctIndex": 0,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 3,
    "category": "Sport",
    "text": "Hoeveel spelers staan er in totaal op het veld bij een potje voetbal?",
    "options": ["10", "14", "22", "24"],
    "correctIndex": 2,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 4,
    "category": "Sport",
    "text": "Welke disciplines horen bij de paardensport op de Olympische Spelen?",
    "options": ["Mennen, Dressuur & Springen", "Endurance, Mennen & Springen", "Dressuur & Springen", "Eventing, Dressuur & Springen"],
    "correctIndex": 3,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 5,
    "category": "Entertainment",
    "text": "Welke tovenaarsschool bezoekt Harry Potter?",
    "options": ["Zweinstein", "Klammfels", "Beauxbatons", "Ilvermorny"],
    "correctIndex": 0,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 6,
    "category": "Entertainment",
    "text": "Welke film heeft wereldwijd de meeste inkomsten ooit gegenereerd",
    "options": ["Titanic (1997)", "Avatar (2009)", "Avengers: Endgame (2019)", "Star Wars: The Force Awakens (2015)"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 7,
    "category": "Nederlandse geschiedenis",
    "text": "In welk land vond de Gouden Eeuw plaats?",
    "options": ["Frankrijk", "Spanje", "Engeland", "Nederland"],
    "correctIndex": 3,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 8,
    "category": "Nederlandse geschiedenis",
    "text": "Wie was de leider van de Nederlandse Opstand tegen Spanje?",
    "options": ["Michiel de Ruyter", "Johan de Witt", "Willem van Oranje", "Maurits van Nassau"],
    "correctIndex": 2,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 9,
    "category": "Natuur/wetenschap",
    "text": "Hoeveel poten heeft een spin?",
    "options": ["6 poten", "8 poten", "10 poten", "Het zijn stelten, geen poten"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 10,
    "category": "Natuur/wetenschap",
    "text": "Welke twee elementen vormen samen water?",
    "options": ["Waterstof en zuurstof", "Koolstof en stikstof", "Zuurstof en helium", "Waterstof en koolstof"],
    "correctIndex": 0,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 11,
    "category": "Koken",
    "text": "Welk ingrediënt zit er niet standaard in een soffrito?",
    "options": ["Bleekselderij", "Ui", "Knoflook", "Wortel"],
    "correctIndex": 2,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 12,
    "category": "Koken",
    "text": "Wat doe je met groentes wanneer je deze blancheert?",
    "options": ["Garen in de oven", "Kort in kokend water onderdompelen", "In de pan bakken", "In een waterbad gelijkmatig garen"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 13,
    "category": "Schilderijen",
    "text": "In welk museum hangt de Nachtwacht van Rembrandt van Rijn?",
    "options": ["Mauritshuis", "Rembrandthuis Museum", "Het Louvre", "Rijksmuseum"],
    "correctIndex": 3,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 14,
    "category": "Schilderijen",
    "text": "Welk schilderij werd in 1911 uit het Louvre gestolen door Vincenzo Peruggia?",
    "options": ["De Kroning van Napoleon", "De Mona Lisa", "Madonna van de Rozen", "Portret van Lisa Gherardini"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 15,
    "category": "Oud Hollandsche uitspraken",
    "text": "Wat betekent de uitspraak \"de pot verwijt de ketel dat hij zwart ziet\"",
    "options": ["Opschudding veroorzaken in een situatie", "Boos zijn wanneer iemand het eten aanbrandt", "Wie fouten maakt moet daar van leren", "Iemand beschuldigen van iets waar je zelf ook schuldig aan bent"],
    "correctIndex": 3,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 16,
    "category": "Oud Hollandsche uitspraken",
    "text": "Wat betekent de uitspraak \"met de mantel der liefde bedekken\"",
    "options": ["Iets vergeven of vergoeilijken", "Iemand eren of prijzen", "Iemand ten huwelijk vragen", "Heel blij zijn iemand weer te zien"],
    "correctIndex": 0,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 17,
    "category": "Spelling",
    "text": "Wat is correct gespeld? De score bleef lange tijd",
    "options": ["gelijkopgaan", "gelijk op gaan", "gelijkop gaan", "gelijk opgaan"],
    "correctIndex": 3,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 18,
    "category": "Spelling",
    "text": "Wat is correct gespeld? Tai chi leer je pas echt als je op ... gaat.",
    "options": ["tai-chi-les", "taichi-les", "tai-chiles", "tai chi-les"],
    "correctIndex": 3,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 19,
    "category": "Balsporten",
    "text": "Op welke ondergrond wordt Roland Garros gespeeld?",
    "options": ["Gras", "Hardcourt", "Gravel", "Tapijt"],
    "correctIndex": 2,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 20,
    "category": "Balsporten",
    "text": "Hoe heet de opstelling van spelers tijdens een rugbywedstrijd?",
    "options": ["Scrum", "Try", "Line-out", "Huddle"],
    "correctIndex": 0,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 21,
    "category": "Scheikunde",
    "text": "Wat is geen chemische reactie?",
    "options": ["Het rijpen van fruit", "Het smelten van kaarsvet", "Het roesten van metaal", "Het verteren van voedsel"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 22,
    "category": "Scheikunde",
    "text": "Hoe heten de elementaire deeltjes die de bouwstenen vormen van protonen en neutronen?",
    "options": ["Ionen", "Deuterium", "Quarks", "Elektronen"],
    "correctIndex": 2,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 23,
    "category": "Jaren en periodes",
    "text": "Hoeveel jaar ben je getrouwd bij een diamanten huwelijk?",
    "options": ["20 jaar", "40 jaar", "50 jaar", "60 jaar"],
    "correctIndex": 3,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 24,
    "category": "Jaren en periodes",
    "text": "Hoeveel jaar duurde de Honderdjarige Oorlog tussen Engeland en Frankrijk?",
    "options": ["116 jaar", "100 jaar", "99 jaar", "105 jaar"],
    "correctIndex": 0,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 25,
    "category": "Dieren",
    "text": "Welke vogel kan niet vliegen?",
    "options": ["Adelaar", "Struisvogel", "Zwaluw", "Meeuw"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 26,
    "category": "Dieren",
    "text": "Wat is het grootste landdier ter wereld?",
    "options": ["Blauwe vinvis", "Neushoorn", "Giraffe", "Olifant"],
    "correctIndex": 3,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 27,
    "category": "Aardrijkskunde",
    "text": "Welke rivier stroomt door Parijs?",
    "options": ["Rijn", "Seine", "Thames", "Donau"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 28,
    "category": "Aardrijkskunde",
    "text": "Wat is de hoofdstad van Australië?",
    "options": ["Sydney", "Melbourne", "Canberra", "Perth"],
    "correctIndex": 2,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 29,
    "category": "Muziek",
    "text": "Hoeveel snaren heeft een standaard gitaar?",
    "options": ["4", "6", "8", "12"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 30,
    "category": "Muziek",
    "text": "Welke band zong het nummer \"Bohemian Rhapsody\"?",
    "options": ["The Beatles", "Queen", "ABBA", "The Rolling Stones"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 31,
    "category": "Films",
    "text": "Welke film gaat over een speelgoedcowboy genaamd Woody?",
    "options": ["Shrek", "Toy Story", "Cars", "Finding Nemo"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 32,
    "category": "Films",
    "text": "Welke film won de Oscar voor Beste Film in 1994 (uitgereikt in 1995)?",
    "options": ["Pulp Fiction", "The Shawshank Redemption", "Forrest Gump", "Four Weddings and a Funeral"],
    "correctIndex": 2,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 33,
    "category": "Technologie",
    "text": "Welke toets gebruik je om tekst te kopiëren op Windows?",
    "options": ["Ctrl + C", "Ctrl + V", "Ctrl + X", "Ctrl + Z"],
    "correctIndex": 0,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 34,
    "category": "Technologie",
    "text": "Waar staat de afkorting \"CPU\" voor?",
    "options": ["Central Processing Unit", "Computer Power Utility", "Core Processing User", "Control Program Unit"],
    "correctIndex": 0,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 35,
    "category": "Eten & drinken",
    "text": "Welk land is bekend om sushi?",
    "options": ["China", "Japan", "Thailand", "Zuid-Korea"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 36,
    "category": "Eten & drinken",
    "text": "Wat is het hoofdingrediënt van guacamole?",
    "options": ["Tomaat", "Avocado", "Komkommer", "Paprika"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 37,
    "category": "Algemeen",
    "text": "Welke planeet staat het dichtst bij de zon?",
    "options": ["Venus", "Mercurius", "Mars", "Aarde"],
    "correctIndex": 1,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 38,
    "category": "Algemeen",
    "text": "Hoeveel continenten zijn er op aarde?",
    "options": ["5", "6", "7", "8"],
    "correctIndex": 2,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 39,
    "category": "Taal",
    "text": "Wat is het meervoud van \"cactus\"?",
    "options": ["Cactussen", "Cacti", "Cactussen en cactussen", "Cactis"],
    "correctIndex": 0,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 40,
    "category": "Taal",
    "text": "Wat betekent het woord \"ambivalent\"?",
    "options": ["Eenduidig", "Tegenstrijdige gevoelens", "Heel blij", "Onzeker over een plek"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 41,
    "category": "Geschiedenis",
    "text": "In welk jaar begon de Tweede Wereldoorlog?",
    "options": ["1939", "1940", "1941", "1938"],
    "correctIndex": 0,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 42,
    "category": "Geschiedenis",
    "text": "Wie was de eerste president van de Verenigde Staten?",
    "options": ["Abraham Lincoln", "George Washington", "Thomas Jefferson", "John Adams"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  },
  {
    "id": 43,
    "category": "Wetenschap",
    "text": "Wat is de chemische formule van keukenzout?",
    "options": ["NaCl", "H2O", "CO2", "KCl"],
    "correctIndex": 0,
    "difficulty": "Makkelijk",
    "used": false
  },
  {
    "id": 44,
    "category": "Wetenschap",
    "text": "Wat is de naam van het proces waarbij planten zonlicht omzetten in energie?",
    "options": ["Fermentatie", "Fotosynthese", "Verdamping", "Osmose"],
    "correctIndex": 1,
    "difficulty": "Moeilijk",
    "used": false
  }
];

function getFreshQuestions() {
  return questionBank.map((q, index) => ({
    id: q.id ?? index + 1,
    category: q.category || 'Algemeen',
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    difficulty: q.difficulty || 'Onbekend',
    used: false,
  }));
}

let games = {}; // gameCode -> gameState

function createGame() {
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();
  games[code] = {
    hostSocketId: null,
    players: {}, // socketId -> { name, code, alive, answer }
    questions: getFreshQuestions(),
    currentQuestionIndex: -1,
    acceptingAnswers: false,
    questionLocked: false,
  };
  return code;
}

function generatePlayerCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

app.post('/api/generate-questions', async (req, res) => {
  try {
    const { count = 6 } = req.body || {};

    // Neem wat bestaande vragen mee als voorbeeld
    const existing = questionBank.slice(0, 20).map(q => ({
      category: q.category,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      difficulty: q.difficulty
    }));

    const systemPrompt = `
Je bent een quizvragen-generator voor een 1-tegen-100 spel.
Je maakt multiple-choice vragen in het Nederlands.

Elke vraag heeft de volgende velden:
- "category": een korte categorie-naam, bijv. "Sport", "Geschiedenis", "Films", "Muziek".
- "text": de vraag.
- "options": een array van precies 4 antwoordopties (strings).
- "correctIndex": index (0-3) van het juiste antwoord in "options".
- "difficulty": exact één van: "Makkelijk", "Gemiddeld" of "Moeilijk".

Belangrijke regels:
- Gebruik géén dubbele vragen van de bestaande set.
- Houd de stijl vergelijkbaar met de voorbeelden.
- Zorg dat de categorie-naam duidelijk is (geen te lange teksten).
- Probeer, waar mogelijk, voor elke gebruikte categorie zowel een makkelijke ("Makkelijk")
  als een moeilijke ("Moeilijk") vraag te maken, zodat de host kan kiezen.

Uitvoer:
- Geef een JSON-object terug met een eigenschap "questions".
- "questions" is een array met precies ${count} vragen.
- Geen extra tekst buiten de JSON.
Voorbeeld-structuur:

{
  "questions": [
    {
      "category": "Sport",
      "text": "Voorbeeldvraag?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 1,
      "difficulty": "Makkelijk"
    }
  ]
}
`;

    const userPrompt = `
Bestaande vragen (voorbeeld, niet herhalen):
${JSON.stringify(existing, null, 2)}

Genereer ${count} nieuwe vragen met categorie, opties, correctIndex en difficulty.
Vergeet "category" niet en gebruik exact de difficulty-waarden:
"Makkelijk", "Gemiddeld", of "Moeilijk".
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const raw = response.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('JSON parse error from AI:', e, raw);
      return res.status(500).json({ error: 'AI antwoord was geen geldige JSON.' });
    }

    const questions = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.questions)
        ? parsed.questions
        : [];

    if (!questions.length) {
      return res.status(500).json({ error: 'Geen vragen gevonden in AI-antwoord.' });
    }

    return res.json({ questions });

  } catch (err) {
    console.error('Error in /api/generate-questions:', err);
    res.status(500).json({ error: 'Er ging iets mis bij het genereren van AI-vragen.' });
  }
});

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
        category: q.category || 'Algemeen',
        text: q.text,
        difficulty: q.difficulty,
        used: q.used,
      })),
    });

    console.log('Game aangemaakt:', code);
  });

  // HOST: selecteer een specifieke vraag vanaf het bord
  socket.on('host:selectQuestion', ({ gameCode, questionIndex } = {}) => {
    const game = games[gameCode];
    if (!game) {
      socket.emit('host:error', `Game niet gevonden (${gameCode}).`);
      return;
    }

    // Optioneel: check of deze socket echt de host is
    if (game.hostSocketId !== socket.id) {
      socket.emit('host:error', 'Alleen de host kan een vraag starten.');
      return;
    }

    const idx = Number(questionIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= game.questions.length) {
      socket.emit('host:error', 'Ongeldige vraagindex.');
      return;
    }

    const q = game.questions[idx];
    if (q.used) {
      socket.emit('host:error', 'Deze vraag is al gebruikt.');
      return;
    }

    game.currentQuestionIndex = idx;
    game.acceptingAnswers = true;
    game.questionLocked = false;

    // reset antwoorden / flags
    Object.values(game.players).forEach(p => {
      if (!p) return;
      p.answer = null;
      p.tooLate = false;
    });

    // nieuwe vraag naar iedereen
    io.to(gameCode).emit('question:new', {
      id: q.id,
      text: q.text,
      options: q.options,
    });

    // host krijgt pending lijst (alle alive spelers nog "pending")
    const pending = Object.values(game.players)
      .filter(p => p?.alive)
      .map(p => p.code ? `${p.name} (${p.code})` : p.name);

    io.to(game.hostSocketId).emit('host:pendingAnswers', { pending });
  });


  // HOST: vragen toevoegen (uit modal)
  socket.on('host:addQuestions', ({ questions } = {}) => {
    try {
      const incoming = Array.isArray(questions) ? questions : [questions];
      const cleaned = incoming
        .filter(q => q && typeof q === 'object')
        .map((q, i) => ({
          id: q.id ?? (questionBank.length + i + 1),
          category: q.category || 'Algemeen',
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          difficulty: q.difficulty || 'Onbekend',
          used: false
        }))
        .filter(q =>
          typeof q.text === 'string' &&
          Array.isArray(q.options) && q.options.length === 4 &&
          Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3
        );

      if (!cleaned.length) {
        socket.emit('host:error', 'Geen geldige vragen gevonden. Verwacht: text, options[4], correctIndex(0-3), category, difficulty.');
        return;
      }

      questionBank = questionBank.concat(cleaned);
      socket.emit('host:questionsUpdated', { count: questionBank.length });
    } catch (e) {
      socket.emit('host:error', 'Fout bij verwerken van vragen.');
    }
  });

  // HOST: alle vragen verwijderen
  socket.on('host:clearQuestions', () => {
    questionBank = [];
    socket.emit('host:questionsUpdated', { count: 0 });
  });

  function lockQuestionByCode(gameCode) {
    if (!gameCode) {
      socket.emit('host:error', 'Geen gameCode ontvangen.');
      return;
    }

    const game = games[gameCode];
    if (!game) {
      socket.emit('host:error', `Game niet gevonden (${gameCode}).`);
      return;
    }

    if (!game.players || typeof game.players !== 'object') {
      console.error('Game state corrupt: players ontbreekt', { gameCode, game });
      socket.emit('host:error', 'Game state corrupt (players ontbreekt). Start een nieuwe game.');
      return;
    }

    if (game.currentQuestionIndex == null || game.currentQuestionIndex < 0) {
      socket.emit('host:error', 'Er is nog geen actieve vraag om te sluiten.');
      return;
    }

    game.acceptingAnswers = false;
    game.questionLocked = true;

    // markeer te laat
    Object.values(game.players).forEach(p => {
      if (p?.alive && p.answer === null) p.tooLate = true;
    });

    // Host knop toggle
    io.to(game.hostSocketId).emit('host:questionLocked');

    // Alleen spelers die echt te laat zijn krijgen de melding
    Object.entries(game.players).forEach(([playerSocketId, p]) => {
      if (p?.alive && p.tooLate) {
        io.to(playerSocketId).emit('question:locked');
      }
    });

    io.to(gameCode).emit('question:locked');

    // pending lijst voor host
    const pending = Object.values(game.players)
      .filter(p => p?.alive && p.answer === null)
      .map(p => p.code ? `${p.name} (${p.code})` : p.name);

    io.to(game.hostSocketId).emit('host:pendingAnswers', { pending });
  }

  function processAnswersByCode(gameCode) {
    if (!gameCode) {
      socket.emit('host:error', 'Geen gameCode ontvangen.');
      return;
    }

    const game = games[gameCode];
    if (!game) {
      socket.emit('host:error', `Game niet gevonden (${gameCode}).`);
      return;
    }

    if (!game.questionLocked) {
      socket.emit('host:error', 'Sluit eerst de vraag voordat je de antwoorden verwerkt.');
      return;
    }

    if (game.currentQuestionIndex == null || game.currentQuestionIndex < 0) {
      socket.emit('host:error', 'Er is nog geen actieve vraag.');
      return;
    }

    const question = game.questions[game.currentQuestionIndex];

    const results = [];
    let aliveCount = 0;

    Object.entries(game.players || {}).forEach(([id, player]) => {
      if (!player?.alive) return;

      const correct = !player.tooLate && player.answer === question.correctIndex;

      if (!correct) player.alive = false;

      results.push({
        name: player.name,
        code: player.code,
        correct,
        alive: player.alive,
        tooLate: !!player.tooLate
      });

      if (player.alive) aliveCount++;

      // reset flags
      player.tooLate = false;
      player.answer = null;
    });

    io.to(gameCode).emit('question:results', {
      correctIndex: question.correctIndex,
      results,
      aliveCount,
    });

    io.to(game.hostSocketId).emit('host:playersUpdate', {
      players: Object.entries(game.players).map(([id, p]) => ({
        id,
        name: p.name,
        code: p.code,
        alive: p.alive,
      })),
    });

    // mark used
    if (game.currentQuestionIndex >= 0) {
      game.questions[game.currentQuestionIndex].used = true;
      io.to(game.hostSocketId).emit('host:questionUsed', { index: game.currentQuestionIndex });
    }

    // winner logic
    let winner = null;
    let winnerType = null;

    if (aliveCount === 1) {
      const aliveEntry = Object.entries(game.players).find(([_, p]) => p?.alive);
      if (aliveEntry) {
        winner = aliveEntry[1].name;
        winnerType = 'player';
      }
    } else if (aliveCount === 0) {
      winner = 'Host';
      winnerType = 'host';
    }

    if (aliveCount <= 1) {
      const reason =
        winnerType === 'player'
          ? `We hebben een winnaar: ${winner}!`
          : 'Alle spelers zijn uitgeschakeld, de host wint!';

      io.to(gameCode).emit('game:over', { reason, winner, winnerType });
    }

    game.questionLocked = false;
  }

  // Speler join
  socket.on('player:join', ({ gameCode, name }) => {
    const game = games[gameCode];
    if (!game) {
      socket.emit('player:error', 'Game niet gevonden');
      return;
    }

    const trimmedName = (name || '').toString().trim();
    if (!trimmedName) {
      socket.emit('player:error', 'Naam is verplicht');
      return;
    }

    const nameInUse = Object.values(game.players).some(p => p.name === trimmedName);
    if (nameInUse) {
      socket.emit('player:error', 'Deze naam is al in gebruik, kies een andere.');
      return;
    }

    const playerCode = generatePlayerCode();

    game.players[socket.id] = {
      name: trimmedName,
      code: playerCode,
      alive: true,
      answer: null,
    };

    socket.join(gameCode);

    io.to(game.hostSocketId).emit('host:playersUpdate', {
      players: Object.entries(game.players).map(([id, p]) => ({
        id,
        name: p.name,
        code: p.code,
        alive: p.alive,
      })),
    });

    socket.emit('player:joined', { name: trimmedName, gameCode, code: playerCode });

    console.log(`${trimmedName} joined game ${gameCode} (${playerCode})`);
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

    Object.values(game.players).forEach((p) => (p.answer = null));

    io.to(gameCode).emit('question:new', {
      id: question.id,
      text: question.text,
      options: question.options,
    });
  });

  // Speler stuurt antwoord
  socket.on('player:answer', ({ gameCode, answerIndex }) => {
    const game = games[gameCode];
    if (!game || !game.acceptingAnswers) return;

    const player = game.players[socket.id];
    if (!player || !player.alive) return;

    if (player.answer !== null) return;

    player.answer = answerIndex;

    const pending = Object.values(game.players)
      .filter(p => p.alive && p.answer === null)
      .map(p => p.code ? `${p.name} (${p.code})` : p.name);

    io.to(game.hostSocketId).emit('host:pendingAnswers', { pending });
  });

  socket.on('host:lockQuestion', ({ gameCode } = {}) => {
    lockQuestionByCode(gameCode);
  });

  socket.on('host:processAnswers', ({ gameCode } = {}) => {
    processAnswersByCode(gameCode);
  });

  // Backwards compatible
  socket.on('host:closeQuestion', ({ gameCode } = {}) => {
    lockQuestionByCode(gameCode);
    processAnswersByCode(gameCode);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Verbinding verbroken:', socket.id);
    for (const [code, game] of Object.entries(games)) {
      if (game.hostSocketId === socket.id) {
        io.to(code).emit('game:over', { reason: 'Host heeft de verbinding verbroken' });
        delete games[code];
        break;
      }
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        io.to(game.hostSocketId).emit('host:playersUpdate', {
          players: Object.entries(game.players).map(([id, p]) => ({
            id,
            name: p.name,
            code: p.code,
            alive: p.alive,
          })),
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server luistert op http://localhost:${PORT}`);
});
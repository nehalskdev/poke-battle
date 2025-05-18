import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState({
    player1: null,
    player2: null,
  });
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [battleAnimating, setBattleAnimating] = useState(false);

  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        const response = await axios.get(
          "https://pokeapi.co/api/v2/pokemon?limit=151"
        );
        setPokemonList(response.data.results);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch Pokémon list");
        setLoading(false);
      }
    };

    fetchPokemonList();
  }, []);

  const fetchPokemonDetails = async (pokemonName, player) => {
    try {
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
      );
      const pokemonData = {
        name: response.data.name,
        image: response.data.sprites.front_default,
        stats: response.data.stats.reduce((acc, stat) => {
          acc[stat.stat.name] = stat.base_stat;
          return acc;
        }, {}),
        abilities: response.data.abilities.map(
          (ability) => ability.ability.name
        ),
        types: response.data.types.map((type) => type.type.name),
      };

      setSelectedPokemon((prev) => ({
        ...prev,
        [player]: pokemonData,
      }));
    } catch (err) {
      setError(`Failed to fetch details for ${pokemonName}`);
    }
  };

  const calculatePower = (pokemon) => {
    if (!pokemon) return 0;
    const { stats } = pokemon;
    return (
      stats.hp * 1.5 +
      stats.attack +
      stats.defense +
      stats["special-attack"] +
      stats["special-defense"] +
      stats.speed
    );
  };

  const determineWinner = async () => {
    if (!selectedPokemon.player1 || !selectedPokemon.player2) return;

    setBattleAnimating(true);
    setWinner(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const player1Power = calculatePower(selectedPokemon.player1);
    const player2Power = calculatePower(selectedPokemon.player2);

    if (player1Power > player2Power) {
      setWinner("Player 1");
    } else if (player2Power > player1Power) {
      setWinner("Player 2");
    } else {
      setWinner("Draw");
    }

    setBattleAnimating(false);
  };

  const resetGame = () => {
    setSelectedPokemon({
      player1: null,
      player2: null,
    });
    setWinner(null);
    setSearchTerm("");
  };

  const filteredPokemon = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type) => {
    const typeColors = {
      normal: "#A8A878",
      fire: "#F08030",
      water: "#6890F0",
      electric: "#F8D030",
      grass: "#78C850",
      ice: "#98D8D8",
      fighting: "#C03028",
      poison: "#A040A0",
      ground: "#E0C068",
      flying: "#A890F0",
      psychic: "#F85888",
      bug: "#A8B820",
      rock: "#B8A038",
      ghost: "#705898",
      dragon: "#7038F8",
      dark: "#705848",
      steel: "#B8B8D0",
      fairy: "#EE99AC",
    };
    return typeColors[type] || "#777";
  };

  const bothSelected = selectedPokemon.player1 && selectedPokemon.player2;

  return (
    <Container className="mt-3 pokemon-app">
      <motion.h1
        className="text-center mb-3 game-title"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Pokémon Battle Arena
      </motion.h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-3 players-row">
        <Col xs={12} md={5}>
          <PokemonCard
            player="player1"
            pokemon={selectedPokemon.player1}
            onSelect={fetchPokemonDetails}
            playerName="Player 1"
            getTypeColor={getTypeColor}
            animating={battleAnimating && winner === "Player 1"}
          />
        </Col>

        <Col xs={12} md={2} className="battle-controls-col">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="danger"
              size="lg"
              onClick={determineWinner}
              disabled={!bothSelected || battleAnimating}
              className="battle-btn mb-2 w-100"
            >
              {battleAnimating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> Battling...
                </>
              ) : (
                "Battle!"
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={resetGame}
              className="reset-btn w-100 mb-2"
            >
              {bothSelected ? "Change Pokémon" : "Reset Game"}
            </Button>
          </motion.div>

          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Alert
                  variant={winner === "Draw" ? "warning" : "success"}
                  className="w-100 text-center p-2 mb-0 result-alert"
                >
                  <strong className="winner-text">
                    {winner === "Draw"
                      ? "⚔️ It's a draw! ⚔️"
                      : ` ${winner} Wins! 🎉`}
                  </strong>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </Col>

        <Col xs={12} md={5}>
          <PokemonCard
            player="player2"
            pokemon={selectedPokemon.player2}
            onSelect={fetchPokemonDetails}
            playerName="Player 2"
            getTypeColor={getTypeColor}
            animating={battleAnimating && winner === "Player 2"}
          />
        </Col>
      </Row>

      {bothSelected && (
        <motion.div
          className="power-summary mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="power-card">
            <Card.Body className="p-2">
              <Row>
                <Col xs={6} className="text-center player-1-power">
                  <h5>{selectedPokemon.player1.name}</h5>
                  <div className="power-value">
                    Power:{" "}
                    <span className="power-number">
                      {calculatePower(selectedPokemon.player1).toFixed(1)}
                    </span>
                  </div>
                  <div className="small-stats">
                    <p>HP: {selectedPokemon.player1.stats.hp}</p>
                    <p>ATK: {selectedPokemon.player1.stats.attack}</p>
                    <p>DEF: {selectedPokemon.player1.stats.defense}</p>
                  </div>
                </Col>
                <Col xs={6} className="text-center player-2-power">
                  <h5>{selectedPokemon.player2.name}</h5>
                  <div className="power-value">
                    Power:{" "}
                    <span className="power-number">
                      {calculatePower(selectedPokemon.player2).toFixed(1)}
                    </span>
                  </div>
                  <div className="small-stats">
                    <p>HP: {selectedPokemon.player2.stats.hp}</p>
                    <p>ATK: {selectedPokemon.player2.stats.attack}</p>
                    <p>DEF: {selectedPokemon.player2.stats.defense}</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      <AnimatePresence>
        {!bothSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="pokemon-selector">
              <Card.Header className="p-2 search-header">
                <Form.Control
                  type="text"
                  placeholder="🔍 Search Pokémon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  className="search-input"
                />
              </Card.Header>
              <Card.Body className="p-2 pokemon-list-container">
                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" size="sm" />
                    <p>Loading Pokémon...</p>
                  </div>
                ) : (
                  <div className="pokemon-grid">
                    {filteredPokemon.map((pokemon, index) => (
                      <motion.div
                        key={pokemon.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline-primary"
                          className="m-1 pokemon-btn"
                          size="sm"
                          onClick={() => {
                            const playerToSelect = !selectedPokemon.player1
                              ? "player1"
                              : !selectedPokemon.player2
                              ? "player2"
                              : null;
                            if (playerToSelect) {
                              fetchPokemonDetails(pokemon.name, playerToSelect);
                            }
                          }}
                        >
                          {pokemon.name.charAt(0).toUpperCase() +
                            pokemon.name.slice(1)}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}

const PokemonCard = ({
  player,
  pokemon,
  playerName,
  getTypeColor,
  animating,
}) => {
  return (
    <motion.div
      animate={
        animating
          ? {
              x:
                player === "player1"
                  ? [0, 10, -10, 10, 0]
                  : [0, -10, 10, -10, 0],
              boxShadow: [
                "0 0 0 rgba(255,255,0,0.4)",
                "0 0 20px rgba(255,255,0,0.8)",
                "0 0 0 rgba(255,255,0,0.4)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
    >
      <Card className={`h-100 pokemon-card ${player}`}>
        <Card.Header className="p-2 text-center card-header">
          <h5 className="mb-0">{playerName}</h5>
        </Card.Header>
        <Card.Body className="p-2 text-center compact-pokemon-card">
          {pokemon ? (
            <>
              <motion.img
                src={pokemon.image}
                alt={pokemon.name}
                className="compact-pokemon-image mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              />
              <h6 className="mb-1 pokemon-name">
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </h6>

              <div className="type-badges mb-1">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className="type-badge"
                    style={{ backgroundColor: getTypeColor(type) }}
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="compact-stats">
                <span>❤️ {pokemon.stats.hp}</span>
                <span>⚔️ {pokemon.stats.attack}</span>
                <span>🛡️ {pokemon.stats.defense}</span>
              </div>

              <div className="compact-abilities mt-1">
                <p className="mb-1">
                  <small>Abilities:</small>
                </p>
                <div>
                  {pokemon.abilities.slice(0, 2).map((ability) => (
                    <motion.span
                      key={ability}
                      className="ability-badge"
                      whileHover={{ scale: 1.1 }}
                    >
                      {ability}
                    </motion.span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <motion.p
              className="mb-0 select-prompt"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <small>Select a Pokémon</small>
            </motion.p>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default App;

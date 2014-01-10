var io = require("socket.io");
var static = require("node-static");
var Asteroids = require("./asteroids.js");

var PUSH_TIME = 100;

var GameServer = function () {
  this.game = Asteroids.Game.new();
  this.sockets = [];
}

GameServer.prototype.makePayload = function () {
  return {
    game: gameServer.game,
    seed: Asteroids.Util._seed
  };
}

GameServer.prototype.start = function () {
  var gameServer = this;

  setInterval(
    function () { gameServer.game.step(); },
    1000 / Asteroids.Game.FPS
  );

  setInterval(
    function () {
      gameServer.sockets.forEach(function (socket) {
        socket.emit("draw", gameServer.makePayload());
      });
    }, PUSH_TIME
  );
};

GameServer.prototype.addSocket = function (socket) {
  var game = this.game;
  var ship = this.game.addShip();

  this.sockets.push(socket);

  socket.on("move", function (move) { ship.power(move); });
  socket.on("fire", function () { ship.fireBullet(); });
  socket.on("disconnect", function () { game.remove(ship) });

  socket.emit("firstDraw", gameServer.makePayload());
};

var fileServer = new static.Server('./');
var httpServer = require("http").createServer(
  function (request, response) {
    request.addListener(
      'end',
      function () { fileServer.serve(request, response); }
    ).resume();
  }
);

var gameServer = new GameServer();
gameServer.start();
var socketServer = io.listen(httpServer);
socketServer.set("log level", 2);
socketServer.on("connection", function (socket) {
  gameServer.addSocket(socket);
});

httpServer.listen(process.env.PORT);

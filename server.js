var io = require("socket.io");
var Asteroids = require("./asteroids.js");

var GameServer = function () {
  this.game = new Asteroids.Game();
  this.sockets = [];
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
        socket.emit("draw", gameServer.game);
      });
    },1000
  );
};

GameServer.prototype.addSocket = function (socket) {
  var game = this.game;
  var ship = this.game.addShip();

  this.sockets.push(socket);

  socket.on("move", function (move) { ship.power(move); });
  socket.on("fire", function () { ship.fireBullet(); });
  socket.on("disconnect", function () { game.remove(ship) });

  socket.emit("firstDraw", gameServer.game);
};

var gameServer = new GameServer();
gameServer.start();

var server = io.listen(8000);
server.sockets.on('connection', function (socket) {
  gameServer.addSocket(socket);
});

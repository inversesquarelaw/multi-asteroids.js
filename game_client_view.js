(function (root) {
  var Asteroids = root.Asteroids = (root.Asteroids || {});

  var GameClientView = Asteroids.GameClientView =
    function (socket, ctx) {
      this.socket = socket;
      this.ctx = ctx;
      this.clockSkew = 0;
    };

  GameClientView.MOVES = {
    "w": [ 0, -1],
    "a": [-1,  0],
    "s": [ 0,  1],
    "d": [ 1,  0],
  };

  GameClientView.prototype.bindKeyHandlers = function () {
    var view = this;

    Object.keys(GameClientView.MOVES).forEach(function (k) {
      var move = GameClientView.MOVES[k];
      key(k, function () {
        view.socket.emit("move", move);
      });
    });

    key("space", function () {
      view.socket.emit("fire")
    });
  };

  GameClientView.prototype.connect = function () {
    this.calcClockSkew();
    this.socket.on("draw", this.loadState.bind(this));
    this.socket.on("firstDraw", this.firstLoadState.bind(this));
  };

  GameClientView.prototype.firstLoadState = function (json) {
    this.loadState(json);
    this.shipId = this.game.ships[this.game.ships.length - 1]._id;

    this.startPlaying();
  };

  GameClientView.prototype.loadState = function (json) {
    Asteroids.Util._seed = json.seed;
    json.game.lastTickTime += this.clockSkew;
    this.game = Asteroids.Game.fromJSON(json.game);
  };

  GameClientView.prototype.ship = function () {
    for (var i = 0; i < this.game.ships.length; i++) {
      var ship = this.game.ships[i];
      if (ship._id == this.shipId) {
        return ship;
      }
    }

    throw "wtf";
  };

  GameClientView.prototype.startPlaying = function () {
    var view = this;

    this.bindKeyHandlers();
    setInterval(
      function () {
        view.game.step();
        view.game.draw(view.ctx);
      }, 1000 / Asteroids.Game.FPS
    );
  };

  GameClientView.prototype.calcClockSkew = function () {
    var view = this;

    var startTime = (new Date()).getTime();
    this.socket.emit("ping");
    this.socket.once("pong", function (serverTime) {
      var endTime = (new Date()).getTime();
      // I feel like (endTime - startTime) / 2 is a better
      // approximation of latency, but this seems to work better?
      var latency = (endTime - startTime);

      view.clockSkew = (startTime + latency) - serverTime;
    });
  };
})(this);

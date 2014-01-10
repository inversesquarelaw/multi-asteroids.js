(function (root) {
  var Asteroids = root.Asteroids = (root.Asteroids || {});

  var GameClientView = Asteroids.GameClientView =
    function (socket, ctx) {
      this.socket = socket;
      this.ctx = ctx;
      // TODO: Hardcoded, because my clock-skew with Heroku is
      // ~+6000ms.
      this.clockSkew = 6000;
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

  GameClientView.prototype.start = function () {
    var view = this;

    this.bindKeyHandlers();

    setInterval(
      function () {
        view.game.step();
        view.game.draw(view.ctx);
      }, 1000 / Asteroids.Game.FPS
    );
  }

  GameClientView.prototype.connect = function () {
    var view = this;

    this.socket.on("draw", this.loadState.bind(this));
    this.socket.on("firstDraw", function (json) {
      view.loadState(json);

      view.shipId = view.game.ships[view.game.ships.length - 1]._id;
      view.start();
    });
  };
})(this);

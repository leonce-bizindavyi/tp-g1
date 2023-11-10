"use strict";

var http = require("http");

var _require = require("socket.io"),
    Server = _require.Server;

var _require2 = require("uuid"),
    uuidv4 = _require2.v4;

var connectedClients = [];
var users = {};
var userId = [];
var myUsername = [];
var groups = {};
var unreadCounts = {}; // { userId: { chatWithUserId: count } }

var server = http.createServer();
var io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
io.on("connection", function (socket) {
  socket.on("create_group", function (group) {
    var groupId = uuidv4(); // Génère un ID unique pour le groupe

    socket.join(groupId); // Ajouter le groupe à la liste des groupes

    groups[groupId] = {
      groupName: group.groupName,
      groupId: groupId
    }; // Envoyer la liste des groupes à tous les clients

    io.emit("groups_updated", groups); // Renvoie l'ID du groupe au client

    socket.emit("group_created", {
      groupId: groupId,
      groupName: group.groupName
    });
  });
  socket.on("avalaible_groups", function () {
    io.emit("groups_updated", groups);
  });
  socket.on("register", function (username) {
    if (users[username]) {
      socket.emit("registration_failed", "Ce nom d'utilisateur est déjà pris.");
    } else {
      users[username] = {
        socketId: socket.id
      };
      socket.emit("registration_successful", {
        message: "Vous avez été enregistré avec succès.",
        id: users[username].socketId,
        username: username
      });
      console.log("".concat(username, " has been registered with socket id of ").concat(socket.id));
    }
  });
  socket.on("login", function (username) {
    if (users[username]) {
      socket.emit("login_successful", {
        username: username,
        id: users[username].socketId
      });
      myUsername = username;
      userId = users[username].socketId; // Ajouter l'utilisateur connecté à la liste

      connectedClients.push({
        username: username,
        id: users[username].socketId
      }); // Émettre l'événement 'update_clients' à tous les clients connectés

      io.emit("update_clients", connectedClients);
      console.log("".concat(username, " has logged in with socket id of ").concat(socket.id));
    } else {
      socket.emit("login_failed", "Ce nom d'utilisateur n'existe pas.");
    }
  });
  socket.on("connectedClients", function () {
    // Envoyez les clients connectés sur tous les clients
    io.emit("update_clients", connectedClients);
  });
  socket.on("private-msg", function (_ref) {
    var content = _ref.content,
        from = _ref.from,
        to = _ref.to;
    console.log("Message: ".concat(content, " from ").concat(from, " to ").concat(to));

    if (!unreadCounts[to]) {
      unreadCounts[to] = {};
    }

    if (!unreadCounts[to][from]) {
      unreadCounts[to][from] = 0;
    }

    unreadCounts[to][from]++; // Envoyer le message à la socket spécifique

    socket.to(to).emit("private-msg", {
      content: content,
      from: from,
      to: to
    });
    io.to(to).emit("update_unread", {
      from: from,
      count: unreadCounts[to][from]
    });
  });
  socket.on("view_chat", function (chatWithUserId) {
    // console.log("\n .....id chatter : -> ",chatWithUserId);
    if (unreadCounts[userId] && unreadCounts[userId][chatWithUserId]) {
      unreadCounts[userId][chatWithUserId] = 0;
    }

    socket.emit("update_unread", {
      from: chatWithUserId,
      count: 0
    });
  });
  socket.on("public-msg", function (_ref2) {
    var content = _ref2.content,
        from = _ref2.from,
        to = _ref2.to,
        username = _ref2.username;
    var message = {
      from: from,
      to: to,
      content: content,
      username: username
    };
    io.emit("group_message", message); //io.to(to).emit("group_message", message);

    console.log("Message: ".concat(content, " from ").concat(from, " to ").concat(to));
  });
  socket.on("disconnect", function () {
    console.log("User with socket id ".concat(socket.id, " has disconnected"));
    io.emit("login_successful", {
      username: myUsername,
      id: userId
    }); // Trouvez l'utilisateur dans le tableau 'connectedClients' qui a la même socket.id que le client déconnecté

    var index = connectedClients.findIndex(function (user) {
      return user.id === socket.id;
    });

    if (index !== -1) {
      // Supprimez l'utilisateur du tableau
      connectedClients.splice(index, 1); // Émettez l'événement 'update_clients' pour mettre à jour la liste des clients sur tous les clients restants

      io.emit("update_clients", connectedClients);
    }
  });
});
server.listen(8000, function () {
  console.log("listening on * : 8000");
});
/*
io.on("connection", (socket) => {
  console.log(`A user connected with id ${socket.id}`);

  socket.emit("your id", socket.id);

  connectedClients[socket.id] = socket;
  io.emit("clients list", Object.keys(connectedClients));

  socket.on("client message", (msg) => {
    console.log(`Message from ${socket.id}: ${msg}`);
    const messageWithID = {
      from: socket.id,
      content: msg,
    };
    socket.broadcast.emit("server message", messageWithID);
  });

  socket.on("private message", ({ content, to }) => {
    console.log(`Message: ${content} to ${to} from ${socket.id}`);

    // Envoyer le message à la socket spécifique
    socket.to(to).emit("private message", { content, from: socket.id, to: to });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected with id ${socket.id}`);

    // Supprimer la socket du registre des clients connectés
    delete connectedClients[socket.id];

    // Diffuser la liste mise à jour des clients connectés à tous les clients
    io.emit("clients list", Object.keys(connectedClients));
  });
});*/
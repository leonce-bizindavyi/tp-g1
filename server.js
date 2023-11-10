const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


let connectedClients = [];

let users = {};


let groups = {};

let unreadCounts = {};

let localTime = new Date()



function removeMemberFromGroup(groupId, userId) {
  if (groups[groupId] && groups[groupId].members[userId]) {
    delete groups[groupId].members[userId];
  }
}


io.on("connection", (socket) => {

  socket.on("create_group", (group) => {
    const groupId = uuidv4();
    // Le créateur du groupe est automatiquement ajouté comme membre 
    // avec un rôle d'administrateur.
    groups[groupId] = {
      groupName: group.groupName,
      groupId: groupId,
      members: {
        [group.creatorId]: {
          username: group.creatorUsername,
          role: "admin"
        }
      }
    };

    // Réjoindre le créateur du groupe à la salle du groupe.
    socket.join(groupId);

    socket.emit("group_created", {
      groupId: groupId,
      groupName: group.groupName,
      members: {
        [group.creatorId]: {
          username: group.creatorUsername,
          role: "admin"
        }
      }
    });

    io.emit("groups_updated", groups);
  });


  socket.on('add_user_to_group', (data) => {
    const user = data.user;
    const groupId = data.chatInGroup.groupId;

    // Vérifiez que le groupe existe
    if (groups[groupId]) {
      // Ajoutez l'utilisateur au groupe
      groups[groupId].members[user.id] = user;
      io.emit("groups_updated", groups);

      socket.emit("added_toGroup", { message: "user added successfully" })

      // Ensuite, vous pouvez émettre un événement de confirmation si nécessaire, ou effectuer d'autres actions.
    } else {
      console.error('Groupe non trouvé!');
    }
  });



  socket.on("avalaible_groups", () => {
    io.emit("groups_updated", groups);
  });


  socket.on("register", (infos) => {
    const { username, password } = infos
    if (users[username]) {
      socket.emit("registration_failed", "Ce nom d'utilisateur est déjà pris.");
    } else {
      users[username] = {
        socketId: socket.id,
        password: password
      };

      socket.emit("registration_successful", {
        message: "Vous avez été enregistré avec succès.",
        id: users[username].socketId,
        username: username,
      });

      console.log(
        `${username} has been registered with socket id of ${socket.id}`
      );
    }
  });

  socket.on("login", (infos) => {

    const { username, password } = infos

    if (!users[username]) {
      socket.emit("login_failed", "Nom d'utilisateur inexistant.");
    } else if (users[username].password !== password) {
      socket.emit("login_failed", "Mot de passe incorrect.");
    } else {
      socket.emit("login_successful", {
        username: username,
        id: socket.id,
      });

      connectedClients.push({ username: username, id: socket.id, });

      // Émettre l'événement 'update_clients' à tous les clients connectés
      io.emit("update_clients", connectedClients);
      console.log(`${username} has logged in with socket id of ${socket.id}`);
    }

  });

  socket.on("connectedClients", () => {
    // Envoyez les clients connectés sur tous les clients
    io.emit("update_clients", connectedClients);
  });

  socket.on("private-msg", ({ content, username, from, to }) => {
    console.log(`Message: ${content} from ${username} to ${to} at : ${localTime}`);
    if (!unreadCounts[to]) {
      unreadCounts[to] = {};
    }
    if (!unreadCounts[to][from]) {
      unreadCounts[to][from] = 0;
    }
    unreadCounts[to][from]++;

    // Envoyer le message à la socket spécifique
    socket.to(to).emit("private-msg", { id: uuidv4(), content: content, from: from, to: to, timestamp: localTime });
    io.to(to).emit("update_unread", { from: from, count: unreadCounts[to][from], });
  });

  socket.on("view_chat", ({ from, to }) => {

    if (!unreadCounts[from]) {
      unreadCounts[from] = {};
    }
    if (!unreadCounts[from][to]) {
      unreadCounts[from][to] = 0;
    }
    unreadCounts[from][to] = 0;

    socket.emit("update_unread", { from: from, count: unreadCounts[from][to], });
  })

  socket.on("public-msg", ({ content, from, to, username }) => {
    const message = { id: uuidv4(), from: from, to: to, content: content, username: username, timestamp: localTime };
    io.emit("group_message", message);
    //io.to(to).emit("group_message", message);
    console.log(`Message: ${content} from ${username} to groupID ${to} at: ${localTime}`);
  });

  socket.on("broadcast-msg", ({ content, from, username }) => {
    const message = { id: uuidv4(), from: from, content: content, username: username, timestamp: localTime };
    io.emit("broadcast_message", message)
    console.log(`Message: ${content} from ${username} to  broadcast at: ${localTime}`)
  })

  socket.on('logout', (data) => {
    const { username } = data;
    console.log(username, 'has been logged out',)

    const userIndex = connectedClients.findIndex(user => user.username === username);

    // Supprimez l'utilisateur si trouvé
    if (userIndex !== -1) {
      connectedClients.splice(userIndex, 1);
    }

    // Informez tous les autres clients que cet utilisateur s'est déconnecté
    io.emit("update_clients", connectedClients);
    io.emit("user_loggout", username)
  });

  socket.on("search", (data) => {
    const searchTerm = data.searches
    const filteredClients = connectedClients.filter(client =>
      client.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    socket.emit("update_clients", filteredClients)
  })

  socket.on("remove", ({ user, group }) => {
    removeMemberFromGroup(group, user);
    socket.to(user).emit("added_toGroup", 'You have been added to group')
    io.emit("groups_updated", groups);
  })


  socket.on("disconnect", () => {

    // Trouvez l'utilisateur dans le tableau 'connectedClients' qui a la même socket.id que le client déconnecté
    const index = connectedClients.findIndex((user) => user.id === socket.id);

    if (index !== -1) {
      // Supprimez l'utilisateur du tableau
      connectedClients.splice(index, 1);

      // Émettez l'événement 'update_clients' pour mettre à jour la liste des clients sur tous les clients restants
      io.emit("update_clients", connectedClients);

      console.log(`User with socket id ${socket.id} has disconnected`);
    }
  });
});

server.listen(8000, () => {
  console.log("listening on * : 8000");
});


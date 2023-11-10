import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import Autentification from "./connection/Autentification";
import Discussion from "./connection/chat/Discussion";
import { v4 as uuidv4 } from 'uuid';

import { ModalContext } from "./Files/ModalContext";



export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [loggedUser, setIsLogged] = useState({});
  const [connectedClients, setConnectedClients] = useState([]);
  const [chatUser, setChatUser] = useState({});
  const [chatInGroup, setChatInGroup] = useState([]);
  const [privateSMS, setPrivateSMS] = useState([]);
  const [publicSMS, setPublicSMS] = useState([]);
  const [broadcastSMS, setBroadcastSMS] = useState([])
  const [message, setMessage] = useState("");
  const [isPrivateChat, setIsPrivateChat] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [groupID, setGroupID] = useState("");
  const [groups, setGroups] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isBroadcast, setIsBroadcast] = useState(false)


  useEffect(() => {
    const newSocket = io("http://10.10.57.225:8000");
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, [setSocket]);

  useEffect(() => {
    if (socket) {
      socket.on("registration_failed", (message) => {
        setError(message);
      });
      socket.on("registration_successful", (data) => {
        toast.success(
          data.username + " is registrated \n" + "With ID :" + data.id
        );
      });
      socket.on("login_successful", (data) => {
        setIsLogged({ username: data.username, id: data.id });
        console.log("user connected", data);
      });
      socket.on("login_failed", (data) => {
        setError(data)
      });
      socket.emit("connectedClients");

      socket.emit("avalaible_groups");

      socket.on("update_clients", (data) => {
        setConnectedClients(data);
      });

      socket.on("added_toGroup", (message) => {
        toast.success("Added successfully")
      })

      socket.on("private-msg", (data) => {
        const newMessage = { id: data.id, from: data.from, to: data.to, msg: data.content, readableTime: data.timestamp };
        setPrivateSMS((prevSMS) => [...prevSMS, newMessage]);
      });

      socket.on("broadcast_message", (data) => {
        const newMessage = { id: data.id, from: data.from, msg: data.content, username: data.username, readableTime: data.timestamp };
        setBroadcastSMS((prevSMS) => [...prevSMS, newMessage])
      });


      socket.on("group_created", (group) => {
        toast.success("Group created ");
      });

      socket.on("groups_updated", (updatedGroups) => {
        setGroups(updatedGroups);
      });

      socket.on("group_message", (data) => {
        const newMessage = { id: data.id, from: data.from, to: data.to, msg: data.content, username: data.username, };
        setPublicSMS((prev) => [...prev, newMessage]);
      });

      socket.on("update_unread", (data) => {
        setUnreadCounts((prevState) => ({ ...prevState, [data.from]: data.count, }));
      });

      socket.on("user_loggout", (data) => {
        if (data !== loggedUser.username) {
          toast.success(`${data} logout`)
        }
      })


      return () => {
        // Déconnectez le socket quand le composant est démonté

        socket.off("private-msg");
        socket.off("update_clients");
        socket.off("registration_failed");
        socket.off("update_unread");
        socket.off("group_message");
        socket.off("groups_updated");
        socket.off("group_created");
        socket.off("login_successful");
        socket.off("group_message");
        socket.disconnect();
      };
    }
  }, [socket]);


  const handleSubmit = (event) => {
    event.preventDefault();

    if (isRegister) {
      if (socket && username !== "" && password !== "") {
        socket.emit("register", { username: username, password: password });
      } else {
        setError("All fields must be completed")
      }
    } else {
      if (socket && username !== "" && password !== "") {
        socket.emit("login", { username: username, password: password });
      } else {
        setError("All fields must be completed")
      }
    }
  };

  const handleSendSMS = (e) => {
    //e.preventDefault();
    setMessage("");
    if (message !== "") {
      if (socket) {
        if (isBroadcast) {
          socket.emit("broadcast-msg", { content: message, from: loggedUser.id, username: loggedUser.username, });
          const newMessage = { id: uuidv4(), from: loggedUser.id, msg: message, };
        } else if (isPrivateChat) {
          socket.emit("private-msg", { content: message, from: loggedUser.id, username: loggedUser.username, to: chatUser.id, });
          const newMessage = { id: uuidv4(), from: loggedUser.id, to: chatUser.id, msg: message, };
          setPrivateSMS((prevSMS) => [...prevSMS, newMessage]);
        } else {
          socket.emit("public-msg", { content: message, from: loggedUser.id, to: chatInGroup.groupId, username: loggedUser.username, });
        }
      }
    }
  };

  const handleGroupCreation = () => {
    if (socket) {
      socket.emit("create_group", { groupName: groupName, creatorId: loggedUser.id, creatorUsername: loggedUser.username });
    }
    setGroupName("");
  };
  const setLoggoutUser = () => {
    setIsLogged({})
  }

  const handleSearch = (searches) => {
    console.log(searches)
    if (socket) {
      socket.emit("search", { searches: searches, id: loggedUser.id })
    }
  }
  return (
    <>
      <Head>
        <title>ChatSpace</title>{" "}
      </Head>
      {Object.keys(loggedUser).length !== 0 ? (
        <>
          <ModalContext.Provider value={handleGroupCreation}>

            <Discussion
              handleSearch={handleSearch}
              setLoggoutUser={setLoggoutUser}
              isPrivateChat={isPrivateChat}
              privateSMS={privateSMS}
              publicSMS={publicSMS}
              message={message}
              setMessage={setMessage}
              chatUser={chatUser}
              setChatUser={setChatUser}
              connectedClients={connectedClients}
              loggedUser={loggedUser}
              sendMessage={handleSendSMS}
              groupName={groupName}
              setGroupName={setGroupName}
              groupID={groupID}
              setGroupID={setGroupID}
              groups={groups}
              chatInGroup={chatInGroup}
              setChatInGroup={setChatInGroup}
              setIsPrivateChat={setIsPrivateChat}
              unreadCounts={unreadCounts}
              setUnreadCounts={setUnreadCounts}
              setPrivateSMS={setPrivateSMS}
              setPublicSMS={setPublicSMS}
              isBroadcast={isBroadcast}
              setIsBroadcast={setIsBroadcast}
              broadcastSMS={broadcastSMS}
            />
          </ModalContext.Provider>
        </>
      ) : (
        <Autentification
          username={username}
          password={password}
          error={error}
          isRegister={isRegister}
          handleSubmit={handleSubmit}
          setIsRegister={setIsRegister}
          setUsername={setUsername}
          setPassword={setPassword}
        />
      )}
    </>
  );
}

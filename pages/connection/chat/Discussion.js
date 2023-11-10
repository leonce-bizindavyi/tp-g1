import Modal from "@/pages/Files/Modal";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://10.10.57.225:8000";
const socket = socketIOClient(ENDPOINT);
import moment from "moment/moment";

const Dropdown = ({ children }) => {
  const dropdownRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    if (dropdownRef.current.contains(e.target)) {
      // à l'intérieur du click
      return;
    }
    // à l'extérieur du click
    setIsOpen(false);
  };

  useEffect(() => {
    // ajout de l'écouteur d'évènement lorsque le composant est monté
    document.addEventListener("mousedown", handleClick);

    // nettoyage lors du démontage du composant
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  });




  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col p-2 space-y-1 justify-center items-center mr-4 cursor-pointer"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
      {isOpen && (
        <div className="absolute right-0 w-40 mt-2 py-2 bg-white border rounded shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
};


function Discussion({
  handleSearch,
  setLoggoutUser,
  isPrivateChat,
  setIsPrivateChat,
  privateSMS,
  publicSMS,
  loggedUser,
  setChatUser,
  connectedClients,
  chatUser,
  message,
  setMessage,
  sendMessage,
  groupName,
  setGroupName,
  groupID,
  setGroupID,
  groups,
  chatInGroup,
  setChatInGroup,
  unreadCounts,
  setUnreadCounts,
  setPrivateSMS,
  setPublicSMS,
  isBroadcast,
  setIsBroadcast,
  broadcastSMS
}) {
  let messagesToDisplay = isPrivateChat ? privateSMS : publicSMS;
  if (isBroadcast) messagesToDisplay = broadcastSMS

  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState("")
  const inputRef = useRef(null);
  const [search, setSearch] = useState("")

  function checkUserMembership(userId, groupId) {
    if (groups[groupId] && groups[groupId].members[userId]) {
      return true;
    }
    return false;
  }
  const logoutHandler = () => {
    setLoggoutUser()
    if (socket) {
      socket.emit("logout", { username: loggedUser.username })
    }
  }

  function userInAnyGroup(userId) {
    for (let group in groups) {
      if (groups[group].members[userId]) {
        return true;
      }
    }
    return false;
  }

  function isUserAdmin(userId, groupId) {
    return groups[groupId] && groups[groupId].members[userId] && groups[groupId].members[userId].role === 'admin';
  }


  const changeDiscussion = (group) => {
    setIsBroadcast(false)
    setIsPrivateChat(false);
    setChatInGroup(group);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const changeChat = (user) => {
    setIsBroadcast(false)
    setIsPrivateChat(true);
    setChatUser(user);
    setUnreadCounts((prevState) => ({
      ...prevState,
      [user.id]: 0,
    }));

    socket.emit("view_chat", { from: loggedUser.id, to: user.id });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      inputRef.current.focus();
    }
  };

  const deleteMessage = (messageId, stateMSG) => {
    if (stateMSG) {
      setPrivateSMS(prevPrivateSMS => prevPrivateSMS.filter(message => message.id !== messageId));
    } else {
      setPublicSMS(prevPublicSMS => prevPublicSMS.filter(message => message.id !== messageId));
    }
  }
  const showModalHandler = (state, role) => {
    setRole(role)
    setShowModal(state, role)
  }
  const closeHandler = () => {
    setChatInGroup([])
    setChatUser({})
    setIsBroadcast(false)
  }

  const selectBroadcast = (state) => {
    setChatInGroup([])
    setChatUser({})
    setIsBroadcast(state)
    if (inputRef.current) {
      inputRef.current.focus();
    }

  }

  return (
    <>
      <div className="flex h-full w-full">
        <div className="w-1/3 h-screen border-r border-gray-300 overflow-auto bg-gray-200 flex flex-col">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 py-4 flex-none flex justify-between items-center px-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full h-12 w-12 bg-blue-500 text-white flex items-center justify-center text-2xl font-bold">
                {loggedUser ? loggedUser.username[0] : ""}
              </div>
              <h1 className="text-2xl font-bold text-white" >
                {loggedUser ? loggedUser.username : ""}
              </h1>
            </div>

            <Dropdown>
              <a
                onClick={() => showModalHandler(true, "create")}
                className="block px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100"
              >
                Create group
              </a>
              <Modal
                role={role}
                showModal={showModal}
                showModalHandler={showModalHandler}
                groupName={groupName}
                setGroupName={setGroupName}
                groupID={groupID}
                setGroupID={setGroupID}
                loggedUser={loggedUser}
              />
              <Link className="block px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100" onClick={() => logoutHandler()} href='/'>
                Logout
              </Link>

            </Dropdown>
          </div>

          <div className="p-4">
            <input
              onChange={(e) => { handleSearch(e.target.value), setSearch(e.target.value) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              type="search"
              placeholder="Search ..."
              value={search}
            />
          </div>

          <div className="m-4 bg-white rounded-lg py-2 px-4 flex-grow overflow-auto">

            <>
              <React.Fragment>

                <div onClick={() => selectBroadcast(true)}
                  className="bg-green-300 mb-4  cursor-pointer rounded-lg py-2 px-4 flex items-center space-x-2 justify-between border-b border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-500  rounded-full h-10 w-10  text-white flex items-center justify-center text-lg"> B                    </div>
                    <div className="text-lg">Broadcast</div>
                  </div>
                </div>
              </React.Fragment>
            </>

            {(Object.keys(groups).length > 0 && userInAnyGroup(loggedUser.id)) && (
              <>
                <div className="bg-blue-500 text-white py-2 px-4 rounded-lg text-center font-bold">
                  <h2>Group chats </h2>
                </div>
                {Object.values(groups).map((group, index) => (
                  <React.Fragment key={index}  >
                    {checkUserMembership(loggedUser.id, group.groupId) && (
                      <div
                        onClick={() => changeDiscussion(group)}
                        className="m-2 bg-white cursor-pointer rounded-lg py-2 px-4 flex items-center space-x-2 justify-between border-b border-gray-200"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="rounded-full h-10 w-10 bg-gray-500 text-white flex items-center justify-center text-lg">
                            {group.groupName[0]}
                          </div>
                          <div className="text-lg">{group.groupName}</div>
                        </div>

                      </div>
                    )}
                  </React.Fragment>

                ))}
              </>
            )}
            {connectedClients.length > 1 && (
              <>
                <div className="bg-blue-500 text-white py-2 px-4 rounded-lg text-center font-bold">
                  <h2>Private chats</h2>
                </div>
                {connectedClients.map(
                  (user, index) =>
                    user.username !== loggedUser.username && (
                      <div
                        key={index}
                        onClick={() => changeChat(user)}
                        className="m-2 bg-white cursor-pointer rounded-lg py-2 px-4 flex items-center space-x-2 justify-between border-b border-gray-200"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="rounded-full h-10 w-10 bg-blue-500 text-white flex items-center justify-center text-lg">
                            {user.username[0]}
                          </div>
                          <div className="text-lg">{user.username}</div>
                        </div>


                        {Object.entries(unreadCounts).map(([userId, count]) => (
                          <div key={userId}>
                            {userId === user.id && count > 0 && (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-green-600 rounded-full">
                                  {count}
                                </span>
                              </div>

                            )}
                          </div>
                        ))}
                      </div>
                    )
                )}
              </>
            )}
          </div>
        </div>

        {(Object.keys(chatUser).length > 0 || chatInGroup.groupName || isBroadcast === true) && (
          <div className="w-2/3 h-full flex flex-col">
            <div className="flex h-screen flex-col bg-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 py-4 flex-none flex justify-between items-center px-4">
                <div className="flex items-center space-x-2">
                  <div className="rounded-full h-12 w-12 bg-green-500 text-white flex items-center justify-center text-2xl font-bold"
                    onClick={() => console.log(chatInGroup)}
                  >
                    {isBroadcast ?
                      <span>B</span>
                      :
                      <>
                        {isPrivateChat
                          ? chatUser.username[0]
                          : chatInGroup.groupName[0]}
                      </>}
                  </div>

                  <h1 className="text-2xl font-bold text-white">
                    {isBroadcast ? <span>Broad Cast</span> :
                      <>{isPrivateChat ? chatUser.username : chatInGroup.groupName}</>}
                  </h1>
                </div>
                <Dropdown>
                  {(!isPrivateChat && isUserAdmin(loggedUser.id, chatInGroup.groupId)) && (<>
                    <p
                      onClick={() => showModalHandler(true, "add")}
                      className="block px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Add members
                    </p>
                    <Modal
                      role={role}
                      showModalHandler={showModalHandler}
                      showModal={showModal}
                      connectedClients={connectedClients}
                      chatInGroup={chatInGroup}
                      loggedUser={loggedUser}
                      isUserAdmin={isUserAdmin}
                    />
                    <p className="block px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100" onClick={() => showModalHandler(true, "all")}>
                      All members
                    </p>

                    <Modal
                      role={role}
                      showModalHandler={showModalHandler}
                      showModal={showModal}
                      connectedClients={connectedClients}
                      chatInGroup={chatInGroup}
                      loggedUser={loggedUser}
                    />


                  </>

                  )}
                  <p className="block px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100" onClick={closeHandler}>
                    Close discussion
                  </p>

                </Dropdown>
              </div>
              <div className="flex-grow overflow-y-auto">
                {messagesToDisplay.map(
                  (message, index) =>
                    (isBroadcast ||

                      (isPrivateChat &&
                        ((message.from === loggedUser.id &&
                          message.to === chatUser.id) ||
                          (message.from === chatUser.id &&
                            message.to === loggedUser.id))) ||
                      ((!isPrivateChat && !isBroadcast) &&
                        message.to === chatInGroup.groupId)) && (
                      <div key={index} className="flex flex-col p-2">
                        {message.from === loggedUser.id ? (
                          <div className="flex items-center space-x-4 self-end group hover:none ">
                            <div className=" pt-1 px-10">
                              <button
                                className="absolute transform -translate-y-1/2 text-red-500 hidden group-hover:block  hover:text-red-600"
                                onClick={() => deleteMessage(message.id, isPrivateChat)}
                              >
                                Delete
                              </button>
                            </div>
                            <div className="rounded-full h-10 w-10 bg-green-500 text-white flex items-center justify-center text-lg">
                              {loggedUser.username[0]}
                            </div>
                            <div className="rounded-xl rounded-tr bg-blue-500 py-2 px-3 text-white">
                              <p>{message.msg}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-4 self-start group hover:none">
                            <div className="rounded-full h-10 w-10 bg-green-500 text-white flex items-center justify-center text-lg">
                              {isBroadcast ? message.username[0] :
                                <>{isPrivateChat
                                  ? chatUser.username[0]
                                  : message.username[0]}
                                </>}
                            </div>
                            <div className="rounded-xl rounded-tl bg-gray-300 py-2 px-3">
                              <div className="font-bold text-sm">
                                {isBroadcast ? message.username : <>
                                  {isPrivateChat
                                    ? chatUser.username
                                    : message.username}
                                </>}
                              </div>
                              <p className="text-sm mt-1">{message.msg}</p>
                            </div>
                            <small className="mt-2 text-xs text-black-600">{moment(message.readableTime).fromNow()}</small>

                            <div className=" pt-8 px-0">
                              <button
                                className="absolute transform -translate-y-1/2 text-red-500 hidden group-hover:block  hover:text-red-600"
                                onClick={() => deleteMessage(message.id, isPrivateChat)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                )}
              </div>

              <div className="flex items-center p-4">
                <input
                  ref={inputRef}
                  type="text"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  value={message}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                <button
                  onClick={sendMessage}
                  className="ml-2 rounded-lg bg-blue-500 px-4 py-2 text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Discussion;

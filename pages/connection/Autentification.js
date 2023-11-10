import React from "react";

function Autentification({
  setIsRegister,
  setUsername,
  setPassword ,
  handleSubmit,
  username,
  password,
  error,
  isRegister,
  
}) {
  return (
    <>
      <div className="flex items-center justify-center h-screen bg-blue-200">
        <div className="p-10 bg-white rounded-lg shadow-xl w-96">
          <h2 className="text-3xl font-bold mb-10 text-gray-800 text-center">
            Welcome to ChatSpace
          </h2>
          <div className="space-y-5">
            <div className="flex items-center justify-center my-4">
              <>
                <div
                  className={`cursor-pointer w-1/2 text-center py-2 ${
                    isRegister ? "" : "bg-blue-600 text-white"
                  }`}
                  onClick={() => setIsRegister(false)}
                >
                  Login
                </div>
                <div
                  className={`cursor-pointer w-1/2 text-center py-2 ${
                    isRegister ? "bg-blue-600 text-white" : ""
                  }`}
                  onClick={() => setIsRegister(true)}
                >
                  Register
                </div>
              </>
            </div>
            
            <div>
              <label
                className="block text-sm font-bold mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded mt-1"
                id="username"
                type="text"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                value={username}
              />
            </div>

            <div>
              <label
                className="block text-sm font-bold mb-2"
                htmlFor="username"
              >
                Password
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded mt-1"
                id="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                value={password}
              />
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>

            <div>
              <button
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                type="button"
                onClick={handleSubmit}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Autentification;


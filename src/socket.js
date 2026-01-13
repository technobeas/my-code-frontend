// import { io } from "socket.io-client";

// const socket = io("http://localhost:5000", {
//   autoConnect: true,
// });

// socket.on("connect", () => {
//   const userId = localStorage.getItem("userId");
//   if (userId) {
//     socket.emit("userOnline", userId);
//   }
// });

// export default socket;

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE_URL, {
  autoConnect: true,
});

socket.on("connect", () => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    socket.emit("userOnline", userId);
  }
});

export default socket;

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = (token) => {
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const joinTouristRoom = () => {
  socket.emit('tourist:join');
};

export const leaveTouristRoom = () => {
  socket.emit('tourist:leave');
};

export const updateLocation = (location) => {
  socket.emit('tourist:location_update', location);
};

export const triggerSOS = () => {
  socket.emit('sos:triggered');
};

export const joinAdminRoom = () => {
  socket.emit('admin:join');
};

export const onTouristMoved = (callback) => {
  socket.on('admin:tourist_moved', callback);
};

export const onSOSAlert = (callback) => {
  socket.on('admin:sos_alert', callback);
};

export const offTouristMoved = (callback) => {
  socket.off('admin:tourist_moved', callback);
};

export const offSOSAlert = (callback) => {
  socket.off('admin:sos_alert', callback);
};

export default socket;

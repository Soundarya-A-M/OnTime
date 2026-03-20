// Singleton to share the Socket.IO instance across modules
let ioInstance = null;

export const setIO = (io) => {
    ioInstance = io;
};

export const getIO = () => ioInstance;

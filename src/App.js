

import React, { useState } from 'react';
import './App.css';
import RoomSelector from './components/RoomSelector';
import Whiteboard from './components/Whiteboard';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const handleJoinRoom = (id, host) => {
    setRoomId(id);
    setIsHost(host);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setIsHost(false);
  };

  return (
    <div className="App">
      {!roomId ? (
        <RoomSelector onJoinRoom={handleJoinRoom} />
      ) : (
        <Whiteboard 
          roomId={roomId} 
          isHost={isHost}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;


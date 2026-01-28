import React, { useState } from 'react';
import './RoomSelector.css';

const RoomSelector = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    onJoinRoom(newRoomId, true);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), false);
    }
  };

  return (
    <div className="room-selector">
      <div className="room-selector-card">
        <h1>Collaborative Whiteboard</h1>
        <p className="subtitle">Draw together in real-time</p>
        
        <div className="room-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            Create New Room
          </button>
          
          <div className="divider">
            <span>OR</span>
          </div>
          
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="room-input"
              maxLength={6}
            />
            <button 
              type="submit" 
              className="btn btn-secondary"
              disabled={!roomId.trim()}
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomSelector;


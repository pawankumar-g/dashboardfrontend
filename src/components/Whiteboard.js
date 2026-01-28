import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Whiteboard.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const Whiteboard = ({ roomId, isHost, onLeaveRoom }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentToolRef = useRef('pen');
  const currentColorRef = useRef('#000000');
  const lineWidthRef = useRef(3);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [usersCount, setUsersCount] = useState(1);

  // Sync refs with state
  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  useEffect(() => {
    lineWidthRef.current = lineWidth;
  }, [lineWidth]);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL);
    const socket = socketRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth - 40;
      canvas.height = container.clientHeight - 120;
      
      // Set drawing properties
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Join room
    socket.emit('join-room', roomId);

    // Load snapshot
    socket.on('snapshot-loaded', (snapshot) => {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = snapshot;
    });

    // Handle remote drawing
    socket.on('draw', (data) => {
      drawOnCanvas(data, false);
    });

    // Handle clear canvas
    socket.on('clear-canvas', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Handle users count
    socket.on('users-count', (count) => {
      setUsersCount(count);
    });

    // Drawing functions
    const getEventPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const drawOnCanvas = (data, emit = true) => {
      const { x, y, prevX, prevY, color, lineWidth: width, tool } = data;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      if (tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Save snapshot periodically
      if (emit && Math.random() < 0.1) {
        const snapshot = canvas.toDataURL();
        socket.emit('save-snapshot', { roomId, snapshot });
      }
    };

    let prevPos = null;

    const startDrawing = (e) => {
      isDrawingRef.current = true;
      setIsDrawing(true);
      prevPos = getEventPos(e);
    };

    const draw = (e) => {
      if (!isDrawingRef.current) return;
      
      const currentPos = getEventPos(e);
      
      const drawData = {
        x: currentPos.x,
        y: currentPos.y,
        prevX: prevPos.x,
        prevY: prevPos.y,
        color: currentColorRef.current,
        lineWidth: lineWidthRef.current,
        tool: currentToolRef.current,
        roomId: roomId
      };

      drawOnCanvas(drawData, true);
      socket.emit('draw', drawData);
      
      prevPos = currentPos;
    };

    const stopDrawing = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setIsDrawing(false);
        // Save snapshot on drawing end
        const snapshot = canvas.toDataURL();
        socket.emit('save-snapshot', { roomId, snapshot });
      }
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startDrawing(e.touches[0]);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      draw(e.touches[0]);
    });
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopDrawing();
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      socket.disconnect();
    };
  }, [roomId]);

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socketRef.current.emit('clear-canvas', roomId);
    const snapshot = canvas.toDataURL();
    socketRef.current.emit('save-snapshot', { roomId, snapshot });
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-header">
        <div className="room-info">
          <h2>Room: {roomId}</h2>
          <span className="users-count">{usersCount} {usersCount === 1 ? 'user' : 'users'}</span>
        </div>
        <button className="btn-leave" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="whiteboard-wrapper">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
        />
      </div>

      <div className="toolbar">
        <div className="tool-group">
          <button
            className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`}
            onClick={() => setCurrentTool('pen')}
            title="Pen"
          >
            ✏️
          </button>
          <button
            className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setCurrentTool('eraser')}
            title="Eraser"
          >
            🧹
          </button>
        </div>

        <div className="tool-group">
          <label className="color-picker-label">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="color-picker"
            />
            <span>Color</span>
          </label>
        </div>

        <div className="tool-group">
          <label className="line-width-label">
            <span>Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="line-width-slider"
            />
            <span>{lineWidth}px</span>
          </label>
        </div>

        <div className="tool-group">
          <button
            className="tool-btn clear-btn"
            onClick={handleClearCanvas}
            title="Clear Canvas"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;


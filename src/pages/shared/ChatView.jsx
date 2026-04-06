import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSend, FiUser, FiMessageCircle, FiPlus } from 'react-icons/fi';
import Modal from '../../components/Modals/Modal';

const ChatView = () => {
  const { userInfo } = useSelector(state => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Assuming backend runs on 5000 in dev
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    if (!socket) return;

    socket.on('receive_message', (message) => {
      fetchConversations(); // refresh last messages in the sidebar
      if (activeChat && message.conversationId === activeChat._id) {
        setMessages((prev) => [...prev, message]);
      } else if (message.sender._id !== userInfo._id) {
        toast.success(`New message from ${message.sender.name}`, { icon: <FiMessageCircle /> });
      }
    });

    return () => socket.off('receive_message');
    // eslint-disable-next-line
  }, [socket, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.filter(u => u._id !== userInfo._id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectChat = async (conv) => {
    setActiveChat(conv);
    if (socket) socket.emit('join_chat', conv._id);
    try {
      const { data } = await api.get(`/chat/${conv._id}/messages`);
      setMessages(data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !socket) return;

    const messageData = {
      conversationId: activeChat._id,
      sender: userInfo._id, // sending ID to socket
      text: newMessage.trim()
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const startNewChat = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const { data } = await api.post('/chat/conversation', {
        participantIds: [selectedUser],
        isGroup: false
      });
      setModalOpen(false);
      fetchConversations();
      handleSelectChat(data);
    } catch (error) {
      toast.error('Failed to start chat');
    }
  };

  const getChatName = (conv) => {
    if (conv.isGroup) return conv.name;
    const other = conv.participants.find(p => p._id !== userInfo._id);
    return other ? other.name : 'Unknown User';
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm z-10">
          <h3 className="font-bold text-lg text-gray-800">Messages</h3>
          <button onClick={() => setModalOpen(true)} className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors" title="New Chat">
            <FiPlus />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No conversations yet.</div>
          ) : (
            conversations.map(conv => (
              <div key={conv._id} onClick={() => handleSelectChat(conv)} className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${activeChat?._id === conv._id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 min-w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <FiUser />
                  </div>
                  <div className="flex-1 truncate">
                    <h4 className="font-semibold text-gray-900 truncate">{getChatName(conv)}</h4>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage ? conv.lastMessage.text : 'No messages yet'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-white">
        {!activeChat ? (
          <div className="flex-1 flex flex-col gap-4 items-center justify-center bg-gray-50 text-gray-400">
            <FiMessageCircle className="text-6xl text-gray-300" />
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 shadow-sm flex items-center gap-3 z-10">
              <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <FiUser />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{getChatName(activeChat)}</h3>
                <p className="text-xs text-gray-500">{activeChat.isGroup ? 'Group Chat' : 'Direct Message'}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No messages in this chat. Start the conversation!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.sender._id === userInfo._id;
                  return (
                    <div key={idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-primary-600 text-white rounded-br-sm shadow-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {!isOwn ? msg.sender.name : 'You'}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input box */}
            <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 transition-shadow" />
                <button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:bg-primary-300">
                  <FiSend className="text-xl -ml-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Direct Message">
        <form onSubmit={startNewChat} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">-- Choose User --</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 font-medium text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Start Chat</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChatView;

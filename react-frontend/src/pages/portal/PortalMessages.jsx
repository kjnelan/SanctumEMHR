import { useState, useEffect } from 'react';
import PortalLayout from './PortalLayout';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import Modal from '../../components/Modal';
import ErrorMessage from '../../components/ErrorMessage';
import { usePortalAuth } from '../../hooks/usePortalAuth';

function PortalMessages() {
  const { client } = usePortalAuth();
  const [messages, setMessages] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New message form state
  const [newMessageForm, setNewMessageForm] = useState({
    subject: '',
    body: '',
    priority: 'normal'
  });

  // Fetch inbox messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/custom/api/messages/get_inbox.php?view=inbox',
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch thread
  const fetchThread = async (threadId) => {
    try {
      setError('');

      const response = await fetch(
        `/custom/api/messages/get_thread.php?thread_id=${threadId}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch thread');
      }

      const data = await response.json();
      if (data.success) {
        setThreadMessages(data.messages || []);
        // Mark as read
        await markAsRead([threadId]);
      } else {
        setError(data.error || 'Failed to load thread');
      }
    } catch (err) {
      console.error('Fetch thread error:', err);
      setError('Failed to load thread');
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds) => {
    try {
      await fetch('/custom/api/messages/mark_read.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message_ids: messageIds })
      });
      // Refresh unread count
      fetchMessages();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedThread) return;

    try {
      setSendingReply(true);
      setError('');

      // Get recipient info from the thread (always reply to staff provider)
      const firstMessage = threadMessages[0];

      const response = await fetch('/custom/api/messages/send_message.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          thread_id: selectedThread,
          recipient_type: 'staff',
          recipient_id: client.providerId, // Reply to their provider
          body: replyBody,
          priority: 'normal'
        })
      });

      const data = await response.json();
      if (data.success) {
        setReplyBody('');
        // Refresh thread
        await fetchThread(selectedThread);
      } else {
        setError(data.error || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Send reply error:', err);
      setError('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Send new message (to provider)
  const handleSendNewMessage = async (e) => {
    e.preventDefault();

    try {
      setError('');

      const response = await fetch('/custom/api/messages/send_message.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipient_type: 'staff',
          recipient_id: client.providerId,
          subject: newMessageForm.subject,
          body: newMessageForm.body,
          priority: newMessageForm.priority
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowNewMessage(false);
        setNewMessageForm({
          subject: '',
          body: '',
          priority: 'normal'
        });
        fetchMessages();
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sanctum-glass-main p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
              <p className="text-gray-600 mt-1">
                Secure messaging with your care team
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                  {unreadCount} unread
                </span>
              )}
              <PrimaryButton onClick={() => setShowNewMessage(true)}>
                New Message
              </PrimaryButton>
            </div>
          </div>
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Messages List / Thread View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <div className="sanctum-glass-main p-4">
              <h3 className="font-semibold text-gray-800 mb-3">My Messages</h3>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Send a message to your provider to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        setSelectedThread(msg.id);
                        fetchThread(msg.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedThread === msg.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white/60 hover:bg-white/80 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`font-medium ${!msg.isRead ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                          {msg.senderName || 'Your Care Team'}
                        </span>
                        {!msg.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 font-medium mb-1">
                        {msg.subject || '(No subject)'}
                      </div>
                      <div className="text-xs text-gray-500 truncate mb-1">
                        {msg.preview}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(msg.lastReplyAt || msg.createdAt)}</span>
                      </div>
                      {msg.replyCount > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Thread View */}
          <div className="lg:col-span-2">
            <div className="sanctum-glass-main p-6">
              {!selectedThread ? (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>Select a message to view the conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Thread Messages */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {threadMessages.map((msg, index) => {
                      const isCurrentUser = msg.senderType === 'client';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xl ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-white'} rounded-lg p-4 shadow`}>
                            {index === 0 && msg.subject && (
                              <div className="font-bold mb-2 pb-2 border-b border-white/20">
                                {msg.subject}
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="font-medium mb-1">{msg.senderName}</div>
                                <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                                <div className="text-xs mt-2 opacity-70">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Form */}
                  <div className="border-t border-gray-200 pt-4">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2">
                      <PrimaryButton
                        onClick={handleSendReply}
                        disabled={!replyBody.trim() || sendingReply}
                      >
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Message Modal */}
        {showNewMessage && (
          <Modal onClose={() => setShowNewMessage(false)}>
            <Modal.Header>
              <h2 className="text-xl font-bold text-gray-800">New Message</h2>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={handleSendNewMessage} className="space-y-4">
                {error && <ErrorMessage>{error}</ErrorMessage>}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>To:</strong> {client.providerName || 'Your Care Team'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newMessageForm.subject}
                    onChange={(e) => setNewMessageForm({ ...newMessageForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newMessageForm.body}
                    onChange={(e) => setNewMessageForm({ ...newMessageForm, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newMessageForm.priority}
                    onChange={(e) => setNewMessageForm({ ...newMessageForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <SecondaryButton onClick={() => setShowNewMessage(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSendNewMessage}>
                Send Message
              </PrimaryButton>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}

export default PortalMessages;

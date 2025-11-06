import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemText, Typography, Box, 
  CircularProgress, Paper, Divider, Button
} from '@mui/material';
import axios from 'axios';
import MessagesList from './MessagesList';

const ConversationsList = ({ selectedSubaccount, phoneNumber }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
	const fetchConversations = async () => {
		setLoading(true);
		setError(null);
		
		try {
		const response = await axios.get(
			`http://localhost:5000/subaccounts/${selectedSubaccount.sid}/${phoneNumber.phone_number}/conversations`
		);
		setConversations(response.data);
		} catch (err) {
		console.error('Error fetching conversations:', err);
		setError('Failed to fetch conversations. Please try again.');
		} finally {
		setLoading(false);
		}
  	};
    if (selectedSubaccount && phoneNumber) {
      fetchConversations();
    }
  }, [selectedSubaccount, phoneNumber]);

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (selectedConversation) {
    return (
      <Box>
        <Button 
          variant="outlined" 
          onClick={handleBackToConversations}
          sx={{ marginBottom: 2 }}
        >
          Back to Conversations
        </Button>
        <MessagesList 
          selectedSubaccount={selectedSubaccount} 
          conversationSid={selectedConversation.sid}
          conversationName={selectedConversation.friendlyName}
        />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ maxHeight: 400, overflow: 'auto', marginTop: 2 }}>
      <Typography variant="h6" sx={{ padding: 2 }}>
        Conversations for {phoneNumber.phone_number}
      </Typography>
      <Divider />
      
      {conversations.length === 0 ? (
        <Box p={2} textAlign="center">
          <Typography variant="body1">No conversations found for this phone number.</Typography>
        </Box>
      ) : (
        <List>
          {conversations.map((conversation) => (
            <React.Fragment key={conversation.sid}>
              <ListItem 
                button 
                onClick={() => handleConversationClick(conversation)}
              >
                <ListItemText
                  primary={conversation.friendlyName || 'Unnamed Conversation'}
                  secondary={`Created: ${new Date(conversation.dateCreated).toLocaleString()}`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ConversationsList;

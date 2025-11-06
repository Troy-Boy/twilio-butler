import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemText, Typography, Box, 
  CircularProgress, Paper, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import axios from 'axios';

const MessagesList = ({ selectedSubaccount, conversationSid, conversationName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetails, setMessageDetails] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
	const fetchMessages = async () => {
		setLoading(true);
		setError(null);
		
		try {
		const response = await axios.get(
			`http://localhost:5000/subaccounts/${selectedSubaccount.sid}/conversations/${conversationSid}/messages`
		);
		setMessages(response.data);
		} catch (err) {
		console.error('Error fetching messages:', err);
		setError('Failed to fetch messages. Please try again.');
		} finally {
		setLoading(false);
		}
  	};
    if (selectedSubaccount && conversationSid) {
      fetchMessages();
    }
  }, [selectedSubaccount, conversationSid]);


  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    setLoading(true);
    
    try {
      const response = await axios.get(
        `http://localhost:5000/subaccounts/${selectedSubaccount.sid}/conversations/${conversationSid}/messages/${message.sid}`
      );
      setMessageDetails(response.data);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching message details:', err);
      setError('Failed to fetch message details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  if (loading && !dialogOpen) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !dialogOpen) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Paper elevation={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Typography variant="h6" sx={{ padding: 2 }}>
          Messages in {conversationName || 'Conversation'}
        </Typography>
        <Divider />
        
        {messages.length === 0 ? (
          <Box p={2} textAlign="center">
            <Typography variant="body1">No messages found in this conversation.</Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message) => (
              <React.Fragment key={message.sid}>
                <ListItem 
                  button 
                  onClick={() => handleMessageClick(message)}
                >
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center' 
                      }}>
                        <Typography 
                          component="span" 
                          variant="body1"
                          sx={{ fontWeight: 'medium' }}
                        >
                          {message.author}
                        </Typography>
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary"
                        >
                          {new Date(message.dateCreated).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={message.body}
                    secondaryTypographyProps={{
                      sx: {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          {messageDetails && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>From:</strong> {messageDetails.author}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Date:</strong> {new Date(messageDetails.dateCreated).toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Message:</strong>
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', mb: 2 }}>
                <Typography>{messageDetails.body}</Typography>
              </Paper>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                <strong>Metadata:</strong>
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(messageDetails.attributes, null, 2)}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessagesList;

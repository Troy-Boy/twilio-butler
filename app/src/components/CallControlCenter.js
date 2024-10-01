import React, { useState } from 'react';
import { Button, TextField, Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

function CallControlCenter() {
  const [fromNumber, setFromNumber] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [ongoingCalls, setOngoingCalls] = useState([]);

  const handleMakeCall = () => {
    axios.post('/calls', { from: fromNumber, to: toNumber })
      .then(response => {
        setOngoingCalls([...ongoingCalls, response.data]);
      })
      .catch(error => {
        console.error('Error making call:', error);
      });
  };

  const handleHangupCall = (callSid) => {
    axios.post(`/calls/${callSid}/hangup`)
      .then(() => {
        setOngoingCalls(ongoingCalls.filter(call => call.sid !== callSid));
      })
      .catch(error => {
        console.error('Error hanging up call:', error);
      });
  };

  return (
    <Box>
      <Typography variant="h5">Call Control Center</Typography>

      {/* Make New Call */}
      <Box mt={3}>
        <TextField
          label="From Number"
          variant="outlined"
          fullWidth
          value={fromNumber}
          onChange={(e) => setFromNumber(e.target.value)}
        />
        <TextField
          label="To Number"
          variant="outlined"
          fullWidth
          value={toNumber}
          onChange={(e) => setToNumber(e.target.value)}
          style={{ marginTop: '10px' }}
        />
        <Button variant="contained" color="primary" onClick={handleMakeCall} fullWidth style={{ marginTop: '10px' }}>
          Make Call
        </Button>
      </Box>

      {/* Ongoing Calls */}
      <Box mt={5}>
        <Typography variant="h6">Ongoing Calls</Typography>
        <List>
          {ongoingCalls.map(call => (
            <ListItem key={call.sid}>
              <ListItemText primary={`From: ${call.from} To: ${call.to} Status: ${call.status}`} />
              <Button variant="outlined" color="secondary" onClick={() => handleHangupCall(call.sid)}>
                Hang Up
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}

export default CallControlCenter;

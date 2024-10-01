import React from 'react';
import { Container, Grid, Paper } from '@mui/material';
import SubaccountManagement from './components/SubaccountManagement.js';
import CallControlCenter from './components/CallControlCenter.js';

function App() {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Subaccount and Phone Number Management */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <SubaccountManagement />
          </Paper>
        </Grid>

        {/* Call Control Center */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: '20px' }}>
            <CallControlCenter />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { 
Typography, Button, TextField, Box, List, ListItem, 
ListItemText, CircularProgress, Paper, Dialog, 
DialogTitle, DialogContent, DialogActions, Tab, Tabs,
Divider, Alert,
ListItemButton
} from '@mui/material';
import axios from 'axios';
import ConversationsList from './ConversationsList';

function SubaccountManagement() {
const [subaccounts, setSubaccounts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [newSubaccountName, setNewSubaccountName] = useState('');
const [selectedSubaccount, setSelectedSubaccount] = useState(null);
const [phoneNumbers, setPhoneNumbers] = useState([]);
const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);
const [dialogOpen, setDialogOpen] = useState(false);
const [tabValue, setTabValue] = useState(0);
const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
const [showConversations, setShowConversations] = useState(false);

useEffect(() => {
	fetchSubaccounts();
}, []);

const fetchSubaccounts = async () => {
	setLoading(true);
	setError(null);
	try {
	const response = await axios.get('http://localhost:5000/subaccounts');
	setSubaccounts(response.data);
	} catch (err) {
	console.error('Error fetching subaccounts:', err);
	setError('Failed to fetch subaccounts. Please try again.');
	} finally {
	setLoading(false);
	}
};

const handleCreateSubaccount = async () => {
	if (!newSubaccountName) return;
	
	setLoading(true);
	setError(null);
	try {
	const response = await axios.post('http://localhost:5000/subaccounts', {
		friendly_name: newSubaccountName
	});
	setSubaccounts([...subaccounts, response.data]);
	setNewSubaccountName('');
	} catch (err) {
	console.error('Error creating subaccount:', err);
	setError('Failed to create subaccount. Please try again.');
	} finally {
	setLoading(false);
	}
};

const getSubaccount = async (subaccount_sid) => {
	// Get a subaccount
	try {
		const response = await axios.get(`http://localhost:5000/subaccounts/${subaccount_sid}`);
		console.log('Subaccount details:', response.data);
		setSelectedSubaccount(response.data);
	} catch (err) {
		console.error('Error getting subaccount:', err);
		setError('Failed to get subaccount. Please try again.');
	}
};

const handleSubaccountSelect = async (subaccount) => {
	getSubaccount(subaccount.sid);
	fetchPhoneNumbers(subaccount);
	setTabValue(0);
	setShowConversations(false);
};

const fetchPhoneNumbers = async (subaccount) => {
	setLoadingPhoneNumbers(true);
	try {
	const response = await axios.get(`http://localhost:5000/subaccounts/${subaccount.sid}/phone-numbers`);
	setPhoneNumbers(response.data);
	} catch (err) {
	console.error('Error fetching phone numbers:', err);
	} finally {
	setLoadingPhoneNumbers(false);
	}
};

const handleDeleteSubaccount = (subaccount) => {
	setDialogOpen(true);
};

const confirmDelete = async () => {
	try {
	await axios.delete(`http://localhost:5000/subaccounts/${selectedSubaccount.sid}`, {
		data: { closed: true }
	});
	setSubaccounts(subaccounts.filter(s => s.sid !== selectedSubaccount.sid));
	setSelectedSubaccount(null);
	setPhoneNumbers([]);
	setDialogOpen(false);
	} catch (err) {
	console.error('Error deleting subaccount:', err);
	setError('Failed to delete subaccount. Please try again.');
	}
};

const handleReleasePhoneNumber = async (phoneNumberSid) => {
	try {
	await axios.delete(`http://localhost:5000/subaccounts/${selectedSubaccount.sid}/${phoneNumberSid}`);
	// Refresh phone numbers list
	fetchPhoneNumbers(selectedSubaccount);
	} catch (err) {
	console.error('Error releasing phone number:', err);
	}
};

const handleShowConversations = (phoneNumber) => {
	setSelectedPhoneNumber(phoneNumber);
	setShowConversations(true);
	setTabValue(1);
};

const handleTabChange = (event, newValue) => {
	setTabValue(newValue);
};

return (
	<Box>
	<Typography variant="h5" component="h2" gutterBottom>
		Subaccount Management
	</Typography>

	<Box display="flex" mb={2}>
		<TextField
		label="New Subaccount Name"
		variant="outlined"
		size="small"
		value={newSubaccountName}
		onChange={(e) => setNewSubaccountName(e.target.value)}
		sx={{ flexGrow: 1, mr: 2 }}
		/>
		<Button
		variant="contained"
		color="primary"
		onClick={handleCreateSubaccount}
		disabled={loading || !newSubaccountName}
		>
		Create Subaccount
		</Button>
	</Box>

	{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

	<Paper elevation={2} sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
		<Typography variant="h6" sx={{ p: 2 }}>Subaccounts</Typography>
		<Divider />
		{loading ? (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
			<CircularProgress />
		</Box>
		) : (
		<List>
			{subaccounts.map(subaccount => (
			<React.Fragment key={subaccount.sid}>
				<ListItemButton onClick={() => handleSubaccountSelect(subaccount)}>
				<ListItemText
					primary={`friendlyName: ${subaccount.id}`}
					secondary={`SID: ${subaccount.sid}`}
				/>
				<Button 
					variant="outlined" 
					color="error" 
					onClick={(e) => {
					e.stopPropagation();
					handleDeleteSubaccount(subaccount);
					}}
				>
					Delete
				</Button>
				</ListItemButton>
				<Divider />
			</React.Fragment>
			))}
		</List>
		)}
	</Paper>

	{selectedSubaccount && (
		<Box mt={4}>
		<Typography variant="h6" gutterBottom>
			Selected Subaccount: {selectedSubaccount.friendly_name}
		</Typography>
		<List>
			<ListItem>
				<ListItemText>
					SID: {selectedSubaccount.sid}
				</ListItemText>
			</ListItem>
			<ListItem>
				<ListItemText>
					Status: {selectedSubaccount.status}
				</ListItemText>
			</ListItem>
			<ListItem>
				<ListItemText>
					Date created: {selectedSubaccount.date_created}
				</ListItemText>
			</ListItem>
			<ListItem>
				<ListItemText>
					Date updated: {selectedSubaccount.date_updated}
				</ListItemText>
			</ListItem>
		</List>

		<Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
			<Tab label="Phone Numbers" />
			{showConversations && <Tab label="Conversations" />}
		</Tabs>

		{tabValue === 0 && (
			<Paper elevation={2} sx={{ maxHeight: 300, overflow: 'auto' }}>
			<Typography variant="subtitle1" sx={{ p: 2 }}>Phone Numbers</Typography>
			<Divider />
			{loadingPhoneNumbers ? (
				<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
				<CircularProgress />
				</Box>
			) : (
				<List>
				{phoneNumbers.length === 0 ? (
					<ListItem>
					<ListItemText primary="No phone numbers found for this subaccount." />
					</ListItem>
				) : (
					phoneNumbers.map(number => (
					<React.Fragment key={number.sid}>
						<ListItem>
						<ListItemText 
							primary={number.phone_number} 
							secondary={`SID: ${number.sid}`} 
						/>
						<Button 
							variant="outlined" 
							color="primary" 
							onClick={() => handleShowConversations(number)}
							sx={{ mr: 1 }}
						>
							Conversations
						</Button>
						<Button 
							variant="outlined" 
							color="error" 
							onClick={() => handleReleasePhoneNumber(number.sid)}
						>
							Release
						</Button>
						</ListItem>
						<Divider />
					</React.Fragment>
					))
				)}
				</List>
			)}
			</Paper>
		)}

		{tabValue === 1 && showConversations && selectedPhoneNumber && (
			<ConversationsList 
			selectedSubaccount={selectedSubaccount}
			phoneNumber={selectedPhoneNumber}
			/>
		)}
		</Box>
	)}

	<Dialog
		open={dialogOpen}
		onClose={() => setDialogOpen(false)}
	>
		<DialogTitle>Confirm Deletion</DialogTitle>
		<DialogContent>
		<Typography>
			Are you sure you want to delete the subaccount "{selectedSubaccount?.friendly_name}"? 
			This will release all associated phone numbers and cannot be undone.
		</Typography>
		</DialogContent>
		<DialogActions>
		<Button onClick={() => setDialogOpen(false)}>Cancel</Button>
		<Button onClick={confirmDelete} color="error" variant="contained">
			Delete
		</Button>
		</DialogActions>
	</Dialog>
	</Box>
);
}

export default SubaccountManagement;

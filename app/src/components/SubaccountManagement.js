import React, { useState, useEffect } from 'react';
import { 
Typography, Button, TextField, Box, List, ListItem, 
ListItemText, CircularProgress, Paper, Dialog, 
DialogTitle, DialogContent, DialogActions, Tab, Tabs,
Divider, Alert,
ListItemButton, Chip
} from '@mui/material';
import axios from 'axios';
import ConversationsList from './ConversationsList';

function SubaccountManagement() {
const [subaccounts, setSubaccounts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
// const [newSubaccountName, setNewSubaccountName] = useState('');
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
		
		// Fetch badge data in the background for each subaccount
		response.data.forEach(async (subaccount) => {
			if (subaccount.allEmergenciesRegistered === null || subaccount.basicAuthMedia === null) {
				try {
					const badgeResponse = await axios.get(`http://localhost:5000/subaccounts/${subaccount.sid}/badges`);
					// Update the subaccount with badge data
					setSubaccounts(prevSubaccounts => 
						prevSubaccounts.map(sa => 
							sa.sid === subaccount.sid 
								? { ...sa, ...badgeResponse.data }
								: sa
						)
					);
				} catch (err) {
					console.error(`Error fetching badges for ${subaccount.sid}:`, err);
				}
			}
		});
	} catch (err) {
		console.error('Error fetching subaccounts:', err);
		setError('Failed to fetch subaccounts. Please try again.');
	} finally {
		setLoading(false);
	}
};

// const handleCreateSubaccount = async () => {
// 	if (!newSubaccountName) return;
	
// 	setLoading(true);
// 	setError(null);
// 	try {
// 		const response = await axios.post('http://localhost:5000/subaccounts', {
// 			friendly_name: newSubaccountName
// 		});
// 		setSubaccounts([...subaccounts, response.data]);
// 		setNewSubaccountName('');
// 	} catch (err) {
// 		console.error('Error creating subaccount:', err);
// 		setError('Failed to create subaccount. Please try again.');
// 	} finally {
// 		setLoading(false);
// 	}
// };

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

	{/* <Box display="flex" mb={2}>
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
	</Box> */}

	{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

	<Paper elevation={2} sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
		<Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
			<Typography variant="h6">Subaccounts</Typography>
			<Box sx={{ display: 'flex', gap: 2, mr: 10 }}>
				<Typography variant="caption" sx={{ minWidth: 80, textAlign: 'center' }}>
					Emergency Addr.
				</Typography>
				<Typography variant="caption" sx={{ minWidth: 80, textAlign: 'center' }}>
					Basic Auth
				</Typography>
			</Box>
		</Box>
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
				<Chip 
					label={subaccount.allEmergenciesRegistered === null ? '...' : 'E'}
					size="small"
					sx={{ 
						mr: 1,
						backgroundColor: subaccount.allEmergenciesRegistered === null 
							? '#9e9e9e' 
							: subaccount.allEmergenciesRegistered ? '#4caf50' : '#f44336',
						color: 'white',
						fontWeight: 'bold',
						minWidth: 40
					}}
				/>
				<Chip 
					label={subaccount.basicAuthMedia === null ? '...' : 'A'}
					size="small"
					sx={{ 
						mr: 2,
						backgroundColor: subaccount.basicAuthMedia === null 
							? '#9e9e9e' 
							: subaccount.basicAuthMedia ? '#4caf50' : '#f44336',
						color: 'white',
						fontWeight: 'bold',
						minWidth: 40
					}}
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
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
			<Typography variant="h6">
				Selected: {selectedSubaccount.friendly_name}
			</Typography>
			<Chip 
				label="E" 
				size="small"
				sx={{ 
					backgroundColor: selectedSubaccount.allEmergenciesRegistered ? '#4caf50' : '#f44336',
					color: 'white',
					fontWeight: 'bold',
					minWidth: 40
				}}
			/>
			<Chip 
				label="A" 
				size="small"
				sx={{ 
					backgroundColor: selectedSubaccount.basicAuthMedia ? '#4caf50' : '#f44336',
					color: 'white',
					fontWeight: 'bold',
					minWidth: 40
				}}
			/>
		</Box>
		
		{/* Two-column layout */}
		<Box sx={{ display: 'flex', gap: 3 }}>
			{/* Left side - Account info */}
			<Box sx={{ minWidth: 300 }}>
				<Paper elevation={1} sx={{ p: 2 }}>
					<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
						Account Details
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						<Chip 
							label={`Status: ${selectedSubaccount.status}`}
							size="small"
							color={selectedSubaccount.status === 'active' ? 'success' : 'default'}
							variant="outlined"
						/>
						<Chip 
							label={`Created: ${new Date(selectedSubaccount.date_created).toLocaleDateString()}`}
							size="small"
							variant="outlined"
						/>
						<Chip 
							label={`Updated: ${new Date(selectedSubaccount.date_updated).toLocaleDateString()}`}
							size="small"
							variant="outlined"
						/>
					</Box>
					<Box sx={{ mt: 2 }}>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
							SID
						</Typography>
						<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
							{selectedSubaccount.sid}
						</Typography>
					</Box>
				</Paper>
			</Box>

			{/* Right side - Phone Numbers and Conversations */}
			<Box sx={{ flexGrow: 1 }}>
				<Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
					<Tab label="Phone Numbers" />
					{showConversations && <Tab label="Conversations" />}
				</Tabs>

				{tabValue === 0 && (
					<Paper elevation={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
					<Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<Typography variant="subtitle1">Phone Numbers</Typography>
						<Typography variant="caption" sx={{ mr: 18 }}>
							Emergency Addr.
						</Typography>
					</Box>
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
								<Chip 
									label="E" 
									size="small"
									sx={{ 
										mr: 1,
										backgroundColor: number.emergency_address_sid ? '#4caf50' : '#f44336',
										color: 'white',
										fontWeight: 'bold',
										minWidth: 40
									}}
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
		</Box>
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

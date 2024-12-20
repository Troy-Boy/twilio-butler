import React, { useState, useEffect } from 'react';
import { Button, Select, MenuItem, TextField, Typography, Box, List, ListItem, ListItemText, Switch } from '@mui/material';
import axios from 'axios';

function SubaccountManagement() {
	const [subaccounts, setSubaccounts] = useState([]);
	const [selectedSubaccount, setSelectedSubaccount] = useState('');
	const [phoneNumbers, setPhoneNumbers] = useState([]);
	const [newSubaccount, setNewSubaccount] = useState('');
	const [closeSubaccount, setCloseSubaccount] = useState(false);

	useEffect(() => {
		// Fetch the list of subaccounts on load
		getSubaccounts()
	}, []);

	const getSubaccounts = () =>{
		axios.get('http://localhost:5000/subaccounts')
		.then(response => {
			setSubaccounts(response.data);
		})
		.catch(error => {
			console.error('Error fetching subaccounts:', error);
		});
	}

	const handleSubaccountChange = (event) => {
		const subaccount = event.target.value;
		getSubaccount(subaccount);
		// Fetch phone numbers for selected subaccount
		axios.get(`http://localhost:5000/subaccounts/${subaccount}/phone-numbers`)
		.then(response => {
			setPhoneNumbers(response.data);
		})
		.catch(error => {
			console.error('Error fetching phone numbers:', error);
		});
	};

	const handleCreateSubaccount = () => {
		// Create a new subaccount
		axios.post('http://localhost:5000/subaccounts', { friendly_name: newSubaccount })
		.then(response => {
			setSubaccounts([...subaccounts, response.data]);
			setNewSubaccount('');  // Reset input
		})
		.catch(error => {
			console.error('Error creating subaccount:', error);
		});
	};
	
	const handleReleasePhoneNumber = (phone_sid) => {
		// Create a new subaccount
		axios.delete(`http://localhost:5000/subaccounts/${selectedSubaccount.sid}/${phone_sid}`)
		.then(response => {
			handleSubaccountChange(selectedSubaccount);
			console.log(response.data);
			// getSubaccounts();
			// getSubaccount(selectedSubaccount);
		})
		.catch(error => {
			console.error('Error removing phone number:', error);
		});
	};
	
	const handleDeleteSubaccount = () => {
		// Create a new subaccount
		console.log('sending phone number: ' + selectedSubaccount.sid);
		axios.delete(`http://localhost:5000/subaccounts/${selectedSubaccount.sid}`, {
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				closed: newSubaccount
			}
		})
		.then(response => {
			getSubaccounts();
			setSelectedSubaccount('');  // Reset selected subaccount
		})
		.catch(error => {
			console.error('Error removing subaccounts', error);
		});
	};

	const getSubaccount = (subaccount_sid) => {
		// Get a subaccount
		axios.get(`http://localhost:5000/subaccounts/${subaccount_sid}`)
		.then(response => {
			setSelectedSubaccount(response.data);
		})
		.catch(error => {
			console.error('Error getting subaccount:', error);
		});
	}

	return (
		<Box>
			<Typography variant="h5">Subaccount Management</Typography>

			{/* Create Subaccount */}
			<Box mt={3} mb={3}>
				<TextField
				label="New Subaccount Name"
				variant="outlined"
				fullWidth
				value={newSubaccount}
				onChange={(e) => setNewSubaccount(e.target.value)}
				/>
				<Button variant="contained" color="primary" onClick={handleCreateSubaccount} fullWidth style={{ marginTop: '10px' }}>
					Create Subaccount
				</Button>
			</Box>

			{/* Select Subaccount */}
			<Select
				defaultValue=''
				value={selectedSubaccount.sid}
				onChange={handleSubaccountChange}
				displayEmpty
				fullWidth
			>
				<MenuItem value="" disabled>Select Subaccount</MenuItem>
				{subaccounts.map(sub => (
				<MenuItem key={sub.sid} value={sub.sid}>{sub.id}</MenuItem>
				))}
			</Select>
			{selectedSubaccount ? (
				<Box mt={3}>
					{/* Subaccount Information */}
					<Box>
						<Typography variant="h6">Selected Subaccount Information</Typography>
						{/* Display subaccount details here */}
					</Box>

					{/* Phone Numbers */}
					<Box mt={3}>
						<Typography variant="h6">Phone Numbers</Typography>
						<List>
						{phoneNumbers.map(phone => (
							<ListItem key={phone.sid}>
							<ListItemText primary={phone.phone_number} />
							<Button variant="outlined" color="secondary" onClick={() => handleReleasePhoneNumber(phone.sid)}>
								Release
							</Button>
							</ListItem>
						))}
						</List>
					</Box>
					<Box mt={5}>
						<Typography variant="h6">Subaccount</Typography>
						<List>
							<ListItem>
								<ListItemText primary={`Friendly Name: ${selectedSubaccount.friendly_name}`} />
							</ListItem>
							<ListItem>
								<ListItemText primary={`Account SID: ${selectedSubaccount.sid}`} />
							</ListItem>
							<ListItem>
								<ListItemText primary={`Subaccount SID: ${selectedSubaccount.sid}`} />
							</ListItem>
							<ListItem>
								<ListItemText primary={`Date Created: ${selectedSubaccount.date_created}`} />
							</ListItem>
							<ListItem>
								<ListItemText primary={`Date Updated: ${selectedSubaccount.date_updated}`} />
							</ListItem>
							<ListItem>
								<ListItemText primary={`Status: ${selectedSubaccount.status}`} />
							</ListItem>
							<ListItem>
								<ListItemText primary={`Parent Account SID: ${selectedSubaccount.owner_account_sid}`} />
							</ListItem>
						</List> 
					</Box>
					<Switch
						checked={closeSubaccount}
						onChange={() => setCloseSubaccount(!closeSubaccount)} // Toggle state
						color="primary"
					/>
					{closeSubaccount ? (
						<Typography variant="body1" mt={3}>Close subaccount completely</Typography>
					) : (
						<Typography variant="body1" mt={3}>Release all phone numbers</Typography>
					)}
					<Box mt={5}>
						<Button variant="outlined" color="secondary" onClick={() => handleDeleteSubaccount()}>
							Close subaccount
						</Button>
					</Box>
				</Box>
				) : (
					<Typography variant="body1" mt={3}>Please select a subaccount to view details.</Typography>
				)}
		</Box>
	);
}

export default SubaccountManagement;

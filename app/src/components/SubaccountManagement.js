import React, { useState, useEffect, useRef } from 'react';
import { 
Typography, Button, Box, List, ListItem, 
ListItemText, CircularProgress, Paper, Dialog, 
DialogTitle, DialogContent, DialogActions, Tab, Tabs,
Divider, Alert,
ListItemButton, Chip, Pagination
} from '@mui/material';
import axios from 'axios';
import ConversationsList from './ConversationsList';

function SubaccountManagement() {
const [subaccounts, setSubaccounts] = useState([]);
const [badges, setBadges] = useState({}); // Store badges separately by SID
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
const [filterMissingEmergency, setFilterMissingEmergency] = useState(false);
const [deleteMode, setDeleteMode] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(10);
const isFetchingRef = useRef(new Set());
const abortControllerRef = useRef(null);

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

// Fetch badge data with slow loading (throttled)
const fetchBadgesForPage = async (pageSubaccounts, shouldAbort = () => false) => {
	for (const subaccount of pageSubaccounts) {
		// Check if we should abort (e.g., page changed)
		if (shouldAbort()) {
			break;
		}
		
		// Skip if already loaded or currently being fetched
		if (badges[subaccount.sid] || isFetchingRef.current.has(subaccount.sid)) {
			continue;
		}
		
		// Mark as currently fetching
		isFetchingRef.current.add(subaccount.sid);
		
		try {
			const badgeResponse = await axios.get(`http://localhost:5000/subaccounts/${subaccount.sid}/badges`);
			// Store badge data separately
			setBadges(prev => ({
				...prev,
				[subaccount.sid]: badgeResponse.data
			}));
		} catch (err) {
			console.error(`Error fetching badges for ${subaccount.sid}:`, err);
		} finally {
			// Remove from fetching set
			isFetchingRef.current.delete(subaccount.sid);
		}
		
		// Add delay between requests (300ms) to slow down loading
		await new Promise(resolve => setTimeout(resolve, 300));
	}
};

// Fetch remaining badges after current page is loaded
const fetchRemainingBadges = async (currentPageSubaccounts, shouldAbort = () => false) => {
	// First, load current page
	await fetchBadgesForPage(currentPageSubaccounts, shouldAbort);
	
	// If not aborted, continue with remaining subaccounts
	if (!shouldAbort()) {
		const allSubaccounts = getSubaccountsWithBadges();
		const currentPageSids = new Set(currentPageSubaccounts.map(sa => sa.sid));
		const remainingSubaccounts = allSubaccounts.filter(sa => !currentPageSids.has(sa.sid));
		
		await fetchBadgesForPage(remainingSubaccounts, shouldAbort);
	}
};

// Merge subaccounts with their badges
const getSubaccountsWithBadges = () => {
	return subaccounts.map(sa => ({
		...sa,
		...(badges[sa.sid] || {})
	}));
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
		// console.log('Subaccount details:', response.data);
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

// Filter and sort subaccounts based on emergency filter
const getFilteredAndSortedSubaccounts = () => {
	// Merge subaccounts with badges first
	let filtered = getSubaccountsWithBadges();
	
	// Apply emergency filter if active
	if (filterMissingEmergency) {
		filtered = filtered.filter(sa => sa.allEmergenciesRegistered === false);
	}
	
	// Sort: show missing emergency first for visibility
	filtered.sort((a, b) => {
		// Handle null values (still loading)
		if (a.allEmergenciesRegistered === null) return 1;
		if (b.allEmergenciesRegistered === null) return -1;
		
		// Sort by emergency status (false/missing first)
		if (a.allEmergenciesRegistered === b.allEmergenciesRegistered) return 0;
		return a.allEmergenciesRegistered ? 1 : -1;
	});
	
	return filtered;
};

// Paginate the filtered/sorted results
const getPaginatedSubaccounts = () => {
	const filtered = getFilteredAndSortedSubaccounts();
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	return filtered.slice(startIndex, endIndex);
};

// Handle page change and fetch badges for new page
const handlePageChange = (event, value) => {
	setCurrentPage(value);
	// Cancel any ongoing badge fetching
	if (abortControllerRef.current) {
		abortControllerRef.current.abort = true;
	}
};

// Fetch badges when page changes or filter changes
useEffect(() => {
	if (subaccounts.length > 0) {
		// Create abort controller for this page
		const abortController = { abort: false };
		abortControllerRef.current = abortController;
		
		const pageSubaccounts = getPaginatedSubaccounts();
		if (pageSubaccounts.length > 0) {
			fetchRemainingBadges(pageSubaccounts, () => abortController.abort);
		}
	}
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentPage, filterMissingEmergency]);

// Initial fetch of badges when subaccounts first load
useEffect(() => {
	if (subaccounts.length > 0 && Object.keys(badges).length === 0) {
		const abortController = { abort: false };
		abortControllerRef.current = abortController;
		
		const pageSubaccounts = getPaginatedSubaccounts();
		if (pageSubaccounts.length > 0) {
			fetchRemainingBadges(pageSubaccounts, () => abortController.abort);
		}
	}
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [subaccounts.length]);

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

	<Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', mb: 2 }}>
		<Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5' }}>
			<Typography variant="h6" sx={{ fontWeight: 500 }}>Subaccounts</Typography>
			<Box sx={{ display: 'flex', gap: 3, mr: 10, alignItems: 'center' }}>
				<Box 
					onClick={() => {
						setFilterMissingEmergency(!filterMissingEmergency);
						setCurrentPage(1); // Reset to first page when filter changes
					}}
					sx={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: 0.5,
						cursor: 'pointer',
						userSelect: 'none',
						'&:hover': {
							opacity: 0.7
						}
					}}
				>
					<Typography 
						variant="caption" 
						sx={{ 
							minWidth: 70, 
							textAlign: 'center', 
							color: filterMissingEmergency ? '#f44336' : 'text.secondary', 
							fontWeight: filterMissingEmergency ? 600 : 500,
							transition: 'all 0.2s'
						}}
					>
						Emergency
					</Typography>
					{filterMissingEmergency && (
						<Chip 
							label="Missing Only" 
							size="small"
							color="error"
							sx={{ 
								height: 20,
								fontSize: '0.65rem',
								fontWeight: 600
							}}
						/>
					)}
				</Box>
				<Typography variant="caption" sx={{ minWidth: 70, textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
					Auth
				</Typography>
				<Box 
					onClick={() => setDeleteMode(!deleteMode)}
					sx={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: 0.5,
						cursor: 'pointer',
						userSelect: 'none',
						'&:hover': {
							opacity: 0.7
						}
					}}
				>
					<Typography 
						variant="caption" 
						sx={{ 
							minWidth: 50, 
							textAlign: 'center', 
							color: deleteMode ? '#f44336' : 'text.secondary', 
							fontWeight: deleteMode ? 600 : 500,
							transition: 'all 0.2s'
						}}
					>
						Delete
					</Typography>
					{deleteMode && (
						<Chip 
							label="Mode" 
							size="small"
							color="error"
							sx={{ 
								height: 20,
								fontSize: '0.65rem',
								fontWeight: 600
							}}
						/>
					)}
				</Box>
				<Chip 
					label={getFilteredAndSortedSubaccounts().length}
					size="small"
					sx={{ 
						backgroundColor: '#e3f2fd',
						color: '#1976d2',
						fontWeight: 600,
						minWidth: 36,
						height: 24,
						fontSize: '0.75rem'
					}}
				/>
			</Box>
		</Box>
		{loading ? (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
			<CircularProgress />
		</Box>
		) : (
		<>
		<List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
			{getPaginatedSubaccounts().map((subaccount, index) => (
			<React.Fragment key={subaccount.sid}>
				<ListItemButton 
					onClick={() => handleSubaccountSelect(subaccount)}
					sx={{ 
						py: 2, 
						px: 2.5,
						'&:hover': { 
							backgroundColor: '#f8f9fa' 
						},
						transition: 'background-color 0.2s'
					}}
				>
				<ListItemText
					primary={subaccount.id}
					secondary={subaccount.sid}
					primaryTypographyProps={{ 
						fontWeight: 500,
						fontSize: '0.95rem'
					}}
					secondaryTypographyProps={{
						fontFamily: 'monospace',
						fontSize: '0.7rem',
						color: 'text.secondary'
					}}
				/>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Chip 
						label={subaccount.allEmergenciesRegistered === null ? '•••' : 'E'}
						size="small"
						sx={{ 
							backgroundColor: subaccount.allEmergenciesRegistered === null 
								? '#e0e0e0' 
								: subaccount.allEmergenciesRegistered ? '#4caf50' : '#f44336',
							color: 'white',
							fontWeight: 600,
							minWidth: 36,
							height: 28,
							borderRadius: 2,
							fontSize: '0.75rem'
						}}
					/>
					<Chip 
						label={subaccount.basicAuthMedia === null ? '•••' : 'A'}
						size="small"
						sx={{ 
							mr: deleteMode ? 1 : 0,
							backgroundColor: subaccount.basicAuthMedia === null 
								? '#e0e0e0' 
								: subaccount.basicAuthMedia ? '#4caf50' : '#f44336',
							color: 'white',
							fontWeight: 600,
							minWidth: 36,
							height: 28,
							borderRadius: 2,
							fontSize: '0.75rem'
						}}
					/>
					{deleteMode && (
						<Button 
							variant="outlined" 
							color="error" 
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								handleDeleteSubaccount(subaccount);
							}}
							sx={{ 
								borderRadius: 2,
								textTransform: 'none',
								fontWeight: 500,
								px: 2
							}}
						>
							Delete
						</Button>
					)}
				</Box>
				</ListItemButton>
				{index < getPaginatedSubaccounts().length - 1 && <Divider sx={{ mx: 2.5 }} />}
			</React.Fragment>
			))}
		</List>
		<Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f5f5f5' }}>
			<Pagination 
				count={Math.ceil(getFilteredAndSortedSubaccounts().length / itemsPerPage)} 
				page={currentPage} 
				onChange={handlePageChange}
				color="primary"
				size="small"
			/>
		</Box>
		</>
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
					<Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
					<Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5' }}>
						<Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1rem' }}>Phone Numbers</Typography>
						<Typography variant="caption" sx={{ mr: 16, color: 'text.secondary', fontWeight: 500 }}>
							Emergency
						</Typography>
					</Box>
					{loadingPhoneNumbers ? (
						<Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
						<CircularProgress />
						</Box>
					) : (
						<List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
						{phoneNumbers.length === 0 ? (
							<ListItem sx={{ py: 3 }}>
							<ListItemText 
								primary="No phone numbers found for this subaccount."
								primaryTypographyProps={{ 
									color: 'text.secondary',
									textAlign: 'center'
								}}
							/>
							</ListItem>
						) : (
							phoneNumbers.map((number, index) => (
							<React.Fragment key={number.sid}>
								<ListItem
									sx={{ 
										py: 2, 
										px: 2.5,
										'&:hover': { 
											backgroundColor: '#f8f9fa' 
										},
										transition: 'background-color 0.2s'
									}}
								>
								<ListItemText 
									primary={number.phone_number}
									primaryTypographyProps={{ 
										fontWeight: 500,
										fontSize: '0.95rem',
										fontFamily: 'monospace'
									}}
								/>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Chip 
										label="E" 
										size="small"
										sx={{ 
											backgroundColor: number.emergency_address_sid ? '#4caf50' : '#f44336',
											color: 'white',
											fontWeight: 600,
											minWidth: 36,
											height: 28,
											borderRadius: 2,
											fontSize: '0.75rem'
										}}
									/>
									<Button 
										variant="outlined" 
										color="primary"
										size="small"
										onClick={() => handleShowConversations(number)}
										sx={{ 
											borderRadius: 2,
											textTransform: 'none',
											fontWeight: 500,
											px: 2
										}}
									>
										Conversations
									</Button>
									<Button 
										variant="outlined" 
										color="error"
										size="small"
										onClick={() => handleReleasePhoneNumber(number.sid)}
										sx={{ 
											borderRadius: 2,
											textTransform: 'none',
											fontWeight: 500,
											px: 2
										}}
									>
										Release
									</Button>
								</Box>
								</ListItem>
								{index < phoneNumbers.length - 1 && <Divider sx={{ mx: 2.5 }} />}
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

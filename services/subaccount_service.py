from twilio.rest import Client
import os
from services.phone_number_service import PhoneNumberService

class SubaccountService:
	def __init__(self):
		self.client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

	def list_subaccounts(self, include_badges=False):
		"""
		List all subaccounts.
		
		Args:
			include_badges: If True, fetches emergency address and basic auth status for each account.
						   This is slower but provides complete information.
						   If False (default), only returns basic subaccount info for faster loading.
		"""
		subaccounts = self.client.api.accounts.list()
		result = []
		
		for sa in subaccounts:
			subaccount_data = {
				"sid": sa.sid,
				"id": sa.friendly_name,
			}
			
			# Only fetch badge data if explicitly requested
			if include_badges:
				subaccount_data["allEmergenciesRegistered"] = self.check_all_emergencies_registered(sa.sid, sa.auth_token)
				subaccount_data["basicAuthMedia"] = self.check_basic_auth_media(sa.sid)
			else:
				# Return null/undefined so frontend knows these haven't been loaded yet
				subaccount_data["allEmergenciesRegistered"] = None
				subaccount_data["basicAuthMedia"] = None
			
			result.append(subaccount_data)
		
		return result

	def get_subaccount_info(self, subaccount_sid):
		res = self.client.api.accounts(subaccount_sid).fetch()
		
		# Check if all phone numbers have emergency addresses registered
		all_emergencies_registered = self.check_all_emergencies_registered(subaccount_sid, res.auth_token)
		
		# Check if HTTP Basic Authentication for media is enabled
		# Pass the already fetched account to avoid duplicate API calls
		basic_auth_media = self.check_basic_auth_media(subaccount_sid, res)
		
		# Return a dictionary with the account info and badge fields
		return {
			'account_instance': res,
			'allEmergenciesRegistered': all_emergencies_registered,
			'basicAuthMedia': basic_auth_media
		}
	
	def get_phone_number_info(self, subaccount_sid, phone_number_sid):
		# Initialize the PhoneNumberService with the subaccount SID and auth token
		subaccount_info = self.get_subaccount_info(subaccount_sid)
		subaccount = subaccount_info['account_instance']
		phone_number_service = PhoneNumberService(subaccount.sid, subaccount_auth_token=subaccount.auth_token)
		phone_number = phone_number_service.get_phone_number_info(phone_number_sid)

		# Return a dictionary with relevant info
		return {
			'sid': phone_number.sid,
			'phone_number': phone_number.phone_number,
			'friendly_name': phone_number.friendly_name,
			'date_created': phone_number.date_created,
			'status': phone_number.status,
			'emergency_address_sid': phone_number.emergency_address_sid,
		}

	def get_phone_numbers(self, subaccount_sid, subaccount_auth_token=None): 
		# Initialize the PhoneNumberService with the subaccount SID and auth token
		if subaccount_auth_token is None:
			subaccount_info = self.get_subaccount_info(subaccount_sid)
			subaccount = subaccount_info['account_instance']
			subaccount_auth_token = subaccount.auth_token
		
		phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token=subaccount_auth_token)
		phone_numbers = phone_number_service.list_phone_numbers()
		phone_numbers_data = []
		for phone_number in phone_numbers:
			raw_data = phone_number_service.get_phone_number_info(phone_number['sid'])
			phone_numbers_data.append({
			'sid': raw_data.sid,
			'phone_number': raw_data.phone_number,
			'friendly_name': raw_data.friendly_name,
			'date_created': raw_data.date_created,
			'status': raw_data.status,
			'emergency_address_sid': raw_data.emergency_address_sid,
			'emergency_address_status': getattr(raw_data, 'emergency_address_status', None),
		})

		return phone_numbers_data
	
	def check_all_emergencies_registered(self, subaccount_sid, subaccount_auth_token=None):
		"""
		Check emergency address registration status for all phone numbers in the subaccount.
		Returns:
			- "registered": All phone numbers have emergency addresses with status "registered"
			- "pending": At least one emergency address is pending verification
			- "failed": At least one phone number has no emergency address or registration failed
			- "none": No phone numbers in the subaccount (vacuous truth, treated as registered)
		"""
		try:
			# Get phone numbers with their emergency address status
			phone_numbers_data = self.get_phone_numbers(subaccount_sid, subaccount_auth_token)
			
			# If there are no phone numbers, return "none"
			if not phone_numbers_data:
				return "none"
			
			has_pending = False
			has_failed = False
			
			for pn in phone_numbers_data:
				emergency_address_sid = pn.get('emergency_address_sid')
				emergency_address_status = pn.get('emergency_address_status')
				
				# If no emergency address at all, it's failed
				if not emergency_address_sid:
					has_failed = True
					continue
				
				# Check the emergency_address_status field from the phone number
				if emergency_address_status == 'registered':
					# This is good, continue checking others
					continue
				elif emergency_address_status in ['pending-verification', 'pending', 'in-review']:
					has_pending = True
				else:
					# Any other status (failed, rejected, etc.) or None is treated as failed
					has_failed = True
			
			# Return status based on priority: failed > pending > registered
			if has_failed:
				return "failed"
			elif has_pending:
				return "pending"
			else:
				return "registered"
				
		except Exception as e:
			print(f"Error checking emergency addresses for subaccount {subaccount_sid}: {e}")
			return "failed"
	
	def check_basic_auth_media(self, subaccount_sid, subaccount=None):
		"""
		Check if HTTP Basic Authentication for media access is enabled for the subaccount.
		Returns True if enabled, False otherwise.
		
		This checks the Voice -> Settings -> General -> HTTP Basic Authentication for media access setting.
		It works by checking if there are any SIP credential lists associated with the account.
		If credential lists exist, basic auth is enabled.
		"""
		try:
			# Check if the account has any SIP credential lists
			# This indicates that authentication is required for media access
			credential_lists = self.client.api.accounts(subaccount_sid).sip.credential_lists.list(limit=1)
			
			# If there are credential lists, basic auth is enabled
			has_credential_lists = len(credential_lists) > 0
			
			return has_credential_lists
		except Exception as e:
			print(f"Error checking basic auth media for subaccount {subaccount_sid}: {e}")
			return False
	
	def create_subaccount(self, friendly_name):
		return self.client.api.accounts.create(friendly_name=friendly_name)

	def update_subaccount(self, subaccount_sid, friendly_name):
		subaccount = self.client.api.accounts(subaccount_sid).fetch()
		return subaccount.update(friendly_name=friendly_name)
	
	def release_phone_number(self, subaccount_sid, phone_number_sid): 
		# Initialize the PhoneNumberService with the subaccount SID and auth token
		subaccount_info = self.get_subaccount_info(subaccount_sid)
		subaccount = subaccount_info['account_instance']
		phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token=subaccount.auth_token)
		# Release the specified phone number
		return phone_number_service.release_phone_number(phone_number_sid)
	
	def remove_emergency_address(self, subaccount_sid, phone_number):
		subaccount_info = self.get_subaccount_info(subaccount_sid)
		subaccount = subaccount_info['account_instance']
		phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token=subaccount.auth_token)
		phone_number_sid = self.get_phone_number_info(subaccount_sid, phone_number)['sid']
		message = phone_number_service.remove_emergency_address(phone_number_sid)
		return message

	def close_subaccount(self, subaccount_sid, closed):
		# Fetch the subaccount
		subaccount_info = self.get_subaccount_info(subaccount_sid)
		subaccount = subaccount_info['account_instance']
		
		# Initialize the PhoneNumberService with the subaccount SID
		phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token=subaccount.auth_token)
		
		# Release all phone numbers associated with the subaccount
		phone_number_service.release_all_phone_numbers()

		# Close the subaccount by updating its status
		if closed:
			updated_subaccount = subaccount.update(status='closed')
			return updated_subaccount
		else:
			return subaccount

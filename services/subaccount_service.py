from twilio.rest import Client
import os
from services.phone_number_service import PhoneNumberService

class SubaccountService:
	def __init__(self):
		self.client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

	def list_subaccounts(self):
		return [{"sid":sa.sid, "id": sa.friendly_name} for sa in self.client.api.accounts.list()]

	def get_subaccount_info(self, subaccount_sid):
		res = self.client.api.accounts(subaccount_sid).fetch()
		return res
	
	def get_phone_number_info(self, subaccount_sid, phone_number_sid):
		# Initialize the PhoneNumberService with the subaccount SID and auth token
		subaccount = self.get_subaccount_info(subaccount_sid)
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

	def get_phone_numbers(self, subaccount_sid): 
		# Initialize the PhoneNumberService with the subaccount SID and auth token
		subaccount = self.get_subaccount_info(subaccount_sid)
		phone_number_service = PhoneNumberService(subaccount.sid, subaccount_auth_token=subaccount.auth_token)
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
		})

		return phone_numbers_data
	
	def create_subaccount(self, friendly_name):
		return self.client.api.accounts.create(friendly_name=friendly_name)

	def update_subaccount(self, subaccount_sid, friendly_name):
		subaccount = self.client.api.accounts(subaccount_sid).fetch()
		return subaccount.update(friendly_name=friendly_name)
	
	def release_phone_number(self, subaccount_sid, phone_number_sid): 
		# Initialize the PhoneNumberService with the subaccount SID and auth token
		subaccount = self.get_subaccount_info(subaccount_sid)
		print('here 1')
		phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token=subaccount.auth_token)
		print('here 2')
		# Release the specified phone number
		return phone_number_service.release_phone_number(phone_number_sid)
	
	def remove_emergency_address(self, subaccount_sid, phone_number):
		subaccount = self.get_subaccount_info(subaccount_sid)
		phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token=subaccount.auth_token)
		phone_number_sid = self.get_phone_number_info(subaccount_sid, phone_number)['sid']
		message = phone_number_service.remove_emergency_address(phone_number_sid)
		return message

	def close_subaccount(self, subaccount_sid, closed):
		# Fetch the subaccount
		subaccount = self.get_subaccount_info(subaccount_sid)
		
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

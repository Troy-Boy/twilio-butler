from twilio.rest import Client
import os

class PhoneNumberService:
	def __init__(self, subaccount_sid=None, subaccount_auth_token=None):
		if not subaccount_sid and not subaccount_auth_token:
			self.client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
		else:
			self.client = Client(subaccount_sid, subaccount_auth_token)
	
	def list_phone_numbers(self):
		# List all phone numbers associated with the subaccount
		phone_numbers = self.client.incoming_phone_numbers.list()
		
		return [{'sid': pn.sid, 'phone_number': pn.phone_number} for pn in phone_numbers]

	def get_phone_number_info(self, phone_number_sid):
		phone_number = self.client.incoming_phone_numbers(phone_number_sid).fetch()
		return phone_number

	def release_all_phone_numbers(self):
		# List all phone numbers associated with the subaccount
		phone_numbers = self.list_phone_numbers()

		for number in phone_numbers:
			# Release each phone number
			self.release_phone_number(number['sid'])
			   
	def buy_phone_number(self, subaccount_sid, phone_number):
		subaccount_client = Client(subaccount_sid, os.getenv('TWILIO_AUTH_TOKEN'))
		return subaccount_client.incoming_phone_numbers.create(phone_number=phone_number)

	def release_phone_number(self, phone_number_sid):
	   # Release the phone number (delete it)
		phone_number = self.client.incoming_phone_numbers(phone_number_sid).fetch()
		# First, remove the emergency address before releasing the number
		self.remove_emergency_address(phone_number_sid)
		phone_number.delete()
		return f'Phone number {phone_number_sid} released successfully.'

	def remove_emergency_address(self, phone_number_sid):
		# Fetch the phone number and update it to remove the emergency address
		phone_number = self.client.incoming_phone_numbers(phone_number_sid).fetch()
		phone_number.update(emergency_address_sid="")  # Unset emergency address
		return f'Emergency address removed for {phone_number_sid}'
	
	def search_available_phone_numbers(self, country='US', area_code=None):
		# Search for available phone numbers in the specified country and area code (if provided)
		available_numbers = self.client.available_phone_numbers(country).local.list(area_code=area_code, limit=5)

		# Return a list of available phone numbers
		return [{'phone_number': number.phone_number, 'friendly_name': number.friendly_name} for number in available_numbers]

	def buy_phone_number(self, phone_number):
		# Purchase the phone number for the subaccount
		purchased_number = self.client.incoming_phone_numbers.create(phone_number=phone_number)
		
		return {
			'sid': purchased_number.sid,
			'phone_number': purchased_number.phone_number,
			'friendly_name': purchased_number.friendly_name,
			'date_created': purchased_number.date_created
		}
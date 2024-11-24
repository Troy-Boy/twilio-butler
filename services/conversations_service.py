from twilio.rest import Client
import os

class ConversationsService:
	def __init__(self, subaccount_sid=None, subaccount_auth_token=None):
		if not subaccount_sid and not subaccount_auth_token:
			self.client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
		else:
			self.client = Client(subaccount_sid, subaccount_auth_token)
	
	def delete_message(self, conversation_sid, message_sid):
		try:
			# Delete the message from the conversation
			self.client.conversations \
				.conversations(conversation_sid) \
				.messages(message_sid) \
				.delete()
			print(f"Message {message_sid} deleted successfully from conversation {conversation_sid}.")
		except Exception as e:
			print(f"Error deleting message: {str(e)}")
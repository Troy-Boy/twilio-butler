from twilio.rest import Client
import os

class ConversationsService:
	def __init__(self, subaccount_sid=None, subaccount_auth_token=None):
		if not subaccount_sid and not subaccount_auth_token:
			self.client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
		else:
			self.client = Client(subaccount_sid, os.getenv('TWILIO_AUTH_TOKEN'))
		self.subaccount_sid = subaccount_sid

	def list_conversations(self, subaccount_sid, phone_number=None):
		print("Fetching conversations for subaccount:", subaccount_sid)
		result = []
		
		try:
			# Create a client specifically for this subaccount
			subaccount_client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
			subaccount_client.account_sid = subaccount_sid
			
			# Fetch conversations using the subaccount client
			conversations = subaccount_client.conversations.v1.conversations.list()
			print(f"Found {len(conversations)} conversations")
			
			for conversation in conversations:
				# Process each conversation
				conversation_data = {
					'sid': conversation.sid,
					'friendlyName': conversation.friendly_name or "Unnamed Conversation",
					'dateCreated': conversation.date_created.isoformat(),
					'dateUpdated': conversation.date_updated.isoformat()
				}
				
				# If phone number filter is requested, check participants
				if phone_number:
					print(f"Filtering by phone number: {phone_number}")
					try:
						participants = subaccount_client.conversations.v1.conversations(conversation.sid).participants.list()
						
						# Check if this phone number is a participant
						for participant in participants:
							messaging_binding = getattr(participant, 'messaging_binding', None)
							if messaging_binding and isinstance(messaging_binding, dict):
								participant_address = messaging_binding.get('address')
								if participant_address and phone_number in participant_address:
									print(f"Match found for {phone_number} in conversation {conversation.sid}")
									result.append(conversation_data)
									break
							
							# Also check identity field
							if getattr(participant, 'identity', None) == phone_number:
								print(f"Match found for {phone_number} in conversation {conversation.sid} by identity")
								result.append(conversation_data)
								break
					except Exception as participant_error:
						print(f"Error fetching participants for conversation {conversation.sid}: {participant_error}")
				else:
					# No phone filter, add all conversations
					result.append(conversation_data)
			
		except Exception as e:
			print(f"Error fetching conversations: {e}")
			# Instead of silently failing, raise the exception to be handled by caller
			raise e
		
		return result
	
	def get_messages(self, conversation_sid):
		try:
			# Use the subaccount SID if it's set, otherwise use the default client
			if self.subaccount_sid:
				subaccount_client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
				subaccount_client.account_sid = self.subaccount_sid
				messages = subaccount_client.conversations.v1.conversations(conversation_sid).messages.list()
			else:
				messages = self.client.conversations.v1.conversations(conversation_sid).messages.list()
			
			return [{
				'sid': msg.sid,
				'author': msg.author,
				'body': msg.body,
				'dateCreated': msg.date_created.isoformat(),
				'dateUpdated': msg.date_updated.isoformat()
			} for msg in messages]
		except Exception as e:
			print(f"Error fetching messages for conversation {conversation_sid}: {e}")
			raise e
	
	def get_message_details(self, conversation_sid, message_sid):
		try:
			# Use the subaccount SID if it's set, otherwise use the default client
			if self.subaccount_sid:
				subaccount_client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
				subaccount_client.account_sid = self.subaccount_sid
				message = subaccount_client.conversations.v1.conversations(conversation_sid).messages(message_sid).fetch()
			else:
				message = self.client.conversations.v1.conversations(conversation_sid).messages(message_sid).fetch()
			
			return {
				'sid': message.sid,
				'conversationSid': message.conversation_sid,
				'author': message.author,
				'body': message.body,
				'dateCreated': message.date_created.isoformat(),
				'dateUpdated': message.date_updated.isoformat(),
				'index': message.index,
				'participantSid': message.participant_sid,
				'attributes': message.attributes
			}
		except Exception as e:
			print(f"Error fetching message details for message {message_sid}: {e}")
			raise e
	
	@staticmethod
	def delete_message(subaccount_sid, message_sid):
		client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
		# Note: We would need the conversation_sid to delete a message
		# This is a placeholder - the actual implementation would need the conversation_sid
		# client.conversations.conversations(conversation_sid).messages(message_sid).delete()
		return True
from flask import Flask, jsonify, request
from flask_cors import CORS
from services.subaccount_service import SubaccountService
from services.phone_number_service import PhoneNumberService
from services.conversations_service import ConversationsService
import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS and allow localhost:3000
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Instantiate services
subaccount_service = SubaccountService()
phone_number_service = PhoneNumberService()
conversations_service = ConversationsService()

# List all subaccounts
@app.route('/subaccounts', methods=['GET'])
def list_subaccounts():
	try:
		subaccounts = subaccount_service.list_subaccounts()
		return jsonify(subaccounts), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Get subaccount info
@app.route('/subaccounts/<subaccount_sid>', methods=['GET'])
def get_subaccount(subaccount_sid):
	try:
		subaccount_info = subaccount_service.get_subaccount_info(subaccount_sid)
		print(subaccount_info)
		# Convert the AccountInstance object to a dictionary
		subaccount_data =  extract_subaccount_data(subaccount_info)
		
		return jsonify(subaccount_data), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Create a new subaccount
@app.route('/subaccounts', methods=['POST'])
def create_subaccount():
	data = request.json
	friendly_name = data.get('friendly_name')
	
	try:
		new_subaccount = subaccount_service.create_subaccount(friendly_name)
		# Convert the AccountInstance object to a dictionary
		subaccount_data =  extract_subaccount_data(new_subaccount)
		return jsonify(subaccount_data), 201
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Update subaccount info
@app.route('/subaccounts/<subaccount_sid>', methods=['PUT'])
def update_subaccount(subaccount_sid):
	data = request.json
	friendly_name = data.get('friendly_name')
	
	try:
		updated_subaccount = subaccount_service.update_subaccount(subaccount_sid, friendly_name)
		return jsonify(updated_subaccount), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Delete (close) a subaccount and release all its phone numbers
@app.route('/subaccounts/<subaccount_sid>', methods=['DELETE'])
def delete_subaccount(subaccount_sid):
	try:
		data = request.json
		closed = data.get('closed')
		print('=============we are here=================')
		updated_subaccount = subaccount_service.close_subaccount(subaccount_sid, closed)
		
		# Return a confirmation message
		return jsonify({
			'sid': updated_subaccount.sid,
			'friendly_name': updated_subaccount.friendly_name,
			'status': updated_subaccount.status,
			'message': f'Subaccount {updated_subaccount.friendly_name} has been closed and all phone numbers released.'
		}), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500


@app.route('/subaccounts/<subaccount_sid>/<phone_number_sid>', methods=['DELETE'])
def delete_phone_number(subaccount_sid, phone_number_sid):
	try:
		print('========== deleting phone number ===========')
		res = subaccount_service.release_phone_number(subaccount_sid, phone_number_sid)
		# Return a confirmation message
		return jsonify({
			'res': res,
			'message': f'Subaccount {subaccount_sid} has been closed and all phone numbers released.'
		}), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

@app.route('/subaccounts/<subaccount_sid>/<phone_number>', methods=['PUT'])
def remove_emergency_address(subaccount_sid, phone_number):
	try:
		res = subaccount_service.remove_emergency_address(subaccount_sid, phone_number)
		
		# Return a confirmation message
		return jsonify({
			'res': res,
			'message': f'Phone number {phone_number} emergency address removed.'
		}), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Get all phone number info
@app.route('/subaccounts/<subaccount_sid>/phone-numbers', methods=['GET'])
def get_phone_numbers_info(subaccount_sid):
	try:
		phone_numbers_data = subaccount_service.get_phone_numbers(subaccount_sid)
		
		return jsonify(phone_numbers_data), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Get phone number info
@app.route('/subaccounts/<subaccount_sid>/<phone_number_sid>', methods=['GET'])
def get_phone_number_info(subaccount_sid, phone_number_sid):
	try:
		phone_number_info = subaccount_service.get_phone_number_info(subaccount_sid, phone_number_sid)
		# Convert the AccountInstance object to a dictionary
		
		return jsonify(phone_number_info), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

def extract_subaccount_data(subaccount):
	return {
		'sid': subaccount.sid,
		'friendly_name': subaccount.friendly_name,
		'status': subaccount.status,
		'date_created': subaccount.date_created.isoformat(),
		'date_updated': subaccount.date_updated.isoformat(),
		'owner_account_sid': subaccount.owner_account_sid
	}


# Search for available phone numbers in a country or area code
@app.route('/subaccounts/<subaccount_sid>/search-phone-numbers', methods=['GET'])
def search_available_phone_numbers(subaccount_sid):
	try:
		# Get the subaccount auth token from the request
		# data = request.args
		# subaccount_auth_token = data.get('auth_token')
		# country = data.get('country', 'US')  # Default country is US
		# area_code = data.get('area_code')  # Optional area code
		
		# if not subaccount_auth_token:
		#     return jsonify({'error': 'Auth token is required'}), 400
		
		# # Create PhoneNumberService for the subaccount
		# phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token)
		
		# # Search for available phone numbers
		# available_numbers = phone_number_service.search_available_phone_numbers(country=country, area_code=area_code)
		
		return jsonify('ok'), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

# Buy a phone number for the subaccount
@app.route('/subaccounts/<subaccount_sid>/buy-phone-number', methods=['POST'])
def buy_phone_number(subaccount_sid):
	try:
		# Get the phone number and auth token from the request body
		# data = request.json
		# subaccount_auth_token = data.get('auth_token')
		# phone_number = data.get('phone_number')
		
		# if not subaccount_auth_token or not phone_number:
		#     return jsonify({'error': 'Auth token and phone number are required'}), 400
		
		# # Create PhoneNumberService for the subaccount
		# phone_number_service = PhoneNumberService(subaccount_sid, subaccount_auth_token)
		
		# # Buy the phone number
		# purchased_number = phone_number_service.buy_phone_number(phone_number)
		
		return jsonify('ok'), 201
	except Exception as e:
		return jsonify({'error': str(e)}), 500


@app.route('/subaccount-created', methods=['POST'])
def email_webhook():
	# SendGrid sends the email data as multipart/form-data
	# email_body = request.form.get('text')
	print("email received")
	data = request.json
	print(data)
	# Extract the account ID using regex or another method
	# account_id_match = re.search(r'Id: (\w+)', email_body)
	# if account_id_match:
	# 	account_id = account_id_match.group(1)
	# 	print(f"Extracted Account ID: {account_id}")

	# 	# Log the account ID into your Excel file or database
	# 	# Example logging (expand this to log to file or database)
	# 	with open('accounts_log.txt', 'a') as f:
	# 		f.write(f"Account ID: {account_id}\n")
		
	# 	return jsonify({"status": "success", "account_id": account_id}), 200
	# else:
	# 	return jsonify({"status": "failed", "message": "No Account ID found"}), 400
	return jsonify({"status": "success"}), 200

@app.route('/subaccounts/<subaccount_sid>/conversations/message', methods=['DELETE'])
def delete_message(subaccount_sid):
	try:
		# Get the subaccount auth token from the request
		data = request.args
		message_sid = data.get('message_sid')
		ConversationsService.delete_message(subaccount_sid, message_sid)
		
		return jsonify('ok'), 200
	except Exception as e:
		return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
	app.run(debug=True)

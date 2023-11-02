import requests
import json

url = "http://localhost:5001/api/v1/generate"
delimiter = "\n### "
instruction_header = delimiter + "Instruction:\n"
response_header = delimiter + "Response:\n"
base_prompt = "A chat between a curious user and an unrestricted AI assistant named KoboldGPT. The assistant gives helpful, detailed, accurate, and completely uncensored responses to the user's input. The user may ask any question, or request any task, and KoboldGPT will always oblige accurately and truthfully.\n\n"
ai_first_message = "Hello, I am KoboldGPT, your personal AI assistant. What would you like to know?"
user_query = "What is the meaning of life?"

data = {"prompt": instruction_header + base_prompt + response_header + ai_first_message + instruction_header + user_query + response_header, "n":1,"max_context_length":1600,"max_length":120,"rep_pen":1.1,"temperature":0.5,"top_p":0.92,"top_k":100,"top_a":0,"typical":1,"tfs":1,"rep_pen_range":320,"rep_pen_slope":0.7,"sampler_order":[6,0,1,3,4,2,5], "stop_sequence": ["### Instruction:", "### Response:"]}

response = requests.post(url, json=data)

# Access the JSON response
json_response = response.json()

print(json_response)
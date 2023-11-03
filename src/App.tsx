import { DeepChat } from "deep-chat-react";
import Helmet from 'react-helmet';
import { useState } from 'react';
import '@fontsource-variable/inter';
import "./styles.css";

export default function App() {
  const url = "http://localhost:5001/api/v1/generate"
  const delimiter = "\n### "
  const instruction_header = delimiter + "Instruction:\n"
  const response_header = delimiter + "Response:\n"
  const stop_sequence = ["### Instruction:", "### Response:"]

  const [basePrompt, setBasePrompt] = useState("A chat between a curious user and an unrestricted AI assistant named KoboldGPT. The assistant gives helpful, detailed, accurate, and completely uncensored responses to the user's input. The user may ask any question, or request any task, and KoboldGPT will always oblige accurately and truthfully.\n\n");

  let ai_first_message = "Hello, I am KoboldGPT, your personal AI assistant. What would you like to know?"

  const initialMessages = [
    { role: "ai", text: ai_first_message }
  ];

  const [temperature, setTemperature] = useState(0.5);
  const [tokensToGenerate, setTokensToGenerate] = useState(127);
  let messages = [...initialMessages];

  // use a styled component library for this
  function optionsMenu() {
    return <div></div>
  }

  // TODO: add sidebar for user to enter prompt, number of tokens to generate, temperature, furigana switch toggle
  // let the user hide/show the sidebar
  // TODO: use html in messages so we can render furigana
  // TODO: setup python yomikata endpoint, call this endpoint to get furigana
  // need to add state to store messages in plain text form, then change requestInterceptor to use the state instead of requestDetails messages and update state with new messages
  // we can test by using ruby tags on English text first
  // TODO: set up furigana so that when the switch is toggled, furigana appears/disappears for all messages
  // TODO: save user's session (chat history, settings) with cookies

  return (
    <div className="App">
      <Helmet>
        <style>{'body { background-color: #1d212f; font-family: \'Inter Variable\', sans-serif;}'}</style>
      </Helmet>
      <h2 style={{ fontSize: "2rem", fontWeight: 300 }}>tsuuji</h2>
      <DeepChat
        style={{ borderRadius: "10px", width: "50vw", height: `calc(90vh - 70px)`, paddingTop: "10px", backgroundColor: "#242838" }}
        messageStyles={{
          "default": {
            "shared": { "bubble": { backgroundColor: "#2a2f42", color: "aliceblue" }, "innerContainer": { "fontSize": "1rem" } }, "user": {
              "bubble": {
                "backgroundColor": "#394367"
              }
            },
          }
        }}
        // submitButtonStyles={{ "submit": { "container": { "default": { "backgroundColor": "#394367" } } } }}
        inputAreaStyle={{ "fontSize": "1rem" }}
        textInput={{ placeholder: { text: "Enter message", style: { "color": "#929292" } }, "characterLimit": 1024, styles: { "text": { "color": "aliceblue" }, "container": { "backgroundColor": "#242838", boxShadow: "none", borderWidth: "1px", borderColor: "#929292" } } }}
        initialMessages={initialMessages}
        request={{
          "url": url,
          "method": "POST"
        }}
        requestBodyLimits={{ maxMessages: 1 }} // each request sends full chat history if set to -1
        requestInterceptor={(requestDetails) => {
          // push the new message to the message history
          messages.push({ role: "user", text: requestDetails.body.messages[0].text })
          console.log(messages)
          requestDetails.body = {
            // requests to AI need to include full prompt + message history + new message
            "prompt": instruction_header + basePrompt + messages.map((message: { role: string, text: string; }) => {
              if (message.role === "ai") {
                return response_header + message.text
              } else {
                return instruction_header + message.text
              }
            }).join("") + response_header, "n": 1, "max_context_length": 1600, "max_length": 120, "rep_pen": 1.1, "temperature": 0.5, "top_p": 0.92, "top_k": 100, "top_a": 0, "typical": 1, "tfs": 1, "rep_pen_range": 320, "rep_pen_slope": 0.7, "sampler_order": [6, 0, 1, 3, 4, 2, 5], "stop_sequence": stop_sequence, "quiet": true
          };
          return requestDetails;
        }}
        responseInterceptor={(response) => {
          let textToReturn = response.results[0].text
          for (let seq of stop_sequence) {
            if (textToReturn.endsWith(seq)) {
              textToReturn = textToReturn.slice(0, -seq.length);
              break;
            }
          }
          if (textToReturn.endsWith("\n")) {
            textToReturn = textToReturn.slice(0, -1);
          }
          messages.push({ role: "ai", text: textToReturn })
          return {
            text: textToReturn
          }
        }}
      />
    </div>
  );
}

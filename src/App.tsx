import { DeepChat } from "deep-chat-react";
import Helmet from 'react-helmet';
import { useState } from 'react';
import '@fontsource-variable/inter';
import "./styles.css";
import { Dialog, DialogTitle, Typography, Switch, DialogContent, Button, DialogActions, Icon } from "@mui/material";
import { Grid, TextField, FormControlLabel } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import { CohereClient } from "cohere-ai";

// let ai_first_message = "あなたは何を手助けして欲しい？"
let ai_furigana_first_message = "あなたは<ruby><rb>何</rb><rt>なに</rt></ruby>を<ruby><rb>手助</rb><rt>てだす</rt></ruby>けして<ruby><rb>欲</rb><rt>ほ</rt></ruby>しい?"
let ai_first_message = "Hello, I am your personal AI assistant. What would you like to know?"
let messages = [{ role: "ai", text: ai_first_message }];
// これは{日本/にっぽん}{語/ご}です。

const url = "https://api.cohere.ai/v1/chat"
const db_url = "https://tsuuji-backend.onrender.com/"
const delimiter = "\n### "
const instruction_header = delimiter + "Instruction:\n"
const response_header = delimiter + "Response:\n"
const stop_sequence = ["### Instruction:", "### Response:"]

const cohere = new CohereClient({
  token: "WDgHb2Zhd1SkcuBniZws7WZ2kfFiFVEdmS6y2xZc", // This is your trial API key
});

export default function App() {
  const [basePrompt, setBasePrompt] = useState(ai_first_message);

  const [temperature, setTemperature] = useState(0.3);
  const [maxResponseLength, setMaxResponseLength] = useState(100);
  const [optionsHidden, setOptionsHidden] = useState(true);

  let optionsError = {
    temperature: false,
    maxResponseLength: false
  }

  // TODO: display the acceptable value ranges next to the inputs
  let optionsInput = {
    prompt: basePrompt,
    temperature: temperature,
    maxResponseLength: maxResponseLength,
  }

  const baseStyle = {
    fontFamily: "\'Inter Variable\', sans-serif",
    color: "aliceblue"
  } as const

  const buttonStyle = {
    fontFamily: "\'Inter Variable\', sans-serif",
    textTransform: 'none', // remove the capitalization
  } as const

  function handleOptionsConfirm() {
    // only let the user confirm the dialog if the values are valid
    if (optionsError.temperature || optionsError.maxResponseLength) {
      return;
    }
    setBasePrompt(optionsInput.prompt);
    setTemperature(optionsInput.temperature);
    setMaxResponseLength(optionsInput.maxResponseLength);
    setOptionsHidden(true);
  }

  function OptionsMenu() {
    return <Dialog
      open={!optionsHidden}
      sx={{
        "& .MuiDialog-container": {
          '& .MuiDialog-paper': {
            fontFamily: "\'Inter Variable\', sans-serif",
            color: 'aliceblue',
            backgroundColor: '#1d212f',
            borderColor: 'aliceblue',
            borderWidth: '1px',
            width: "100%",
            maxWidth: "20vw",
          },
        }
      }}
    >
      <DialogTitle style={baseStyle} align="center">Options</DialogTitle>
      <DialogContent>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Typography variant="body1" sx={{ ...baseStyle, position: 'relative', bottom: '1px' }}>Prompt</Typography>
            <TextField
              fullWidth
              multiline
              rows={7}
              variant="outlined"
              color="secondary"
              defaultValue={basePrompt}
              onChange={(e) => {
                optionsInput = { ...optionsInput, prompt: e.target.value };
              }}
              sx={{
                '& .MuiInputBase-input': baseStyle, '& .MuiInputBase-root': {
                  border: '1px solid aliceblue',
                },
              }}
            />
          </Grid>
          <Grid item>
            <Typography variant="body1" sx={{ ...baseStyle, position: 'relative', bottom: '1px' }}>Temperature</Typography>
            <TextField
              fullWidth
              id="temperature"
              variant="outlined"
              color="secondary"
              defaultValue={temperature}
              error={optionsError.temperature}
              onChange={(e) => {
                optionsInput = { ...optionsInput, temperature: parseFloat(e.target.value) ?? NaN };
                optionsError = { ...optionsError, temperature: isNaN(parseFloat(e.target.value)) || parseFloat(e.target.value) < 0 };
              }}
              sx={{
                '& .MuiInputBase-input': baseStyle, '& .MuiInputBase-root': {
                  border: '1px solid aliceblue',
                }
              }}
            />
          </Grid>
          <Grid item>
            <Typography variant="body1" sx={{ ...baseStyle, position: 'relative', bottom: '1px' }}>Maximum response length</Typography>
            <TextField
              fullWidth
              id="tokens-to-generate"
              variant="outlined"
              color="secondary"
              defaultValue={maxResponseLength}
              error={optionsError.maxResponseLength}
              onChange={(e) => {
                optionsInput = { ...optionsInput, maxResponseLength: parseFloat(e.target.value) ?? NaN };
                optionsError = { ...optionsError, maxResponseLength: isNaN(parseFloat(e.target.value)) || parseFloat(e.target.value) <= 0 };
              }}
              sx={{
                '& .MuiInputBase-input': baseStyle, '& .MuiInputBase-root': {
                  border: '1px solid aliceblue',
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" style={buttonStyle} onClick={handleOptionsConfirm}>Confirm</Button>
        <Button color="secondary" style={buttonStyle} onClick={() => setOptionsHidden(true)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  }

  let userId = "";
  // save user's session (chat history, settings) with cookies
  if (document.cookie.includes("id")) {
    // load the messages if the user has id cookie
    userId = document.cookie.split("id=")[1]
  } else {
    // create a new user
    console.log("create user")
    const userData = fetch(db_url + "create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }).then(async response => {
      const res = await response.text();
      if (res) {
        console.log(res)
        document.cookie = `id=${res}`;
        userId = res
      }
    });
  }
  // console.log(userId)

  return (
    <div className="App">
      <Helmet>
        <style>{'body { background-color: #1d212f; font-family: \'Inter Variable\', sans-serif;}'}</style>
      </Helmet>
      <h2 style={{ fontSize: "2rem", fontWeight: 300 }}>tsuuji</h2>
      <OptionsMenu />
      <DeepChat
        style={{ borderRadius: "10px", width: "50vw", height: `calc(90vh - 70px)`, paddingTop: "10px", backgroundColor: "#242838" }}
        messageStyles={{
          "default": {
            "shared": { "bubble": { backgroundColor: "#2a2f42", color: "aliceblue" }, "innerContainer": { "fontSize": "1.4rem" } }, "user": {
              "bubble": {
                "backgroundColor": "#394367"
              }
            },
          }
        }}
        // submitButtonStyles={{ "submit": { "container": { "default": { "backgroundColor": "#394367" } } } }}
        inputAreaStyle={{ "fontSize": "1.1rem" }}
        textInput={{ placeholder: { text: "Enter message", style: { "color": "#929292" } }, "characterLimit": 1024, styles: { "text": { "color": "aliceblue" }, "container": { "backgroundColor": "#242838", boxShadow: "none", borderWidth: "1px", borderColor: "#929292" } } }}
        initialMessages={[{ role: "ai", text: basePrompt }]}
        // onNewMessage={({ message, isInitial }) => { if (!isInitial) messages.push({ role: message.role, text: message.text! }); }}
        request={{
          "url": url,
          "method": "POST"
        }}
        requestBodyLimits={{ maxMessages: 1 }} // each request sends full chat history if set to -1
        requestInterceptor={(requestDetails) => {
          messages.push({ role: "user", text: requestDetails.body.messages[0].text })
          fetch(db_url + "add-message", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: userId, message: { role: "user", text: requestDetails.body.messages[0].text } }),
          });

          requestDetails.headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer WDgHb2Zhd1SkcuBniZws7WZ2kfFiFVEdmS6y2xZc'
          };

          requestDetails.body = {
            "model": "command-light",
            "message": requestDetails.body.messages[0].text,
            "temperature": temperature,
            "chat_history": messages.map((message: { role: string, text: string; }) => {
              return {
                "role": "ai" ? "Chatbot" : "user",
                "message": message.text
              }
            }).slice(0, -1),
            "prompt_truncation": "AUTO",
            "stream": false,
            "citation_quality": "fast",
            "connectors": [],
            "documents": []
          }
          console.log(requestDetails)
          return requestDetails;
        }}
        responseInterceptor={async (response) => {
          console.log(response)
          let textToReturn = response.text
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
          fetch(db_url + "add-message", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: userId, message: { role: "ai", text: textToReturn } }),
          });

          const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: textToReturn }),
          };
          return {
            text: textToReturn
          }

        }}
      />
      <IconButton
        sx={{ backgroundColor: 'transparent', position: "absolute", top: "10px", left: "10px" }}
        size="large"
        aria-label="settings"
        onClick={() => {
          setOptionsHidden(false);
          optionsInput = { prompt: basePrompt, temperature: temperature, maxResponseLength: maxResponseLength };
        }}
      >
        <SettingsIcon />
      </IconButton>
    </div>
  );
}

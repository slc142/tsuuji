import { DeepChat } from "deep-chat-react";
import Helmet from 'react-helmet';
import { useState } from 'react';
import '@fontsource-variable/inter';
import "./styles.css";
import { Dialog, DialogTitle, Typography, Switch, DialogContent, Button, DialogActions, Icon } from "@mui/material";
import { Grid, TextField, FormControlLabel } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

let ai_first_message = "あなたは何を手助けして欲しい？"
let ai_furigana_first_message = "あなたは<ruby><rb>何</rb><rt>なに</rt></ruby>を<ruby><rb>手助</rb><rt>てだす</rt></ruby>けして<ruby><rb>欲</rb><rt>ほ</rt></ruby>しい?"
// let ai_first_message = "Hello, I am KoboldGPT, your personal AI assistant. What would you like to know?"
let messages = [{ role: "ai", text: ai_first_message }];
let furiganaMessages = [{ role: "ai", html: ai_furigana_first_message }];
// これは{日本/にっぽん}{語/ご}です。

const url = "http://localhost:5001/api/v1/generate"
const yomikata_url = "http://127.0.0.1:5000/all-furigana"
const db_url = "http://127.0.0.1:5000/"
const delimiter = "\n### "
const instruction_header = delimiter + "Instruction:\n"
const response_header = delimiter + "Response:\n"
const stop_sequence = ["### Instruction:", "### Response:"]

export default function App() {
  const [basePrompt, setBasePrompt] = useState("あなたは仕事の手助けをする「助手」です。\n\n");

  const [temperature, setTemperature] = useState(0.5);
  const [maxResponseLength, setMaxResponseLength] = useState(100);
  const [furiganaEnabled, setFuriganaEnabled] = useState(true);
  const [optionsHidden, setOptionsHidden] = useState(false);

  let optionsError = {
    temperature: false,
    maxResponseLength: false
  }

  // TODO: display the acceptable value ranges next to the inputs
  let optionsInput = {
    prompt: basePrompt,
    temperature: temperature,
    maxResponseLength: maxResponseLength,
    furiganaEnabled: furiganaEnabled
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
    setFuriganaEnabled(optionsInput.furiganaEnabled);
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
          <Grid item>
            <FormControlLabel
              control={<Switch color="secondary" defaultChecked={furiganaEnabled} />}
              label="Enable furigana"
              onChange={() => optionsInput = { ...optionsInput, furiganaEnabled: !optionsInput.furiganaEnabled }}
              sx={{
                '& .MuiFormControlLabel-label': baseStyle
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
    // const userData = fetch(db_url + "get-user", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ user: userId }),
    // }).then(async response => {
    //   const res = await response.json();
    //   if (res) {
    //     console.log("load user")
    //     messages = res.messages;
    //     furiganaMessages = res.furiganaMessages;
    //   } else {
    //     // make user with current id
    //     console.log("cookie exists, create user")
    //     const userData = fetch(db_url + "create-user", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({ user: userId }),
    //     }).then(async response => {
    //       const res = await response.text();
    //     });
    //   }
    // });
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
      console.log(res)
      document.cookie = `id=${res}`;
      userId = res
    });
  }
  console.log(userId)

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
            "shared": { "bubble": { backgroundColor: "#2a2f42", color: "aliceblue" }, "innerContainer": { "fontSize": furiganaEnabled ? "1.5rem" : "1.4rem" } }, "user": {
              "bubble": {
                "backgroundColor": "#394367"
              }
            },
          }
        }}
        // submitButtonStyles={{ "submit": { "container": { "default": { "backgroundColor": "#394367" } } } }}
        inputAreaStyle={{ "fontSize": "1.1rem" }}
        textInput={{ placeholder: { text: "Enter message", style: { "color": "#929292" } }, "characterLimit": 1024, styles: { "text": { "color": "aliceblue" }, "container": { "backgroundColor": "#242838", boxShadow: "none", borderWidth: "1px", borderColor: "#929292" } } }}
        initialMessages={furiganaEnabled ? furiganaMessages : messages}
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

          furiganaMessages.push({ role: "user", html: requestDetails.body.messages[0].text })
          fetch(db_url + "add-furigana-message", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: userId, message: { role: "user", html: requestDetails.body.messages[0].text } }),
          });

          requestDetails.body = {
            // requests to AI need to include full prompt + message history + new message
            "prompt": instruction_header + basePrompt + messages.map((message: { role: string, text: string; }) => {
              if (message.role === "ai") {
                return response_header + message.text
              } else {
                return instruction_header + message.text
              }
            }).join("") + response_header, "n": 1, "max_context_length": 1600, "max_length": maxResponseLength, "rep_pen": 1.1, "temperature": temperature, "top_p": 0.92, "top_k": 100, "top_a": 0, "typical": 1, "tfs": 1, "rep_pen_range": 320, "rep_pen_slope": 0.7, "sampler_order": [6, 0, 1, 3, 4, 2, 5], "stop_sequence": stop_sequence, "quiet": true
          };
          return requestDetails;
        }}
        responseInterceptor={async (response) => {
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

          const res = await fetch(yomikata_url, requestOptions)

          const rubyText = await res.text()
          furiganaMessages.push({ role: "ai", html: rubyText })
          fetch(db_url + "add-furigana-message", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: userId, message: { role: "ai", html: rubyText } }),
          });
          if (furiganaEnabled) {
            return {
              html: rubyText
            }
          } else {
            return {
              text: textToReturn
            }
          }
        }}
      />
      <IconButton
        sx={{ backgroundColor: 'transparent', position: "absolute", top: "10px", left: "10px" }}
        size="large"
        aria-label="settings"
        onClick={() => {
          setOptionsHidden(false);
          optionsInput = { prompt: basePrompt, temperature: temperature, maxResponseLength: maxResponseLength, furiganaEnabled: furiganaEnabled };
        }}
      >
        <SettingsIcon />
      </IconButton>
      {/* <IconButton
        sx={{ backgroundColor: 'transparent', position: "absolute", top: "10px", right: "10px" }}
        size="large"
        aria-label="delete"
        onClick={() => {
          fetch(db_url + "clear-messages", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: userId }),
          });
          fetch(db_url + "clear-furigana-messages", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: userId }),
          });
          messages = [{ role: "ai", text: ai_first_message }];
          furiganaMessages = [{ role: "ai", html: ai_furigana_first_message }];
        }}>
        <DeleteIcon />
      </IconButton> */}
    </div>
  );
}

# aivid

## Studio Voices

Studio Voices are the four remote Kokoro voices Aria (`aria`), Nicole (`nicole`), Adam (`adam`), and Fable (`fable`). VoxLab sends their synthesis requests to the deployed API; they are not processed by local neural TTS. Configure the endpoint and server-side keep-alive interval with:

```text
VOXLAB_STUDIO_API_URL=https://voice-kepv.onrender.com
VOXLAB_STUDIO_KEEPALIVE_MINUTES=12
```

Stock voices and voice cloning continue to use their existing paths. Automations can select or change to a Studio Voice from the automation editor.

# Turn the photo into the hero animation (Google Flow)

1. Open Google Flow (labs.google/flow) and sign in with your Google account.
2. Create a new project -> choose **Frames to Video** (or "Ingredients to Video").
3. Upload `flow/start-frame.jpg` as the start frame.
4. Pick a vertical / portrait output if offered, ~8 s, and a Veo model with audio if you want him to speak.
5. Paste this prompt:

   > A friendly young man in a black t-shirt sits on a step, smiles warmly at the camera, raises his right hand
   > and waves hello once, then lowers his hand and settles back into his relaxed pose. He says: "Hello! Welcome
   > to Falcon Fashion." Natural lip sync, subtle head movement, soft blinking. Camera stays locked, no cuts,
   > no zoom, same lighting and background as the photo. Realistic, cinematic, no text or logos.

6. Generate, pick the best take, and download the MP4.
7. Save it as `public/hero.mp4` (replace the file if it already exists) and refresh the shop page.

Tips
- Keep the clip short (6-8 s): it plays once each time the hero scrolls into view.
- If he waves more than once, add "waves exactly once" to the prompt and regenerate.
- Only use photos of people who have agreed to appear in your marketing.

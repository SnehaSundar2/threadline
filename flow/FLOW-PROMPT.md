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

---
## Want an exact Pixar-style likeness? (do this first)
The 3D character on the site is built in code and only resembles the photo. For an exact likeness, generate a
Pixar-style still first, in Gemini or Flow's image tool, using `start-frame.jpg` as the reference:

> Turn this photo into a Pixar-style 3D animated character: the same young man with short black swept-up hair, light
> stubble, warm brown skin, big friendly smile, black t-shirt with grey striped graphic, black watch, thin chain.
> Smooth stylised skin, large expressive eyes, soft studio lighting, clean plain background. Waist-up, facing camera.

Then use that image as the start frame in Flow to animate the wave.

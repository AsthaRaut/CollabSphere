import { askGemini } from "../utils/gemini.js";

// Keeps every Gemini endpoint short: validate -> build prompt -> call Gemini -> respond
const makeHandler = ({ key, success, failure, build }) => async (req, res) => {
  try {
    const { content, type, projectName } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const text = await askGemini(build({ content: content.slice(0, 30000), type, projectName }));
    res.json({ message: success, [key]: text });
  } catch (error) {
    console.error(`Gemini error (${key}):`, error.message);
    res.status(error.status || 500).json({ message: failure, error: error.message });
  }
};

export const explainNote = makeHandler({
  key: "explanation",
  success: "Explained successfully",
  failure: "Gemini could not explain this content",
  build: ({ content, type }) =>
    type === "code"
      ? `You are a friendly senior developer. Explain the following code step by step in simple language.
Start with a one-line summary, then walk through the important parts, then mention any bugs or improvements.
Use Markdown.

\`\`\`
${content}
\`\`\``
      : `Explain the following note in simple, clear language. Start with a short summary, then break down the key ideas. Use Markdown.

${content}`
});

export const improveNote = makeHandler({
  key: "suggestions",
  success: "Suggestions generated successfully",
  failure: "Gemini could not suggest improvements",
  build: ({ content }) =>
    `You are an editor for developer documentation. Review the Markdown note below and suggest concrete improvements
(structure, clarity, missing details, formatting). Give a short bullet list of suggestions first,
then provide an improved version of the note in Markdown under the heading "Improved version".

${content}`
});

export const generateDocs = makeHandler({
  key: "documentation",
  success: "Documentation generated successfully",
  failure: "Documentation generation failed",
  build: ({ content }) =>
    `Generate clear, well structured Markdown documentation for the following code or content.
Include: overview, parameters/inputs, return values/outputs, usage example and edge cases where relevant.

${content}`
});

export const generateReadme = makeHandler({
  key: "readme",
  success: "README generated successfully",
  failure: "README generation failed",
  build: ({ content, projectName }) =>
    `Generate a professional README.md for the following project${projectName ? ` called "${projectName}"` : ""}.
Include: title, short description, features, tech stack, installation, usage and contributing.
Return only the Markdown of the README.

Project information:

${content}`
});

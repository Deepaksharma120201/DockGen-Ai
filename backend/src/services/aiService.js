const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash",
});

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", `You are "DockGen AI," an expert DevSecOps engineer. Your task is to generate a production-ready, multi-stage Dockerfile.
  - Analyze the provided file list and package.json contents.
  - Detect the JavaScript framework: React, Next.js, Vue, or Angular.
  - The generated Dockerfile must be syntactically correct and build a runnable image.

  - FOR NEXT.JS: Handle the standalone output ('output: "standalone"') correctly.

  - FOR REACT/VUE/ANGULAR (Static Builds):
    - Use a multi-stage build with 'nginx:alpine'.
    - Check the file list for an 'nginx.conf' file.
    - If an 'nginx.conf' IS present, copy it to '/etc/nginx/conf.d/default.conf'.
    - If an 'nginx.conf' IS NOT present, you MUST create a default config file using 'RUN echo ...' commands. This config must serve the static build output (e.g., 'dist' or 'build') and handle SPA routing (using 'try_files $uri $uri/ /index.html;').

  - Only output the raw Dockerfile content and nothing else.`
  ],
  ["user", `Here are the relevant files from the repository:

  File: "package.json"
  Content:
  {content_package_json}

  File: "next.config.js" (if present)
  Content:
  {content_next_config}

  Other files: {file_list}

  Please generate the Dockerfile.`
  ]
]);

const chain = promptTemplate.pipe(llm);

exports.generateDockerfile = async (packageJsonContent, otherFiles, nextConfigContent = "N/A") => {
  try {
    const response = await chain.invoke({
      content_package_json: packageJsonContent,
      content_next_config: nextConfigContent,
      file_list: otherFiles.join(", ")
    });

    const dockerfileContent = response.content.replace(/```dockerfile\n|```/g, "").trim();

    if (!dockerfileContent || dockerfileContent.length < 20) {
        throw new Error("AI returned an empty or invalid Dockerfile.");
    }

    return dockerfileContent;
  } catch (error) {
    console.error("Error in generateDockerfile:", error);
    throw new Error(`AI service failed: ${error.message}`);
  }
};

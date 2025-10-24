const githubService = require('../services/githubService');
const aiService = require('../services/aiService');
const dockerService = require('../services/dockerService');
const Build = require('../models/build'); // Make sure this is imported

const runBuildInBackground = async (repoUrl, pat, dockerfileContent, imageName, buildId) => {
  let buildStatus = 'failed';
  let buildLogs = '';
  try {
    console.log(`[Background Build] Building image ${imageName}...`);
    buildLogs = await dockerService.buildImage(repoUrl, pat, dockerfileContent, imageName);

    if (buildLogs.includes('ERROR:') || buildLogs.includes('failed to build')) {
      throw new Error('Docker build failed. Check logs.');
    }
    
    buildStatus = 'success';
    console.log("[Background Build] Build complete!");

  } catch (error) {
    console.error("Error in background build:", error.message);
    buildLogs = buildLogs || error.message; // Use existing logs or the error
  } finally {
    // Update the build in the DB with the final status and logs
    await Build.findByIdAndUpdate(buildId, {
      status: buildStatus,
      buildLogs: buildLogs,
    });
    console.log(`[Background Build] Saved final status (${buildStatus}) to database.`);
  }
};

exports.generateAndBuild = async (req, res) => {
  const { repoUrl, pat } = req.body;

  if (!repoUrl || !pat) {
    return res.status(400).json({ error: 'repoUrl and pat are required' });
  }

  try {
    console.log(`Fetching repo contents for ${repoUrl}...`);
    const { packageJson, fileList, nextConfig } = await githubService.fetchRepoContents(repoUrl, pat);

    console.log("Generating Dockerfile with AI...");
    const dockerfileContent = await aiService.generateDockerfile(packageJson, fileList, nextConfig);
    const imageName = `dockgen-ai/${repoUrl.split('/').pop().toLowerCase()}:${Date.now()}`;

    const newBuild = new Build({
      repoUrl,
      dockerfile: dockerfileContent,
      imageName,
      status: 'pending',
      buildLogs: 'Build is now in queue...',
    });
    await newBuild.save();
    console.log("Pending build saved to database!");

    res.status(202).json({
      message: "Build started. Polling for status...",
      buildId: newBuild._id, // Send the ID back
    });

    runBuildInBackground(repoUrl, pat, dockerfileContent, imageName, newBuild._id);

  } catch (error) {
    // This will only catch errors from the "fast" part (GitHub/AI)
    console.error("Error in controller:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getBuildStatus = async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);

    if (!build) {
      return res.status(404).json({ error: 'Build not found' });
    }

    // Send back the current status and data
    res.status(200).json({
      status: build.status,
      dockerfile: build.dockerfile,
      buildLogs: build.buildLogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

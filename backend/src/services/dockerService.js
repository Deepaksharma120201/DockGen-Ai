const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs/promises');
const path = require('path');

exports.buildImage = async (repoUrl, pat, dockerfileContent, imageName) => {
  const tempDir = path.join('/tmp', `dockgen-build-${Date.now()}`);
  const cloneUrl = repoUrl.replace('https://', `https://${pat}@`);

  try {
    console.log(`[Docker Service] Cloning ${repoUrl} into ${tempDir}...`);
    await exec(`git clone ${cloneUrl}.git ${tempDir}`);

    console.log(`[Docker Service] Writing Dockerfile...`);
    await fs.writeFile(path.join(tempDir, 'Dockerfile'), dockerfileContent);

    console.log(`[Docker Service] Building image: ${imageName}...`);
    const { stdout, stderr } = await exec(`sudo docker build -t ${imageName} .`, { cwd: tempDir });
    return stdout + stderr;

  } catch (error) {
    console.error(`[Docker Service] Build failed:`, error);
    return error.stdout + error.stderr;
  } finally {
    console.log(`[Docker Service] Cleaning up ${tempDir}...`);
    await exec(`rm -rf ${tempDir}`);
  }
};

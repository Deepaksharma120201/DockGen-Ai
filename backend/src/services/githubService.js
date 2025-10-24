const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function parseRepoUrl(url) {
  try {
    const path = new URL(url).pathname;
    const [_, owner, repo] = path.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repo URL');
    }
    // Remove .git if it exists
    const repoName = repo.replace(/\.git$/, '');
    return { owner, repo: repoName };
  } catch (error) {
    throw new Error('Invalid repo URL');
  }
}

// The main function that will be exported
exports.fetchRepoContents = async (repoUrl, pat) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const headers = {
    'Authorization': `token ${pat}`,
    'Accept': 'application/vnd.github.v3.raw', // To get raw file content
  };
  const apiBase = 'https://api.github.com/repos';

  try {
    const pkgResponse = await fetch(`${apiBase}/${owner}/${repo}/contents/package.json`, { headers });
    if (!pkgResponse.ok) {
      throw new Error(`Failed to fetch package.json: ${pkgResponse.statusText}`);
    }
    const packageJson = await pkgResponse.text(); // Get raw text

    const repoInfoResponse = await fetch(`${apiBase}/${owner}/${repo}`, { headers: { 'Authorization': `token ${pat}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (!repoInfoResponse.ok) throw new Error('Failed to fetch repo info');
    const repoInfo = await repoInfoResponse.json();
    const defaultBranch = repoInfo.default_branch;

    // Now, get the file tree
    const treeResponse = await fetch(`${apiBase}/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers: { 'Authorization': `token ${pat}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (!treeResponse.ok) throw new Error('Failed to fetch file tree');
    const treeData = await treeResponse.json();
    
    // Filter to just get file paths, not directories
    const fileList = treeData.tree
      .filter(item => item.type === 'blob')
      .map(item => item.path);

    // (Optional) Try to get next.config.js if it's in the file list
    let nextConfig = "N/A";
    const nextConfigFile = fileList.find(f => f.startsWith('next.config.'));
    
    if (nextConfigFile) {
        const nextConfigResponse = await fetch(`${apiBase}/${owner}/${repo}/contents/${nextConfigFile}`, { headers });
        if(nextConfigResponse.ok) {
            nextConfig = await nextConfigResponse.text();
        }
    }

    // 3. Return the data
    return {
      packageJson: packageJson,
      fileList: fileList,
      nextConfig: nextConfig
    };

  } catch (error) {
    console.error('Error in fetchRepoContents:', error);
    throw new Error(`GitHub service failed: ${error.message}`);
  }
};

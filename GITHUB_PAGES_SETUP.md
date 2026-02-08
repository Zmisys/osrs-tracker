# GitHub Pages Setup Instructions

This document explains how to enable GitHub Pages for the OSRS Tracker repository.

## Enabling GitHub Pages

To host the `index.html` file using GitHub Pages, follow these steps:

### Option 1: Using GitHub Actions (Recommended)

The repository is already configured with a GitHub Actions workflow that will automatically deploy to GitHub Pages. You just need to enable GitHub Pages in the repository settings:

1. Go to the repository on GitHub: https://github.com/Zmisys/osrs-tracker
2. Click on **Settings** (top right of the repository page)
3. In the left sidebar, click on **Pages** (under "Code and automation")
4. Under **Source**, select **GitHub Actions**
5. The deployment will automatically trigger when you push to the main or master branch

### Option 2: Manual Deployment from Branch

Alternatively, you can deploy directly from a branch:

1. Go to repository **Settings** > **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Choose the branch (e.g., `main` or `copilot/host-index-html-file`)
4. Choose the folder: `/ (root)`
5. Click **Save**

## Accessing Your Site

Once GitHub Pages is enabled and deployed, your site will be available at:

```
https://zmisys.github.io/osrs-tracker/
```

Note: It may take a few minutes for the site to become available after the first deployment.

## Manual Deployment

You can manually trigger a deployment by:

1. Going to the **Actions** tab
2. Selecting the "Deploy to GitHub Pages" workflow
3. Clicking **Run workflow** button
4. Selecting the branch to deploy from
5. Clicking **Run workflow**

## Verification

After deployment, you can verify the deployment by:

1. Going to the **Actions** tab to see the deployment status
2. Once the workflow completes successfully, visit the GitHub Pages URL
3. Check the **Pages** section in Settings to see the deployment status and URL

## Troubleshooting

If the site doesn't load:

- Check that GitHub Pages is enabled in Settings > Pages
- Verify the workflow ran successfully in the Actions tab
- Wait a few minutes as DNS propagation can take time
- Check that the source is set to "GitHub Actions" in the Pages settings

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to the repository root with your domain name
2. In Settings > Pages, add your custom domain
3. Configure your domain's DNS records according to GitHub's instructions

---
description: How to publish the tasklets library to npm
---

Follow these steps to safely publish the `tasklets` library to the npm registry.

### 1. Preparation & Cleaning
Ensure the project is clean and all tests pass.
// turbo
```bash
npm run clean
npm test
```

### 2. Authentication
Ensure you are logged into your npm account. If not, run:
```bash
npm login
```
To verify your current session:
```bash
npm whoami
```

### 3. Dry-Run (Verification)
Check exactly what will be included in the final package without actually publishing.
// turbo
```bash
npm pack
```
This will generate a `tasklets-1.0.0.tgz` file. You can inspect its contents:
```bash
tar -tf tasklets-1.0.0.tgz
```

### 4. Build Prebuilds (Optional but Recommended)
The `prepublishOnly` script will do this automatically, but you can run it manually to be sure.
// turbo
```bash
npm run build:prebuilds
```

### 5. Official Publication
When ready, run the following command. This will trigger `prepublishOnly` (tests + prebuilds) and then push to npm.
```bash
npm publish --access public
```

> [!IMPORTANT]
> Since this package includes native C++ code, the `prebuilds/` directory is critical for cross-platform support without requiring the end-user to have build tools.

### 6. Cleanup
Remove the tarball generated during the dry-run.
// turbo
```bash
rm tasklets-1.0.0.tgz
```

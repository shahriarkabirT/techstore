module.exports = {
  hooks: {
    readPackage(pkg) {
      if (['core-js', 'sharp', 'unrs-resolver'].includes(pkg.name)) {
        pkg.pnpm = pkg.pnpm || {};
        pkg.pnpm.allowedBuildScripts = ['build'];
      }
      return pkg;
    }
  }
};

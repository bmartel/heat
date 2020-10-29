import fs from "fs";
import path from "path";
import crypto from "crypto";

import decompress from "decompress";
import decompressTargz from "decompress-targz";
import axios from "axios";
import Listr from "listr";
import execa from "execa";
import tmp from "tmp";
import checkNodeVersion from "check-node-version";
import chalk from "chalk";
import yargs from "yargs";

import { name, version, engines } from "../package.json";

const availablePackages = [];

const style = {
  error: chalk.bold.red,
  warning: chalk.keyword("orange"),
  success: chalk.greenBright,
  info: chalk.grey,
  header: chalk.bold.underline.hex("#e8e8e8"),
  cmd: chalk.hex("#808080"),
  green: chalk.green,
};

const NPM_URL = "https://registry.npmjs.org/@martel/heat-";

const getPackageUrl = (pkg) => NPM_URL + pkg;

const randomString = (len) =>
  crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);

const latestReleaseTarFile = async (pkg) => {
  const response = await axios.get(getPackageUrl(pkg));
  const latest = response.data["dist-tags"].latest;
  return response.data.versions[latest].dist.tarball;
};

const downloadFile = async (sourceUrl, targetFile) => {
  const writer = fs.createWriteStream(targetFile);
  const response = await axios.get(sourceUrl, {
    responseType: "stream",
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

const { _: args, "yarn-install": yarnInstall, packages } = yargs
  .scriptName(name)
  .usage("Usage: $0 <project directory> [option]")
  .example("$0 newapp")
  .option("yarn-install", {
    default: true,
    describe: "Skip yarn install with --no-yarn-install",
  })
  .option("packages", {
    default: "",
    describe: "Install list of packages with --packages",
  })
  .version(version)
  .strict().argv;

const targetDir = String(args).replace(/,/g, "-") || (packages ? "./" : "");
if (!targetDir) {
  console.error("Please specify the project directory");
  console.log(
    `  ${chalk.cyan("yarn create @martel/heat-app")} ${chalk.green(
      "<project-directory>"
    )}`
  );
  console.log();
  console.log("For example:");
  console.log(
    `  ${chalk.cyan("yarn create @martel/heat-app")} ${chalk.green(
      "my-heat-app"
    )}`
  );
  process.exit(1);
}

const emptyDirectory = (dir) =>
  !fs.existsSync(dir) || fs.readdirSync(dir).length < 1;

const packageList = packages.split(",");
const newAppDir = path.resolve(process.cwd(), targetDir);
const packagesDir = path.join(newAppDir, "./packages");
const appDirExists = fs.existsSync(newAppDir);

const createNewApp = !(appDirExists && fs.readdirSync(newAppDir).length > 0);
const installPackages = packageList.length > 0;

if (!(createNewApp || installPackages)) {
  console.error(`'${newAppDir}' already exists and is not empty.`);
  process.exit(1);
}

const installPackage = ({ pkg, pkgDir }) => {
  const tmpDownloadPath = tmp.tmpNameSync({
    prefix: `heat-${pkg}`,
    postfix: ".tgz",
  });
  return [
    {
      title: `Preparing directory '${pkgDir}'`,
      task: () => {
        fs.mkdirSync(pkgDir, { recursive: true });
      },
    },
    {
      title: `Downloading latest release of @martel/heat-${pkg}`,
      task: () => {
        return new Promise(async (resolve, reject) => {
          try {
            const url = await latestReleaseTarFile(pkg);
            await downloadFile(url, tmpDownloadPath);
            resolve(url);
          } catch (e) {
            reject(Error(`Unable to download package @martel/heat-${pkg} `));
          }
        });
      },
    },
    {
      title: `Extracting latest release of @martel/heat-${pkg}`,
      task: () =>
        decompress(tmpDownloadPath, pkgDir, {
          strip: 1,
          plugins: [decompressTargz()],
        }),
    },
    {
      title: `Finishing up install of @martel/heat-${pkg}`,
      task: () => {
        return new Promise((resolve, reject) => {
          try {
            const pkgPath = path.join(pkgDir, "package.json");
            const pkgContent = fs.readFileSync(pkgPath, "utf8");
            const pkg = JSON.parse(pkgContent);
            delete pkg.publishConfig;
            delete pkg.keywords;
            delete pkg.homepage;
            delete pkg.repository;
            delete pkg.bugs;
            delete pkg.directories;
            delete pkg.files;
            delete pkg.engines;
            pkg.name = pkg.name.replace("@martel/heat-", "@app/");
            pkg.version = "0.0.1";

            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            resolve(pkg);
          } catch (e) {
            reject(Error("Could not update package files"));
          }
        });
      },
    },
  ];
};

const createProjectTasks = ({ newAppDir }) => {
  const [prepare, download, extract, finish] = installPackage({
    pkg: "template",
    pkgDir: newAppDir,
  });
  return [
    prepare,
    download,
    extract,
    {
      title: finish.title,
      task: () => {
        return new Promise((resolve, reject) => {
          try {
            const appName = newAppDir.split("/").pop() || "heat-app";
            const pkgPath = path.join(newAppDir, "package.json");
            const pkgContent = fs.readFileSync(pkgPath, "utf8");
            const pkg = JSON.parse(pkgContent);
            delete pkg.publishConfig;
            delete pkg.keywords;
            pkg.name = appName;
            pkg.description = "TODO: Add description";
            pkg.version = "0.0.1";
            pkg.private = true;
            pkg.scripts.build = "lerna run build";

            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

            const envContent = fs.readFileSync(
              path.join(__dirname, "../stubs/env"),
              "utf8"
            );
            const secrets = {
              secret: randomString(32),
              dbpassword: randomString(32),
              dbusername: randomString(16),
              dbname: randomString(16),
            };
            fs.writeFileSync(
              path.join(newAppDir, ".env"),
              envContent
                .replace(":secret:", secrets.secret)
                .replace(":dbpassword:", secrets.dbpassword)
                .replace(":dbusername:", secrets.dbusername)
                .replace(":dbname:", secrets.dbname)
            );

            const initMongoScript = fs.readFileSync(
              path.join(__dirname, "../stubs/init-mongo.js"),
              "utf8"
            );
            fs.writeFileSync(
              path.join(newAppDir, "scripts/init-mongo.js"),
              initMongoScript
                .replace(":dbpassword:", secrets.dbpassword)
                .replace(":dbusername:", secrets.dbusername)
                .replace(":dbname:", secrets.dbname)
            );

            fs.writeFileSync(
              path.join(newAppDir, "Makefile"),
              fs.readFileSync(path.join(__dirname, "../stubs/Makefile"), "utf8")
            );

            const dockerfile = fs.readFileSync(
              path.join(__dirname, "../stubs/Dockerfile.pkg"),
              "utf8"
            );

            fs.writeFileSync(
              path.join(newAppDir, "packages/api/Dockerfile"),
              dockerfile.replace(/pkg/g, "api")
            );

            fs.writeFileSync(
              path.join(newAppDir, "packages/web/Dockerfile"),
              dockerfile.replace(/pkg/g, "web")
            );

            fs.writeFileSync(
              path.join(newAppDir, ".dockerignore"),
              fs.readFileSync(
                path.join(__dirname, "../stubs/dockerignore"),
                "utf8"
              )
            );

            fs.writeFileSync(
              path.join(newAppDir, ".npmignore"),
              fs.readFileSync(
                path.join(__dirname, "../stubs/npmignore"),
                "utf8"
              )
            );

            fs.writeFileSync(
              path.join(newAppDir, ".gitignore"),
              fs.readFileSync(
                path.join(__dirname, "../stubs/gitignore"),
                "utf8"
              )
            );

            fs.writeFileSync(
              path.join(newAppDir, "docker-compose.yml"),
              fs.readFileSync(
                path.join(__dirname, "../stubs/docker-compose.yml"),
                "utf8"
              )
            );

            resolve(pkg);
          } catch (e) {
            reject(Error("Could not update project files"));
          }
        });
      },
    },
  ];
};

const installProjectPackages = ({ newPackageDir }) => {
  return packageList
    .filter((pkg) => pkg !== "template")
    .reduce((installer, pkg) => {
      const pkgDir = path.join(newPackageDir, `./${pkg}`);
      if (emptyDirectory(pkgDir)) {
        const [prepare, download, extract, finish] = installPackage({
          pkg,
          pkgDir,
        });
        installer.push(prepare, download, extract, finish);
      }
      return installer;
    }, []);
};

const installNodeModulesTasks = ({ newAppDir }) => {
  return [
    {
      title: "Checking node and yarn compatibility",
      task: () => {
        return new Promise(async (resolve, reject) => {
          checkNodeVersion(engines, (_error, result) => {
            if (result.isSatisfied) {
              return resolve();
            }

            const errors = Object.keys(result.versions).map((name) => {
              const { version, wanted } = result.versions[name];
              return `${name} ${wanted} required, but you have ${version}.`;
            });
            return reject(new Error(errors.join("\n")));
          });
        });
      },
    },
    {
      title: "Running `yarn install`... (This could take a while)",
      skip: () => {
        if (yarnInstall === false) {
          return "skipped on request";
        }
      },
      task: () => {
        return execa("yarn install", {
          shell: true,
          cwd: newAppDir,
        });
      },
    },
  ];
};

const successMessage = createNewApp
  ? `We've created your app in '${style.cmd(newAppDir)}'`
  : `We've installed your packages in '${style.cmd(packagesDir)}'`;
new Listr(
  [
    createNewApp && {
      title: "Creating HEAT app",
      task: () => new Listr(createProjectTasks({ newAppDir })),
    },

    installPackages && {
      title: "Installing HEAT packages",
      task: () =>
        new Listr(installProjectPackages({ newPackageDir: packagesDir })),
    },
    {
      title: "Installing node_modules",
      task: () => new Listr(installNodeModulesTasks({ newAppDir })),
    },
  ].filter(Boolean),
  { collapse: false, exitOnError: true }
)
  .run()
  .then(() => {
    [
      "",
      style.success("Thanks for trying out HEAT!"),
      "",
      successMessage,
      `Enter the directory and run '${style.cmd(
        "yarn start"
      )}' to start the development server.`,
      "",
    ].map((item) => console.log(item));
  })
  .catch((e) => {
    console.log();
    console.log(e);
    process.exit(1);
  });

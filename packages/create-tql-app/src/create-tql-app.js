import fs from "fs";
import path from "path";

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

const style = {
  error: chalk.bold.red,
  warning: chalk.keyword("orange"),
  success: chalk.greenBright,
  info: chalk.grey,
  header: chalk.bold.underline.hex("#e8e8e8"),
  cmd: chalk.hex("#808080"),
  green: chalk.green,
};

const NPM_URL = "https://registry.npmjs.org/@martel/tql-template";

const latestReleaseTarFile = async () => {
  const response = await axios.get(NPM_URL);
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

const { _: args, "yarn-install": yarnInstall } = yargs
  .scriptName(name)
  .usage("Usage: $0 <project directory> [option]")
  .example("$0 newapp")
  .option("yarn-install", {
    default: true,
    describe: "Skip yarn install with --no-yarn-install",
  })
  .version(version)
  .strict().argv;

const targetDir = String(args).replace(/,/g, "-");
if (!targetDir) {
  console.error("Please specify the project directory");
  console.log(
    `  ${chalk.cyan("yarn create @martel/tql-app")} ${chalk.green(
      "<project-directory>"
    )}`
  );
  console.log();
  console.log("For example:");
  console.log(
    `  ${chalk.cyan("yarn create @martel/tql-app")} ${chalk.green(
      "my-tql-app"
    )}`
  );
  process.exit(1);
}

const newAppDir = path.resolve(process.cwd(), targetDir);
const appDirExists = fs.existsSync(newAppDir);

if (appDirExists && fs.readdirSync(newAppDir).length > 0) {
  console.error(`'${newAppDir}' already exists and is not empty.`);
  process.exit(1);
}

const createProjectTasks = ({ newAppDir }) => {
  const tmpDownloadPath = tmp.tmpNameSync({
    prefix: "tql",
    postfix: ".tgz",
  });

  return [
    {
      title: `${appDirExists ? "Using" : "Creating"} directory '${newAppDir}'`,
      task: () => {
        fs.mkdirSync(newAppDir, { recursive: true });
      },
    },
    {
      title: "Downloading latest release",
      task: async () => {
        const url = await latestReleaseTarFile();
        return downloadFile(url, tmpDownloadPath);
      },
    },
    {
      title: "Extracting latest release",
      task: () =>
        decompress(tmpDownloadPath, newAppDir, {
          strip: 1,
          plugins: [decompressTargz()],
        }),
    },
    {
      title: "Clean up",
      task: async () => {
        try {
          const pkgPath = path.join(newAppDir, "package.json");
          const { default: pkg } = await import(pkgPath);
          pkg.private = true;
          fs.writeSync(pkgPath, JSON.stringify(pkg));
        } catch (e) {
          throw new Error("Could not move project files");
        }
      },
    },
  ];
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

new Listr(
  [
    {
      title: "Creating TQL app",
      task: () => new Listr(createProjectTasks({ newAppDir })),
    },
    {
      title: "Installing packages",
      task: () => new Listr(installNodeModulesTasks({ newAppDir })),
    },
  ],
  { collapse: false, exitOnError: true }
)
  .run()
  .then(() => {
    [
      "",
      style.success("Thanks for trying out TQL!"),
      "",
      `We've created your app in '${style.cmd(newAppDir)}'`,
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

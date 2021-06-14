"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const utils_1 = require("@actions/github/lib/utils");
const getCommitRef = () => {
    if (utils_1.context.eventName === 'push') {
        return {
            base: utils_1.context.payload.before,
            head: utils_1.context.payload.after,
        };
    }
    if (utils_1.context.eventName === 'pull_request' && utils_1.context.payload.pull_request) {
        return {
            base: utils_1.context.payload.pull_request.base.sha,
            head: utils_1.context.payload.pull_request.head.sha,
        };
    }
    core_1.setFailed(`Failed to retrieve the base and head commits for this ${utils_1.context.eventName}`);
};
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = core_1.getInput('token', { required: true });
        const octokit = github_1.getOctokit(token);
        const commitRef = getCommitRef();
        core_1.info(`Env: ${JSON.stringify(process.env, null, 2)} `);
        core_1.info(`Context: ${JSON.stringify(utils_1.context, null, 2)}`);
        core_1.info(`Base commit: ${commitRef === null || commitRef === void 0 ? void 0 : commitRef.base}`);
        core_1.info(`Head commit: ${commitRef === null || commitRef === void 0 ? void 0 : commitRef.head}`);
        const response = yield octokit.rest.repos.compareCommits({
            owner: utils_1.context.repo.owner,
            repo: utils_1.context.repo.repo,
            base: commitRef === null || commitRef === void 0 ? void 0 : commitRef.base,
            head: commitRef === null || commitRef === void 0 ? void 0 : commitRef.head,
        });
        core_1.info(`Eventname ${utils_1.context.eventName}`);
        if (response.status !== 200)
            core_1.setFailed(`Comparing the base and head commits for this ${utils_1.context.eventName} event returned ${response.status}, expected 200.`);
        if (response.data.status === 'behind')
            core_1.setFailed(`The head commit for this ${utils_1.context.eventName} event is not ahead of the base commit`);
        const packages = new Set();
        const files = response.data.files || [];
        for (const file of files) {
            const filename = file.filename;
            const result = filename.match(/^packages\/([\w-]+)/);
            if (result) {
                packages.add(result[1]);
            }
        }
        core_1.info(`List packages: ${Array.from(packages).join(',')}`);
        core_1.setOutput('packages', Array.from(packages).join(','));
    }
    catch (error) {
        core_1.setFailed(error);
    }
});
main();
//# sourceMappingURL=index.js.map
import GlobalConfiguration from "@/GlobalConfiguration";
import { Mutex } from "@utils/Semaphore";
import { isEmpty } from "@utils/String";
import { Anticaptcha } from "./Anticaptcha";

const mutex = new Mutex();

export default class RecaptchaHandler {
  public static getResponse(sitekey: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const release = await mutex.acquire();
      if (!isEmpty(GlobalConfiguration.anticaptchaKey)) {
        const ac = new Anticaptcha(GlobalConfiguration.anticaptchaKey);
        try {
          const balance = await ac.getBalance();
          if (balance > 0) {
            ac.websiteUrl = "https://proxyconnection.touch.dofus.com/recaptcha";
            ac.websiteKey = sitekey;

            const task = await ac.createTaskProxyless();
            const solution = await ac.getTaskSolution(task.taskId, 0, (res) => {
              // logger.verbose("intermediate", res);
            });
            // logger.verbose(`SOLUTION`, solution);
            release();
            return resolve(solution.solution.gRecaptchaResponse);
          } else {
            // logger.error("AntiCaptcha - Contact DevChris#4592 on Discord :)");
            // return process.exit();
          }
        } catch (error) {
          release();
          return reject(error);
        }
      }
      release();
      return resolve(null);
    });
  }
}

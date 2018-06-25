import GlobalConfiguration from "@/configurations/GlobalConfiguration";
import { Mutex } from "@/utils/Semaphore";
import { isEmpty } from "@/utils/String";
import { AntiCaptcha } from "anticaptcha";

const mutex = new Mutex();

export default class RecaptchaHandler {
  public static async getResponse(sitekey: string): Promise<string> {
    const release = await mutex.acquire();
    if (!isEmpty(GlobalConfiguration.anticaptchaKey)) {
      const ac = new AntiCaptcha(GlobalConfiguration.anticaptchaKey);
      if (await !ac.isBalanceGreaterThan(0)) {
        release();
        return null;
      } else {
        const taskId = await ac.createTask(
          "https://proxyconnection.touch.dofus.com/recaptcha",
          sitekey
        );

        const response = await ac.getTaskResult(taskId);
        return response.solution.gRecaptchaResponse;
      }
    }
    release();
    return null;
  }
}
